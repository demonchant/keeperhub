import type { NextRequest } from "next/server";
import { demoManifest } from "@/lib/demo";
import { getConfig } from "@/lib/config";
import { preparePayoutSchema } from "@/lib/domain";
import { enforceMutationSecurity, enforcePublicComposeSecurity, errorResponse, SecurityError } from "@/lib/security";
import { PayoutService } from "@/lib/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const demo = demoManifest();
    const fallback = {
      karmaProjectSlug: demo.karmaProjectSlug,
      karmaGrantUID: demo.karmaGrantUID,
      karmaMilestoneUID: demo.karmaMilestoneUID,
      chainId: demo.chainId,
      tokenAddress: demo.tokenAddress,
      recipient: demo.recipient,
      amount: demo.amount,
      tranche: demo.tranche,
      evidenceUrl: demo.evidenceUrl
    };
    const input = preparePayoutSchema.parse(Object.keys(body).length ? body : fallback);
    if (input.kind === "project_support") {
      enforcePublicComposeSecurity(request);
      if (Number(input.amount) > getConfig().PUBLIC_MAX_SUPPORT_USDC) {
        throw new SecurityError(`Public support simulations are capped at ${getConfig().PUBLIC_MAX_SUPPORT_USDC} USDC`, 400);
      }
    } else {
      enforceMutationSecurity(request);
    }
    const payout = await new PayoutService().prepare(input);
    return Response.json({ payout }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
