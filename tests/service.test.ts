import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { demoManifest } from "@/lib/demo";
import { resetDatabaseForTests } from "@/lib/db";
import { PayoutService } from "@/lib/service";

function inputFor(tranche: number) {
  const m = demoManifest();
  return {
    karmaProjectSlug: m.karmaProjectSlug,
    karmaGrantUID: m.karmaGrantUID,
    karmaMilestoneUID: m.karmaMilestoneUID,
    chainId: m.chainId,
    tokenAddress: m.tokenAddress,
    recipient: m.recipient,
    amount: m.amount,
    tranche,
    evidenceUrl: m.evidenceUrl
  };
}

describe("payout service", () => {
  beforeAll(() => {
    process.env.GRANTRAIL_MODE = "demo";
    process.env.DATABASE_URL = "file:./data/grantrail-test.db";
  });
  beforeEach(async () => resetDatabaseForTests());

  it("prepares, explicitly approves, freezes and verifies a deterministic payout", async () => {
    const service = new PayoutService();
    const prepared = await service.prepare(inputFor(1));
    expect(prepared.status).toBe("SIMULATED");
    const frozen = await service.approve(prepared.id, prepared.manifestHash);
    expect(frozen.status).toBe("FROZEN");
    const executed = await service.execute(frozen.id, frozen.manifestHash);
    expect(executed.status).toBe("VERIFIED");
    expect(executed.executionId).toMatch(/^exec_/);
    expect(executed.transactionHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("deduplicates concurrent intent by grant, milestone and tranche", async () => {
    const service = new PayoutService();
    const first = await service.prepare(inputFor(2));
    const duplicate = await service.prepare(inputFor(2));
    expect(duplicate.id).toBe(first.id);
    expect(duplicate.idempotencyKey).toBe(first.idempotencyKey);
  });

  it("blocks a payout when the operator hash is tampered", async () => {
    const service = new PayoutService();
    const prepared = await service.prepare(inputFor(3));
    const blocked = await service.approve(prepared.id, `sha256:${"0".repeat(64)}`);
    expect(blocked.status).toBe("BLOCKED");
    expect(blocked.failureReason).toBe("Manifest hash mismatch during approval");
  });
});
