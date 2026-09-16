import { errorResponse } from "@/lib/security";
import { PayoutService } from "@/lib/service";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const receipt = await new PayoutService().receipt(id);
    if (!receipt) return Response.json({ error: "Receipt not found" }, { status: 404 });
    return Response.json(receipt, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
