import { describe, expect, it } from "vitest";
import { demoManifest } from "@/lib/demo";
import { assertPolicy, PolicyViolation } from "@/lib/policy";

describe("payout policy", () => {
  it("accepts the narrow Optimism USDC policy", () => expect(assertPolicy(demoManifest())).toEqual(demoManifest()));

  it.each([
    ["unapproved chain", { chainId: 1 }],
    ["unapproved token", { tokenAddress: "0x1111111111111111111111111111111111111111" }],
    ["excessive amount", { amount: "11.00" }],
    ["zero recipient", { recipient: "0x0000000000000000000000000000000000000000" }]
  ])("blocks %s", (_label, patch) => {
    expect(() => assertPolicy({ ...demoManifest(), ...patch })).toThrow(PolicyViolation);
  });
});
