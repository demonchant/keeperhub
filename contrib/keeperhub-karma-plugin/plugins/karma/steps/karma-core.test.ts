import { describe, expect, it, vi } from "vitest";
import { findMilestone, validUID, verifyLiveApproval, type GrantShape } from "./karma-core";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/safe-fetch", () => ({ safeFetch: vi.fn() }));

const uid = (tail: string) => `0x${tail.padStart(64, "0")}`;
const milestoneUID = uid("1234");
const approvalUID = uid("5678");
const recipient = "0x1111111111111111111111111111111111111111";

function grant(patch: Partial<GrantShape> = {}): GrantShape {
  return {
    uid: uid("9999"),
    details: { data: { payoutAddress: recipient } },
    milestones: [{ uid: milestoneUID, approved: { uid: approvalUID, revoked: false } }],
    ...patch
  };
}

describe("Karma plugin safety helpers", () => {
  it("accepts only 32-byte attestation UIDs", () => {
    expect(validUID(milestoneUID)).toBe(true);
    expect(validUID("0x1234")).toBe(false);
  });

  it("resolves a milestone only from its parent grant", () => {
    expect(findMilestone(grant(), milestoneUID)?.uid).toBe(milestoneUID);
    expect(findMilestone(grant(), uid("abcd"))).toBeUndefined();
  });

  it("returns the live approval and canonical grant payout address", () => {
    expect(verifyLiveApproval(grant(), milestoneUID)).toEqual({ success: true, approvalUID, recipient });
  });

  it.each([
    ["revoked grant", grant({ revoked: true })],
    ["missing milestone", grant({ milestones: [] })],
    ["revoked milestone", grant({ milestones: [{ uid: milestoneUID, revoked: true, approved: { uid: approvalUID } }] })],
    ["revoked approval", grant({ milestones: [{ uid: milestoneUID, approved: { uid: approvalUID, revoked: true } }] })],
    ["live rejection", grant({ milestones: [{ uid: milestoneUID, approved: { uid: approvalUID }, rejected: { uid: uid("7777"), revoked: false } }] })]
  ])("fails closed for %s", (_name, value) => expect(verifyLiveApproval(value, milestoneUID).success).toBe(false));
});
