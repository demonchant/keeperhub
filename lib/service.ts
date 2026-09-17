import { hashManifest, idempotencyKey } from "@/lib/canonical";
import { attachWorkflow, createPayout, getAuditEvents, getPayout, transitionPayout } from "@/lib/db";
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
    if (input.kind === "project_support") return this.prepareProjectSupport(input);

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
      kind: "milestone_payout",
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
    if (!result.created) return this.ensureSimulated(result.record);

    const record = await transitionPayout(result.record.id, "VALIDATED", "policy_validated", {}, { karmaStatus: milestone.status });
    return this.ensureSimulated(record);
  }

  private async prepareProjectSupport(input: Extract<PreparePayoutInput, { kind: "project_support" }>): Promise<PayoutRecord> {
    const project = await this.karma.getProjectSupport(input.karmaProjectSlug, input.chainId);
    const manifest = assertPolicy(payoutManifestSchema.parse({
      ...input,
      version: 1,
      karmaProjectUID: project.uid,
      requiredStatus: "donations_enabled",
      tokenSymbol: "USDC",
      tokenDecimals: 6,
      recipient: project.recipient,
      evidenceUrl: project.evidenceUrl,
      createdAt: new Date().toISOString()
    }));
    if (manifest.kind !== "project_support") throw new Error("Invalid project support manifest");

    const key = idempotencyKey(manifest);
    const result = await createPayout({ idempotencyKey: key, manifest, manifestHash: hashManifest(manifest), demo: process.env.GRANTRAIL_MODE !== "production" });
    if (!result.created) return this.ensureSimulated(result.record);

    const record = await transitionPayout(result.record.id, "VALIDATED", "karma_donation_recipient_validated", {}, {
      karmaProjectUID: project.uid,
      karmaProjectSlug: project.slug,
      chainId: project.chainId,
      recipient: project.recipient
    });
    return this.ensureSimulated(record);
  }

  private async ensureSimulated(record: PayoutRecord): Promise<PayoutRecord> {
    if (record.status !== "VALIDATED") return record;
    let workflowId = record.workflowId;
    if (!workflowId) {
      workflowId = await this.keeperHub.createWorkflow(record.manifest, record.idempotencyKey);
      record = await attachWorkflow(record.id, workflowId);
    }
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
      evidenceAnchor: record.manifest.kind === "milestone_payout"
        ? record.manifest.approvalAttestationUID
        : record.manifest.karmaProjectUID
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

    if (record.manifest.kind === "project_support") {
      const currentProject = await this.karma.getProjectSupport(record.manifest.karmaProjectSlug, record.manifest.chainId);
      if (currentProject.uid.toLowerCase() !== record.manifest.karmaProjectUID.toLowerCase()) {
        return transitionPayout(id, "BLOCKED", "karma_project_changed", { failureReason: "Karma project identity changed after freeze" });
      }
      if (currentProject.recipient.toLowerCase() !== record.manifest.recipient.toLowerCase()) {
        return transitionPayout(id, "BLOCKED", "donation_recipient_changed", { failureReason: "Karma donation recipient changed after freeze" });
      }
    } else {
      const currentMilestone = await this.karma.verifyApproved({
        projectSlug: record.manifest.karmaProjectSlug,
        grantUID: record.manifest.karmaGrantUID,
        uid: record.manifest.karmaMilestoneUID,
        recipient: record.manifest.recipient
      });
      if (currentMilestone.approvalAttestationUID?.toLowerCase() !== record.manifest.approvalAttestationUID.toLowerCase()) {
        return transitionPayout(id, "BLOCKED", "approval_changed", { failureReason: "Approval attestation changed after freeze" });
      }
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
