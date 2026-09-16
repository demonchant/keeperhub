import "server-only";
import { runPluginStep, type StepInput } from "@/lib/workflow/executor/step-handler";
import { karmaGet, type GrantShape, validUID } from "./karma-core";
type Input = StepInput & { grantUID: string };
export async function getGrantStep(input: Input) { "use step"; return runPluginStep({ pluginName: "karma", actionName: "get-grant" }, input, async () => { const uid = input.grantUID?.trim(); if (!validUID(uid)) return { success: false as const, error: "A 32-byte grant UID is required" }; const result = await karmaGet<GrantShape>(`/grants/${encodeURIComponent(uid)}`); if (!result.success) return result; if (result.data.uid?.toLowerCase() !== uid.toLowerCase()) return { success: false as const, error: "Karma returned a mismatched grant UID" }; return { success: true as const, grant: result.data }; }); }
export const _integrationType = "karma";
