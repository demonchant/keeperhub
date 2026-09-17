import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { enforcePublicComposeSecurity, errorResponse, issueSession, verifySession } from "@/lib/security";

const originalEnvironment = { ...process.env };

describe("security boundary", () => {
  beforeEach(() => {
    process.env.GRANTRAIL_MODE = "production";
    process.env.GRANTRAIL_ADMIN_TOKEN = "a-secure-administrator-token-longer-than-32-characters";
    process.env.KEEPERHUB_API_KEY = "keeperhub-test-key";
    process.env.GRANTRAIL_ALLOWED_ORIGIN = "https://grantrail.example";
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
    vi.restoreAllMocks();
  });

  it("issues a signed operator session and rejects a modified signature", () => {
    const session = issueSession(process.env.GRANTRAIL_ADMIN_TOKEN!);
    expect(verifySession(session.value)).toBe(true);
    expect(verifySession(`${session.value.slice(0, -1)}x`)).toBe(false);
  });

  it("does not expose internal production errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = errorResponse(new Error("upstream included sensitive diagnostics"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Unexpected server error" });
  });

  it("classifies malformed JSON as a client error", async () => {
    const response = errorResponse(new SyntaxError("bad JSON"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON request" });
  });

  it("allows capped public composition from the app origin without granting operator authority", () => {
    const request = new NextRequest("https://grantrail.example/api/payouts/prepare", {
      method: "POST",
      headers: { origin: "https://grantrail.example", "x-forwarded-for": "203.0.113.7" }
    });
    expect(() => enforcePublicComposeSecurity(request)).not.toThrow();
  });

  it("rejects public composition from another origin", () => {
    const request = new NextRequest("https://grantrail.example/api/payouts/prepare", {
      method: "POST",
      headers: { origin: "https://evil.example", "x-forwarded-for": "203.0.113.8" }
    });
    expect(() => enforcePublicComposeSecurity(request)).toThrow("Public composition is only accepted from the GrantRail application");
  });
});
