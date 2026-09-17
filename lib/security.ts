import type { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { getConfig } from "@/lib/config";
import { safeEqual } from "@/lib/canonical";

const buckets = new Map<string, { count: number; resetAt: number }>();

export class SecurityError extends Error {
  constructor(message: string, public readonly status = 403) {
    super(message);
  }
}

export function enforceRequestOrigin(request: NextRequest): void {
  const config = getConfig();
  const origin = request.headers.get("origin");
  if (origin && origin !== config.GRANTRAIL_ALLOWED_ORIGIN) {
    throw new SecurityError("Origin is not allowed");
  }
}

export function enforceRateLimit(request: NextRequest, limit = 20): void {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw new SecurityError("Rate limit exceeded", 429);
}

export function enforceMutationSecurity(request: NextRequest): void {
  enforceRequestOrigin(request);
  enforceRateLimit(request);
  const config = getConfig();

  if (!config.demo) {
    const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const cookie = request.cookies.get("grantrail_session")?.value;
    const bearerValid = Boolean(config.GRANTRAIL_ADMIN_TOKEN && safeEqual(supplied, config.GRANTRAIL_ADMIN_TOKEN));
    if (!bearerValid && !verifySession(cookie)) {
      throw new SecurityError("A valid administrator token is required", 401);
    }
  }
}

export function enforcePublicComposeSecurity(request: NextRequest): void {
  const config = getConfig();
  const origin = request.headers.get("origin");
  if (!config.demo && origin !== config.GRANTRAIL_ALLOWED_ORIGIN) {
    throw new SecurityError("Public composition is only accepted from the GrantRail application", 403);
  }
  enforceRateLimit(request, 3);
}

function sessionSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueSession(suppliedToken: string): { value: string; expires: Date } {
  const config = getConfig();
  if (!config.GRANTRAIL_ADMIN_TOKEN || !safeEqual(suppliedToken, config.GRANTRAIL_ADMIN_TOKEN)) {
    throw new SecurityError("Invalid administrator token", 401);
  }
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const payload = Buffer.from(JSON.stringify({ exp: expires.getTime(), role: "operator" })).toString("base64url");
  return { value: `${payload}.${sessionSignature(payload, config.GRANTRAIL_ADMIN_TOKEN)}`, expires };
}

export function verifySession(value?: string): boolean {
  if (!value) return false;
  const config = getConfig();
  if (!config.GRANTRAIL_ADMIN_TOKEN) return false;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra || !safeEqual(signature, sessionSignature(payload, config.GRANTRAIL_ADMIN_TOKEN))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number; role?: string };
    return parsed.role === "operator" && typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch { return false; }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof SecurityError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: "Invalid JSON request" }, { status: 400 });
  }
  if (error instanceof Error && error.name === "ZodError") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  console.error("Unhandled API error", error);
  const message = getConfig().demo && error instanceof Error ? error.message : "Unexpected server error";
  return Response.json({ error: message }, { status: 500 });
}
