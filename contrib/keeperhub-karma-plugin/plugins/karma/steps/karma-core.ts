import "server-only";
import { safeFetch } from "@/lib/safe-fetch";

const API = "https://gapapi.karmahq.xyz";
const UID = /^0x[a-fA-F0-9]{64}$/;

export type KarmaResult<T> = { success: true; data: T } | { success: false; error: string };

export function validUID(value: string): boolean { return UID.test(value); }

export async function karmaGet<T>(path: string): Promise<KarmaResult<T>> {
  try {
    const response = await safeFetch(`${API}${path}`, { plugin: "karma", method: "GET", headers: { Accept: "application/json" } });
    if (!response.ok) return { success: false, error: response.status === 404 ? "Karma resource not found" : `Karma API returned HTTP ${response.status}` };
    const text = await response.text();
    if (text.length > 2_000_000) return { success: false, error: "Karma response exceeded the 2 MB safety limit" };
    return { success: true, data: JSON.parse(text) as T };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : String(error) }; }
}

export type GrantShape = { uid?: string; revoked?: boolean; details?: { data?: { payoutAddress?: string } }; milestones?: Array<{ uid?: string; revoked?: boolean; recipient?: string; data?: Record<string, unknown>; approved?: { uid?: string; revoked?: boolean }; completed?: { uid?: string; revoked?: boolean }; rejected?: { uid?: string; revoked?: boolean } }> };

export function findMilestone(grant: GrantShape, milestoneUID: string) {
  return grant.milestones?.find((item) => item.uid?.toLowerCase() === milestoneUID.toLowerCase());
}

export function verifyLiveApproval(grant: GrantShape, milestoneUID: string) {
  if (grant.revoked) return { success: false as const, error: "Grant is revoked" };
  const milestone = findMilestone(grant, milestoneUID);
  if (!milestone) return { success: false as const, error: "Milestone does not belong to this grant" };
  if (milestone.revoked) return { success: false as const, error: "Milestone is revoked" };
  if (!milestone.approved?.uid || milestone.approved.revoked) return { success: false as const, error: "Milestone does not have a live approval" };
  if (milestone.rejected && !milestone.rejected.revoked) return { success: false as const, error: "Milestone has a live rejection" };
  return { success: true as const, approvalUID: milestone.approved.uid, recipient: grant.details?.data?.payoutAddress ?? milestone.recipient };
}
