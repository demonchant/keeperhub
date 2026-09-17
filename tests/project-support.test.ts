import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabaseForTests } from "@/lib/db";
import type { KarmaProjectSupport, KeeperHubExecution } from "@/lib/domain";
import type { KarmaClient } from "@/lib/karma";
import type { KeeperHubClient } from "@/lib/keeperhub";
import { PayoutService } from "@/lib/service";

const PROJECT_UID = `0x${"8".repeat(64)}`;
const RECIPIENT = "0xC98786D5A7a03C1e74AffCb97fF7eF8a710DA09B";
const CHANGED_RECIPIENT = "0x1111111111111111111111111111111111111111";
const TOKEN = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";

function support(recipient = RECIPIENT): KarmaProjectSupport {
  return {
    uid: PROJECT_UID,
    slug: "karma",
    title: "Karma",
    chainId: 10,
    recipient,
    evidenceUrl: "https://www.karmahq.xyz/project/karma"
  };
}

function setup() {
  const getProjectSupport = vi.fn().mockResolvedValue(support());
  const execution: KeeperHubExecution = {
    executionId: "exec_support_test",
    workflowId: "wf_support_test",
    status: "success",
    completed: true,
    transactionHash: `0x${"a".repeat(64)}`,
    transactionLink: `https://optimistic.etherscan.io/tx/0x${"a".repeat(64)}`
  };
  const karma = { getProjectSupport } as unknown as KarmaClient;
  const keeperHub = {
    createWorkflow: vi.fn().mockResolvedValue("wf_support_test"),
    simulateWorkflow: vi.fn().mockResolvedValue({ success: true, wouldRevert: false }),
    executeWorkflow: vi.fn().mockResolvedValue(execution),
    waitForExecution: vi.fn().mockResolvedValue(execution),
    getLogs: vi.fn().mockResolvedValue([])
  } as unknown as KeeperHubClient;
  return { service: new PayoutService(karma, keeperHub), getProjectSupport, keeperHub };
}

const input = {
  kind: "project_support" as const,
  karmaProjectSlug: "karma",
  chainId: 10,
  tokenAddress: TOKEN,
  amount: "1.00"
};

describe("public Karma project support", () => {
  beforeAll(() => {
    process.env.GRANTRAIL_MODE = "demo";
    process.env.DATABASE_URL = "file:./data/grantrail-support-test.db";
  });
  beforeEach(async () => resetDatabaseForTests());

  it("derives and freezes the recipient from Karma rather than accepting it from the caller", async () => {
    const { service, keeperHub } = setup();
    const prepared = await service.prepare(input);

    expect(prepared.status).toBe("SIMULATED");
    expect(prepared.manifest.kind).toBe("project_support");
    if (prepared.manifest.kind !== "project_support") throw new Error("wrong manifest kind");
    expect(prepared.manifest.recipient).toBe(RECIPIENT);
    expect(prepared.manifest.karmaProjectUID).toBe(PROJECT_UID);
    expect(keeperHub.createWorkflow).toHaveBeenCalledOnce();
    expect(keeperHub.simulateWorkflow).toHaveBeenCalledWith("wf_support_test");
  });

  it("blocks execution if Karma changes the published donation recipient after review", async () => {
    const { service, getProjectSupport, keeperHub } = setup();
    const prepared = await service.prepare(input);
    const frozen = await service.approve(prepared.id, prepared.manifestHash);
    getProjectSupport.mockResolvedValueOnce(support(CHANGED_RECIPIENT));

    const blocked = await service.execute(frozen.id, frozen.manifestHash);
    expect(blocked.status).toBe("BLOCKED");
    expect(blocked.failureReason).toBe("Karma donation recipient changed after freeze");
    expect(keeperHub.executeWorkflow).not.toHaveBeenCalled();
  });

  it("executes the exact simulated workflow when Karma evidence remains unchanged", async () => {
    const { service, keeperHub } = setup();
    const prepared = await service.prepare(input);
    const frozen = await service.approve(prepared.id, prepared.manifestHash);
    const verified = await service.execute(frozen.id, frozen.manifestHash);

    expect(verified.status).toBe("VERIFIED");
    expect(verified.transactionHash).toBe(`0x${"a".repeat(64)}`);
    expect(keeperHub.executeWorkflow).toHaveBeenCalledWith("wf_support_test", verified.idempotencyKey);
  });

  it("resumes a validated intent after an interrupted KeeperHub composition", async () => {
    const { service, keeperHub } = setup();
    vi.mocked(keeperHub.createWorkflow).mockRejectedValueOnce(new Error("temporary upstream failure"));

    await expect(service.prepare(input)).rejects.toThrow("temporary upstream failure");
    const resumed = await service.prepare(input);

    expect(resumed.status).toBe("SIMULATED");
    expect(resumed.workflowId).toBe("wf_support_test");
    expect(keeperHub.createWorkflow).toHaveBeenCalledTimes(2);
    expect(keeperHub.simulateWorkflow).toHaveBeenCalledOnce();
  });

  it("reuses the attached workflow when preflight is interrupted", async () => {
    const { service, keeperHub } = setup();
    vi.mocked(keeperHub.simulateWorkflow).mockRejectedValueOnce(new Error("preflight connection closed"));

    await expect(service.prepare(input)).rejects.toThrow("preflight connection closed");
    const resumed = await service.prepare(input);

    expect(resumed.status).toBe("SIMULATED");
    expect(keeperHub.createWorkflow).toHaveBeenCalledOnce();
    expect(keeperHub.simulateWorkflow).toHaveBeenCalledTimes(2);
  });
});
