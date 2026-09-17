import { createHash, timingSafeEqual } from "node:crypto";
import type { PayoutManifest } from "@/lib/domain";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, sortValue(child)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

export function hashManifest(manifest: PayoutManifest): string {
  return sha256(canonicalJson(manifest));
}

export function idempotencyKey(manifest: PayoutManifest): string {
  if (manifest.kind === "project_support") {
    return sha256([
      "project-support",
      manifest.karmaProjectUID.toLowerCase(),
      manifest.chainId,
      manifest.tokenAddress.toLowerCase(),
      manifest.amount
    ].join(":"));
  }
  return sha256(`${manifest.karmaGrantUID.toLowerCase()}:${manifest.karmaMilestoneUID.toLowerCase()}:${manifest.tranche}`);
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
