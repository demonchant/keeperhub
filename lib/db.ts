import { createClient, type Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { getConfig } from "@/lib/config";
import { canTransition, payoutManifestSchema, payoutStatusSchema, type AuditEvent, type PayoutManifest, type PayoutRecord, type PayoutStatus } from "@/lib/domain";

let client: Client | undefined;
let initialized: Promise<void> | undefined;

function getClient(): Client {
  if (!client) {
    const config = getConfig();
    client = createClient({ url: config.DATABASE_URL, authToken: config.DATABASE_AUTH_TOKEN || undefined });
  }
  return client;
}

export async function initializeDatabase(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      const db = getClient();
      await db.batch([
        `CREATE TABLE IF NOT EXISTS payouts (
          id TEXT PRIMARY KEY,
          idempotency_key TEXT NOT NULL UNIQUE,
          manifest_json TEXT NOT NULL,
          manifest_hash TEXT NOT NULL,
          status TEXT NOT NULL,
          workflow_id TEXT,
          execution_id TEXT UNIQUE,
          transaction_hash TEXT UNIQUE,
          transaction_link TEXT,
          failure_reason TEXT,
          demo INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS audit_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payout_id TEXT NOT NULL,
          from_status TEXT,
          to_status TEXT NOT NULL,
          event TEXT NOT NULL,
          detail_json TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (payout_id) REFERENCES payouts(id)
        )`,
        "CREATE INDEX IF NOT EXISTS idx_audit_payout ON audit_events(payout_id, id)",
        "CREATE INDEX IF NOT EXISTS idx_payout_status ON payouts(status)"
      ], "write");
    })();
  }
  return initialized;
}

function rowToPayout(row: Record<string, unknown>): PayoutRecord {
  return {
    id: String(row.id),
    idempotencyKey: String(row.idempotency_key),
    manifest: payoutManifestSchema.parse(JSON.parse(String(row.manifest_json))),
    manifestHash: String(row.manifest_hash),
    status: payoutStatusSchema.parse(row.status),
    workflowId: row.workflow_id ? String(row.workflow_id) : undefined,
    executionId: row.execution_id ? String(row.execution_id) : undefined,
    transactionHash: row.transaction_hash ? String(row.transaction_hash) : undefined,
    transactionLink: row.transaction_link ? String(row.transaction_link) : undefined,
    failureReason: row.failure_reason ? String(row.failure_reason) : undefined,
    demo: Boolean(row.demo),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export async function createPayout(input: {
  idempotencyKey: string;
  manifest: PayoutManifest;
  manifestHash: string;
  demo: boolean;
}): Promise<{ record: PayoutRecord; created: boolean }> {
  await initializeDatabase();
  const existing = await findByIdempotencyKey(input.idempotencyKey);
  if (existing) return { record: existing, created: false };

  const id = `pay_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const now = new Date().toISOString();
  try {
    await getClient().batch([
      {
        sql: `INSERT INTO payouts (id, idempotency_key, manifest_json, manifest_hash, status, demo, created_at, updated_at)
              VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?)`,
        args: [id, input.idempotencyKey, JSON.stringify(input.manifest), input.manifestHash, input.demo ? 1 : 0, now, now]
      },
      {
        sql: `INSERT INTO audit_events (payout_id, from_status, to_status, event, detail_json, created_at)
              VALUES (?, NULL, 'DRAFT', 'manifest_created', ?, ?)`,
        args: [id, JSON.stringify({ manifestHash: input.manifestHash, demo: input.demo }), now]
      }
    ], "write");
  } catch (error) {
    const raced = await findByIdempotencyKey(input.idempotencyKey);
    if (raced) return { record: raced, created: false };
    throw error;
  }
  return { record: (await getPayout(id))!, created: true };
}

export async function getPayout(id: string): Promise<PayoutRecord | null> {
  await initializeDatabase();
  const result = await getClient().execute({ sql: "SELECT * FROM payouts WHERE id = ?", args: [id] });
  return result.rows[0] ? rowToPayout(result.rows[0] as Record<string, unknown>) : null;
}

export async function findByIdempotencyKey(key: string): Promise<PayoutRecord | null> {
  await initializeDatabase();
  const result = await getClient().execute({ sql: "SELECT * FROM payouts WHERE idempotency_key = ?", args: [key] });
  return result.rows[0] ? rowToPayout(result.rows[0] as Record<string, unknown>) : null;
}

export async function listPayouts(limit = 20): Promise<PayoutRecord[]> {
  await initializeDatabase();
  const result = await getClient().execute({ sql: "SELECT * FROM payouts ORDER BY created_at DESC LIMIT ?", args: [Math.min(limit, 100)] });
  return result.rows.map((row) => rowToPayout(row as Record<string, unknown>));
}

export async function transitionPayout(
  id: string,
  toStatus: PayoutStatus,
  event: string,
  patch: Partial<Pick<PayoutRecord, "workflowId" | "executionId" | "transactionHash" | "transactionLink" | "failureReason">> = {},
  detail: Record<string, unknown> = {}
): Promise<PayoutRecord> {
  const current = await getPayout(id);
  if (!current) throw new Error("Payout not found");
  if (current.status === toStatus) return current;
  if (!canTransition(current.status, toStatus)) throw new Error(`Invalid payout transition: ${current.status} -> ${toStatus}`);

  const now = new Date().toISOString();
  const result = await getClient().batch([
    {
      sql: `UPDATE payouts SET status = ?, workflow_id = COALESCE(?, workflow_id), execution_id = COALESCE(?, execution_id),
            transaction_hash = COALESCE(?, transaction_hash), transaction_link = COALESCE(?, transaction_link),
            failure_reason = COALESCE(?, failure_reason), updated_at = ? WHERE id = ? AND status = ?`,
      args: [toStatus, patch.workflowId ?? null, patch.executionId ?? null, patch.transactionHash ?? null, patch.transactionLink ?? null, patch.failureReason ?? null, now, id, current.status]
    },
    {
      sql: `INSERT INTO audit_events (payout_id, from_status, to_status, event, detail_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, current.status, toStatus, event, JSON.stringify(detail), now]
    }
  ], "write");
  if (result[0].rowsAffected !== 1) throw new Error("Concurrent payout update detected; reload before retrying");
  return (await getPayout(id))!;
}

export async function attachWorkflow(id: string, workflowId: string): Promise<PayoutRecord> {
  const current = await getPayout(id);
  if (!current) throw new Error("Payout not found");
  if (current.workflowId) {
    if (current.workflowId !== workflowId) throw new Error("A different KeeperHub workflow is already attached");
    return current;
  }
  if (current.status !== "VALIDATED") throw new Error(`Cannot attach a workflow from ${current.status}`);

  const now = new Date().toISOString();
  const result = await getClient().batch([
    {
      sql: "UPDATE payouts SET workflow_id = ?, updated_at = ? WHERE id = ? AND status = 'VALIDATED' AND workflow_id IS NULL",
      args: [workflowId, now, id]
    },
    {
      sql: `INSERT INTO audit_events (payout_id, from_status, to_status, event, detail_json, created_at)
            VALUES (?, 'VALIDATED', 'VALIDATED', 'keeperhub_workflow_attached', ?, ?)`,
      args: [id, JSON.stringify({ workflowId }), now]
    }
  ], "write");
  if (result[0].rowsAffected !== 1) throw new Error("Concurrent KeeperHub workflow attachment detected");
  return (await getPayout(id))!;
}

export async function getAuditEvents(payoutId: string): Promise<AuditEvent[]> {
  await initializeDatabase();
  const result = await getClient().execute({ sql: "SELECT * FROM audit_events WHERE payout_id = ? ORDER BY id ASC", args: [payoutId] });
  return result.rows.map((row) => ({
    id: Number(row.id),
    payoutId: String(row.payout_id),
    fromStatus: row.from_status ? payoutStatusSchema.parse(row.from_status) : undefined,
    toStatus: payoutStatusSchema.parse(row.to_status),
    event: String(row.event),
    detail: row.detail_json ? JSON.parse(String(row.detail_json)) : undefined,
    createdAt: String(row.created_at)
  }));
}

export async function resetDatabaseForTests(): Promise<void> {
  await initializeDatabase();
  await getClient().batch(["DELETE FROM audit_events", "DELETE FROM payouts"], "write");
}
