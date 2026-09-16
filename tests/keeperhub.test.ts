import { describe, expect, it } from "vitest";
import { demoManifest } from "@/lib/demo";
import { keeperHubWorkflowDefinition } from "@/lib/keeperhub";

describe("KeeperHub workflow", () => {
  it("pins every financial parameter in the transfer node", () => {
    const manifest = demoManifest();
    const workflow = keeperHubWorkflowDefinition(manifest);
    const transfer = workflow.nodes[1].data.config;
    expect(transfer).toMatchObject({
      actionType: "web3/transfer-token",
      network: "10",
      recipientAddress: manifest.recipient,
      amount: "1.00",
      tokenConfig: { address: manifest.tokenAddress, symbol: "USDC", decimals: 6 }
    });
    expect(workflow.enabled).toBe(false);
  });
});
