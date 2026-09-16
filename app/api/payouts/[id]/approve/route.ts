import type { NextRequest } from "next/server";
import { z } from "zod";
import { enforceMutationSecurity, errorResponse } from "@/lib/security";
import { PayoutService } from "@/lib/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    enforceMutationSecurity(request);
    const { id } = await context.params;
    const body = z.object({ manifestHash: z.string().regex(/^sha256:[a-f0-9]{64}$/) }).parse(await request.json());
    const payout = await new PayoutService().approve(id, body.manifestHash);
    return Response.json({ payout });
  } catch (error) {
    return errorResponse(error);
  }
}
