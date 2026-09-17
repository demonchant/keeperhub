export async function testKarma(): Promise<{ success: boolean; error?: string }> {
  try { const response = await fetch("https://gapapi.karmahq.xyz/projects?limit=1", { headers: { Accept: "application/json" } }); return response.ok ? { success: true } : { success: false, error: `Karma API returned HTTP ${response.status}` }; }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : String(error) }; }
}
