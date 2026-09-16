import { getConfig } from "@/lib/config";
import { payoutManifestSchema, type PayoutManifest } from "@/lib/domain";

export class PolicyViolation extends Error {
  constructor(public readonly violations: string[]) {
    super(violations.join("; "));
  }
}

export function assertPolicy(input: PayoutManifest): PayoutManifest {
  const manifest = payoutManifestSchema.parse(input);
  const config = getConfig();
  const violations: string[] = [];

  if (!config.allowedChainIds.has(manifest.chainId)) violations.push(`Chain ${manifest.chainId} is not allowlisted`);
  if (!config.allowedTokenAddresses.has(manifest.tokenAddress.toLowerCase())) violations.push("Token is not allowlisted");
  if (Number(manifest.amount) <= 0) violations.push("Payout amount must be positive");
  if (Number(manifest.amount) > config.MAX_PAYOUT_USDC) violations.push(`Payout exceeds ${config.MAX_PAYOUT_USDC} USDC policy limit`);
  if (manifest.recipient.toLowerCase() === "0x0000000000000000000000000000000000000000") violations.push("Zero-address recipient is forbidden");
  if (manifest.tokenAddress.toLowerCase() === manifest.recipient.toLowerCase()) violations.push("Recipient cannot be the token contract");

  if (violations.length) throw new PolicyViolation(violations);
  return manifest;
}
