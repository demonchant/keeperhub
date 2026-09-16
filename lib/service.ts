import { hashManifest, idempotencyKey } from "@/lib/canonical";
import { createPayout, getAuditEvents, getPayout, transitionPayout } from "@/lib/db";
import { payoutManifestSchema, type PayoutRecord, type PreparePayoutInput } from "@/lib/domain";
import { KarmaClient } from "@/lib/karma";
import { KeeperHubClient } from "@/lib/keeperhub";
import { assertPolicy } from "@/lib/policy";

export class PayoutService {
  constructor(
    private readonly karma = new KarmaClient(),
    private readonly keeperHub = new KeeperHubClient()
  ) {}

  async prepare(input: PreparePayoutInput): Promise<PayoutRecord> {
    const milestone = await this.karma.getMilestone(input.karmaProjectSlug, input.karmaGrantUID, input.karmaMilestoneUID);
    if (milestone.uid.toLowerCase() !== input.karmaMilestoneUID.toLowerCase() || milestone.grantUID.toLowerCase() !== input.karmaGrantUID.toLowerCase() || milestone.projectSlug !== input.karmaProjectSlug) {
      throw new Error("Karma returned evidence that does not match the requested project, grant and milestone");
    }
    if (milestone.status !== "approved" || !milestone.approvalAttestationUID || milestone.approvalRevoked || milestone.revoked) {
      throw new Error("The selected Karma milestone does not have a live approval attestation");
    }
    if (milestone.recipient.toLowerCase() !== input.recipient.toLowerCase()) {
      throw new Error("Recipient does not match the Karma grant payout address");
    }

    const manifest = assertPolicy(payoutManifestSchema.parse({
      ...input,
      version: 1,
      approvalAttestationUID: milestone.approvalAttestationUID,
      requiredStatus: "approved",
      tokenSymbol: "USDC",
      tokenDecimals: 6,
      evidenceUrl: milestone.evidenceUrl,
      createdAt: new Date().toISOString()
    }));
    const key = idempotencyKey(manifest);
    const result = await createPayout({ idempotencyKey: key, manifest, manifestHash: hashManifest(manifest), demo: process.env.GRANTRAIL_MODE !== "production" });
    if (!result.created) return result.record;

    const record = await transitionPayout(result.record.id, "VALIDATED", "policy_validated", {}, { karmaStatus: milestone.status });
    const workflowId = await this.keeperHub.createWorkflow(manifest, key);
    const simulation = await this.keeperHub.simulateWorkflow(workflowId);
    return transitionPayout(record.id, "SIMULATED", "workflow_simulated", { workflowId }, { workflowId, simulation });
  }

  async approve(id: string, suppliedHash: string): Promise<PayoutRecord> {
    let record = await getPayout(id);
    if (!record) throw new Error("Payout not found");
    if (["FROZEN", "EXECUTING", "CONFIRMING", "VERIFIED"].includes(record.status)) return record;
    if (record.status !== "SIMULATED") throw new Error(`Payout cannot be approved from ${record.status}`);
    if (hashManifest(record.manifest) !== record.manifestHash || suppliedHash !== record.manifestHash) {
      return transitionPayout(id, "BLOCKED", "approval_hash_mismatch", { failureReason: "Manifest hash mismatch during approval" });
    }
    record = await transitionPayout(id, "APPROVED", "operator_approved", {}, {
      manifestHash: record.manifestHash,
      approvalAttestationUID: record.manifest.approvalAttestationUID
    });
    return transitionPayout(record.id, "FROZEN", "manifest_frozen", {}, { manifestHash: record.manifestHash });
  }

  async execute(id: string, suppliedHash: string): Promise<PayoutRecord> {
    let record = await getPayout(id);
    if (!record) throw new Error("Payout not found");
    if (record.status === "VERIFIED" || record.status === "CONFIRMING" || record.status === "EXECUTING") return record;
    if (record.status !== "FROZEN") throw new Error(`Payout cannot execute from ${record.status}`);
    if (hashManifest(record.manifest) !== record.manifestHash || suppliedHash !== record.manifestHash) {
      return transitionPayout(id, "BLOCKED", "manifest_integrity_failed", { failureReason: "Manifest hash mismatch" });
    }

    const currentMilestone = await this.karma.verifyApproved({
      projectSlug: record.manifest.karmaProjectSlug,
      grantUID: record.manifest.karmaGrantUID,
      uid: record.manifest.karmaMilestoneUID,
      recipient: record.manifest.recipient
    });
    if (currentMilestone.approvalAttestationUID?.toLowerCase() !== record.manifest.approvalAttestationUID.toLowerCase()) {
      return transitionPayout(id, "BLOCKED", "approval_changed", { failureReason: "Approval attestation changed after freeze" });
    }

    record = await transitionPayout(id, "EXECUTING", "keeperhub_execution_started");
    if (!record.workflowId) return transitionPayout(id, "FAILED", "missing_workflow", { failureReason: "Missing KeeperHub workflow ID" });

    try {
      const started = await this.keeperHub.executeWorkflow(record.workflowId, record.idempotencyKey);
      if (!started.executionId) throw new Error("KeeperHub did not return an execution ID");
      record = await transitionPayout(id, "CONFIRMING", "keeperhub_execution_submitted", {
        executionId: started.executionId,
        transactionHash: started.transactionHash,
        transactionLink: started.transactionLink
      });
      const workflowId = record.workflowId;
      if (!workflowId) throw new Error("Workflow ID was lost during execution state transition");
      const settled = started.completed ? started : await this.keeperHub.waitForExecution(workflowId, started.executionId);
      if (!settled.completed) {
        return transitionPayout(id, "RECONCILIATION_REQUIRED", "confirmation_timeout", { failureReason: "KeeperHub execution remains non-terminal" });
      }
      if (settled.status !== "success" || !settled.transactionHash) {
        return transitionPayout(id, "FAILED", "keeperhub_execution_failed", { failureReason: settled.error ?? `KeeperHub status: ${settled.status}` });
      }
      return transitionPayout(id, "VERIFIED", "transaction_verified", {
        transactionHash: settled.transactionHash,
        transactionLink: settled.transactionLink
      }, { demo: record.demo, transactionHash: settled.transactionHash });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown KeeperHub error";
      return transitionPayout(id, "RECONCILIATION_REQUIRED", "ambiguous_execution", { failureReason: reason });
    }
  }

  async receipt(id: string) {
    const payout = await getPayout(id);
    if (!payout) return null;
    const events = await getAuditEvents(id);
    const logs = payout.executionId ? await this.keeperHub.getLogs(payout.executionId).catch(() => []) : [];
    return { payout, events, logs };
  }
}
