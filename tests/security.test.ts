import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse, issueSession, verifySession } from "@/lib/security";

const originalEnvironment = { ...process.env };

describe("security boundary", () => {
  beforeEach(() => {
    process.env.GRANTRAIL_MODE = "production";
    process.env.GRANTRAIL_ADMIN_TOKEN = "a-secure-administrator-token-longer-than-32-characters";
    process.env.KEEPERHUB_API_KEY = "keeperhub-test-key";
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
});
