import "server-only";
import { runPluginStep, type StepInput } from "@/lib/workflow/executor/step-handler";
import { karmaGet, type GrantShape, validUID, verifyLiveApproval } from "./karma-core";
type Input = StepInput & { grantUID: string; milestoneUID: string };
export async function verifyMilestoneApprovalStep(input: Input) { "use step"; return runPluginStep({ pluginName: "karma", actionName: "verify-milestone-approval" }, input, async () => { if (!validUID(input.grantUID) || !validUID(input.milestoneUID)) return { success: false as const, error: "Valid grant and milestone UIDs are required" }; const result = await karmaGet<GrantShape>(`/grants/${encodeURIComponent(input.grantUID)}`); if (!result.success) return result; const verification = verifyLiveApproval(result.data, input.milestoneUID); return verification.success ? { success: true as const, approved: true, approvalUID: verification.approvalUID, recipient: verification.recipient } : verification; }); }
export const _integrationType = "karma";
