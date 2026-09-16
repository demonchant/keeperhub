import type { NextRequest } from "next/server";
import { z } from "zod";
import { getConfig } from "@/lib/config";
import { enforceRateLimit, enforceRequestOrigin, errorResponse, issueSession } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const config = getConfig();
    enforceRequestOrigin(request);
    enforceRateLimit(request, 10);
    if (config.demo) return Response.json({ authenticated: true, mode: "demo" });
    const { token } = z.object({ token: z.string().min(32).max(512) }).parse(await request.json());
    const session = issueSession(token);
    const response = Response.json({ authenticated: true, expiresAt: session.expires.toISOString() });
    response.headers.append("set-cookie", `grantrail_session=${session.value}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${session.expires.toUTCString()}`);
    return response;
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    enforceRequestOrigin(request);
    enforceRateLimit(request, 10);
    const response = Response.json({ authenticated: false });
    response.headers.append("set-cookie", "grantrail_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
    return response;
  } catch (error) { return errorResponse(error); }
}
