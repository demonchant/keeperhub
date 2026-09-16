import "server-only";
import { runPluginStep, type StepInput } from "@/lib/workflow/executor/step-handler";
import { findMilestone, karmaGet, type GrantShape, validUID } from "./karma-core";
type Input = StepInput & { grantUID: string; milestoneUID: string };
export async function getMilestoneStep(input: Input) { "use step"; return runPluginStep({ pluginName: "karma", actionName: "get-milestone" }, input, async () => { if (!validUID(input.grantUID) || !validUID(input.milestoneUID)) return { success: false as const, error: "Valid grant and milestone UIDs are required" }; const result = await karmaGet<GrantShape>(`/grants/${encodeURIComponent(input.grantUID)}`); if (!result.success) return result; const milestone = findMilestone(result.data, input.milestoneUID); return milestone ? { success: true as const, milestone } : { success: false as const, error: "Milestone does not belong to this grant" }; }); }
export const _integrationType = "karma";
