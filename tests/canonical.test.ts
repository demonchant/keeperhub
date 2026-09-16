import { describe, expect, it } from "vitest";
import { canonicalJson, hashManifest, idempotencyKey } from "@/lib/canonical";
import { demoManifest } from "@/lib/demo";

describe("canonical manifest", () => {
  it("sorts object keys recursively", () => {
    expect(canonicalJson({ z: 1, a: { y: 2, b: 3 } })).toBe('{"a":{"b":3,"y":2},"z":1}');
  });

  it("produces a stable hash regardless of insertion order", () => {
    const manifest = demoManifest();
    const reordered = Object.fromEntries(Object.entries(manifest).reverse()) as typeof manifest;
    expect(hashManifest(manifest)).toBe(hashManifest(reordered));
  });

  it("changes the hash when a financial instruction changes", () => {
    const manifest = demoManifest();
    expect(hashManifest(manifest)).not.toBe(hashManifest({ ...manifest, amount: "1.01" }));
  });

  it("scopes idempotency to grant, milestone and tranche", () => {
    const manifest = demoManifest();
    expect(idempotencyKey(manifest)).toBe(idempotencyKey({ ...manifest }));
    expect(idempotencyKey(manifest)).not.toBe(idempotencyKey({ ...manifest, tranche: 2 }));
  });
});
