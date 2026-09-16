import { listPayouts } from "@/lib/db";
import { errorResponse } from "@/lib/security";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ payouts: await listPayouts() });
  } catch (error) {
    return errorResponse(error);
  }
}
