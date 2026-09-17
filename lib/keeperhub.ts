import { getConfig } from "@/lib/config";
import { demoExecution } from "@/lib/demo";
import type { KeeperHubExecution, PayoutManifest } from "@/lib/domain";
import { fetchJson } from "@/lib/http";

type KeeperHubEnvelope = Record<string, unknown>;

function authHeaders(): HeadersInit {
  const key = getConfig().KEEPERHUB_API_KEY;
  return { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) };
}

function parseExecution(payload: KeeperHubEnvelope, fallbackWorkflowId: string): KeeperHubExecution {
  const hashes = Array.isArray(payload.transactionHashes) ? payload.transactionHashes as Array<Record<string, unknown>> : [];
  const first = hashes[0];
  const rawStatus = String(payload.status ?? "unknown");
  const status = (["pending", "running", "success", "error", "cancelled"] as const).find((s) => s === rawStatus) ?? "unknown";
  const hash = first?.hash ? String(first.hash) : payload.transactionHash ? String(payload.transactionHash) : undefined;
  return {
    executionId: String(payload.executionId ?? payload.id ?? ""),
    workflowId: String(payload.workflowId ?? fallbackWorkflowId),
    status,
    completed: Boolean(payload.completed ?? ["success", "error", "cancelled"].includes(status)),
    transactionHash: hash,
    transactionLink: payload.transactionLink ? String(payload.transactionLink) : hash ? `https://optimistic.etherscan.io/tx/${hash}` : undefined,
    error: payload.error ? String(payload.error) : undefined,
    logs: Array.isArray(payload.logs) ? payload.logs : undefined
  };
}

export function keeperHubWorkflowDefinition(manifest: PayoutManifest) {
  const projectSupport = manifest.kind === "project_support";
  return {
    name: projectSupport
      ? `GrantRail · support · ${manifest.karmaProjectSlug}`
      : `GrantRail · ${manifest.karmaProjectSlug} · tranche ${manifest.tranche}`,
    description: projectSupport
      ? `Frozen project-support transfer to the chain-specific recipient published by Karma project ${manifest.karmaProjectUID}. Evidence: ${manifest.evidenceUrl}`
      : `Frozen payout for Karma milestone ${manifest.karmaMilestoneUID}. Manifest evidence: ${manifest.evidenceUrl}`,
    enabled: false,
    nodes: [
      {
        id: "manual-approval",
        type: "trigger",
        data: { label: "GrantRail approval", config: { triggerType: "Manual" } }
      },
      {
        id: "transfer-usdc",
        type: "action",
        data: {
          label: "Transfer approved USDC tranche",
          config: {
            actionType: "web3/transfer-token",
            network: String(manifest.chainId),
            recipientAddress: manifest.recipient,
            tokenConfig: JSON.stringify({
              mode: "custom",
              customToken: { address: manifest.tokenAddress, symbol: manifest.tokenSymbol }
            }),
            amount: manifest.amount
          }
        }
      }
    ],
    edges: [{ id: "approval-to-transfer", source: "manual-approval", target: "transfer-usdc" }]
  };
}

export class KeeperHubClient {
  private readonly config = getConfig();

  async createWorkflow(manifest: PayoutManifest, idempotencyKey: string): Promise<string> {
    if (this.config.demo) return "wf_demo_grantrail_v1";
    if (this.config.KEEPERHUB_WORKFLOW_ID) return this.config.KEEPERHUB_WORKFLOW_ID;
    const result = await fetchJson<KeeperHubEnvelope>(`${this.config.KEEPERHUB_API_BASE_URL}/workflows/create`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...keeperHubWorkflowDefinition(manifest), idempotency_key: idempotencyKey })
    }, 55_000);
    const id = result.id ?? result.workflowId;
    if (!id) throw new Error("KeeperHub created a workflow without returning an ID");
    return String(id);
  }

  async simulateWorkflow(workflowId: string): Promise<Record<string, unknown>> {
    if (this.config.demo) return { success: true, status: "simulated", wouldRevert: false, gasEstimate: "65000" };
    const result = await fetchJson<Record<string, unknown>>(`${this.config.KEEPERHUB_API_BASE_URL}/workflows/${encodeURIComponent(workflowId)}/simulate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({})
    }, 20_000);
    const issues = Array.isArray(result.issues) ? result.issues as Array<Record<string, unknown>> : [];
    const blocking = issues.find((issue) => issue.wouldRevert === true || issue.severity === "error");
    if (blocking) throw new Error(`KeeperHub preflight reported a blocking issue: ${JSON.stringify(blocking)}`);
    return result;
  }

  async executeWorkflow(workflowId: string, idempotencyKey: string): Promise<KeeperHubExecution> {
    if (this.config.demo) return demoExecution(workflowId, idempotencyKey);
    const payload = await fetchJson<KeeperHubEnvelope>(`${this.config.KEEPERHUB_API_BASE_URL}/workflows/${encodeURIComponent(workflowId)}/execute`, {
      method: "POST",
      headers: { ...authHeaders(), "idempotency-key": idempotencyKey },
      body: JSON.stringify({ input: { grantrailIdempotencyKey: idempotencyKey } })
    }, 65_000);
    return parseExecution(payload, workflowId);
  }

  async waitForExecution(workflowId: string, executionId: string): Promise<KeeperHubExecution> {
    if (this.config.demo) return demoExecution(workflowId);
    const timeout = Math.min(this.config.CONFIRMATION_TIMEOUT_MS, 60_000);
    const payload = await fetchJson<KeeperHubEnvelope>(
      `${this.config.KEEPERHUB_API_BASE_URL}/workflows/executions/${encodeURIComponent(executionId)}/wait?timeoutMs=${timeout}`,
      { headers: authHeaders() }, timeout + 5_000
    );
    return parseExecution(payload, workflowId);
  }

  async getLogs(executionId: string): Promise<unknown[]> {
    if (this.config.demo) return demoExecution("wf_demo_grantrail_v1").logs ?? [];
    const payload = await fetchJson<KeeperHubEnvelope>(`${this.config.KEEPERHUB_API_BASE_URL}/workflows/executions/${encodeURIComponent(executionId)}/logs`, {
      headers: authHeaders()
    });
    return Array.isArray(payload.logs) ? payload.logs : [];
  }
}
