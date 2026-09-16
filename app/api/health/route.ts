import { getConfig } from "@/lib/config";
import { initializeDatabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await initializeDatabase();
    const config = getConfig();
    return Response.json({
      status: "ok",
      mode: config.GRANTRAIL_MODE,
      database: "ready",
      karma: config.demo ? "fixture" : "configured",
      keeperHub: config.demo ? "simulated" : "configured",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ status: "error", error: error instanceof Error ? error.message : "unknown" }, { status: 503 });
  }
}
