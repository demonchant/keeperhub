import "server-only";
import { runPluginStep, type StepInput } from "@/lib/workflow/executor/step-handler";
import { karmaGet } from "./karma-core";
type Input = StepInput & { projectId: string };
export async function getProjectStep(input: Input) { "use step"; return runPluginStep({ pluginName: "karma", actionName: "get-project" }, input, async () => { const id = input.projectId?.trim(); if (!id || !/^[a-zA-Z0-9_-]{2,120}$|^0x[a-fA-F0-9]{64}$/.test(id)) return { success: false as const, error: "A valid Karma project slug or UID is required" }; const result = await karmaGet<unknown>(`/projects/${encodeURIComponent(id)}`); return result.success ? { success: true as const, project: result.data } : result; }); }
export const _integrationType = "karma";
