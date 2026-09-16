import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/domain";

describe("execution state machine", () => {
  it("permits only the explicit happy path", () => {
    expect(canTransition("DRAFT", "VALIDATED")).toBe(true);
    expect(canTransition("FROZEN", "EXECUTING")).toBe(true);
    expect(canTransition("CONFIRMING", "VERIFIED")).toBe(true);
  });

  it("forbids replay and state skipping", () => {
    expect(canTransition("VERIFIED", "EXECUTING")).toBe(false);
    expect(canTransition("DRAFT", "VERIFIED")).toBe(false);
    expect(canTransition("BLOCKED", "FROZEN")).toBe(false);
  });
});
