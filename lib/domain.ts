import { z } from "zod";

export const HEX_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
export const HEX_UID = /^0x[a-fA-F0-9]{64}$/;
export const TX_HASH = /^0x[a-fA-F0-9]{64}$/;

export const payoutStatusSchema = z.enum([
  "DRAFT",
  "VALIDATED",
  "SIMULATED",
  "APPROVED",
  "FROZEN",
  "EXECUTING",
  "CONFIRMING",
  "VERIFIED",
  "BLOCKED",
  "FAILED",
  "RECONCILIATION_REQUIRED"
]);

export type PayoutStatus = z.infer<typeof payoutStatusSchema>;

export const milestonePayoutManifestSchema = z.object({
  kind: z.literal("milestone_payout").default("milestone_payout"),
  version: z.literal(1).default(1),
  karmaProjectSlug: z.string().min(2).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/),
  karmaGrantUID: z.string().regex(HEX_UID),
  karmaMilestoneUID: z.string().regex(HEX_UID),
  approvalAttestationUID: z.string().regex(HEX_UID),
  requiredStatus: z.literal("approved"),
  chainId: z.number().int().positive(),
  tokenAddress: z.string().regex(HEX_ADDRESS),
  tokenSymbol: z.literal("USDC"),
  tokenDecimals: z.literal(6),
  recipient: z.string().regex(HEX_ADDRESS),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  tranche: z.number().int().positive(),
  evidenceUrl: z.string().url(),
  createdAt: z.string().datetime()
}).strict();

export const projectSupportManifestSchema = z.object({
  kind: z.literal("project_support"),
  version: z.literal(1).default(1),
  karmaProjectSlug: z.string().min(2).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/),
  karmaProjectUID: z.string().regex(HEX_UID),
  requiredStatus: z.literal("donations_enabled"),
  chainId: z.number().int().positive(),
  tokenAddress: z.string().regex(HEX_ADDRESS),
  tokenSymbol: z.literal("USDC"),
  tokenDecimals: z.literal(6),
  recipient: z.string().regex(HEX_ADDRESS),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  evidenceUrl: z.string().url(),
  createdAt: z.string().datetime()
}).strict();

export const payoutManifestSchema = z.union([
  milestonePayoutManifestSchema,
  projectSupportManifestSchema
]);

export type MilestonePayoutManifest = z.infer<typeof milestonePayoutManifestSchema>;
export type ProjectSupportManifest = z.infer<typeof projectSupportManifestSchema>;
export type PayoutManifest = z.infer<typeof payoutManifestSchema>;

export const prepareMilestonePayoutSchema = milestonePayoutManifestSchema.omit({
  kind: true,
  version: true,
  approvalAttestationUID: true,
  requiredStatus: true,
  tokenSymbol: true,
  tokenDecimals: true,
  createdAt: true
});

export const prepareProjectSupportSchema = z.object({
  kind: z.literal("project_support"),
  karmaProjectSlug: z.string().min(2).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/),
  chainId: z.number().int().positive(),
  tokenAddress: z.string().regex(HEX_ADDRESS),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/)
}).strict();

export const preparePayoutSchema = z.union([
  prepareProjectSupportSchema,
  prepareMilestonePayoutSchema.transform((value) => ({ ...value, kind: "milestone_payout" as const }))
]);

export type PreparePayoutInput = z.infer<typeof preparePayoutSchema>;

export interface KarmaMilestone {
  uid: string;
  grantUID: string;
  projectSlug: string;
  title: string;
  description: string;
  endsAt: number;
  recipient: string;
  revoked: boolean;
  status: "pending" | "completed" | "approved" | "rejected";
  approvalAttestationUID?: string;
  approvalRevoked: boolean;
  evidenceUrl: string;
}

export interface KarmaProjectSupport {
  uid: string;
  slug: string;
  title: string;
  chainId: number;
  recipient: string;
  evidenceUrl: string;
}

export interface KeeperHubExecution {
  executionId: string;
  workflowId: string;
  status: "pending" | "running" | "success" | "error" | "cancelled" | "unknown";
  completed: boolean;
  transactionHash?: string;
  transactionLink?: string;
  error?: string;
  logs?: unknown[];
}

export interface PayoutRecord {
  id: string;
  idempotencyKey: string;
  manifest: PayoutManifest;
  manifestHash: string;
  status: PayoutStatus;
  workflowId?: string;
  executionId?: string;
  transactionHash?: string;
  transactionLink?: string;
  failureReason?: string;
  demo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: number;
  payoutId: string;
  fromStatus?: PayoutStatus;
  toStatus: PayoutStatus;
  event: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

const transitions: Record<PayoutStatus, readonly PayoutStatus[]> = {
  DRAFT: ["VALIDATED", "BLOCKED"],
  VALIDATED: ["SIMULATED", "BLOCKED", "FAILED"],
  SIMULATED: ["APPROVED", "BLOCKED"],
  APPROVED: ["FROZEN", "BLOCKED"],
  FROZEN: ["EXECUTING", "BLOCKED"],
  EXECUTING: ["CONFIRMING", "FAILED", "RECONCILIATION_REQUIRED"],
  CONFIRMING: ["VERIFIED", "FAILED", "RECONCILIATION_REQUIRED"],
  VERIFIED: [],
  BLOCKED: [],
  FAILED: [],
  RECONCILIATION_REQUIRED: ["CONFIRMING", "VERIFIED", "FAILED"]
};

export function canTransition(from: PayoutStatus, to: PayoutStatus): boolean {
  return transitions[from].includes(to);
}
