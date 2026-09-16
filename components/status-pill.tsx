import type { PayoutStatus } from "@/lib/domain";

const labels: Record<PayoutStatus, string> = {
  DRAFT: "Draft", VALIDATED: "Validated", SIMULATED: "Simulated", APPROVED: "Approved",
  FROZEN: "Frozen", EXECUTING: "Executing", CONFIRMING: "Confirming", VERIFIED: "Verified",
  BLOCKED: "Blocked", FAILED: "Failed", RECONCILIATION_REQUIRED: "Reconcile"
};

export function StatusPill({ status }: { status: PayoutStatus }) {
  const tone = ["VERIFIED", "APPROVED", "FROZEN", "SIMULATED", "VALIDATED"].includes(status)
    ? "success" : ["BLOCKED", "FAILED"].includes(status) ? "danger" : "pending";
  return <span className={`status-pill ${tone}`}><i />{labels[status]}</span>;
}
