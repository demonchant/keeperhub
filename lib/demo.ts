import { createHash } from "node:crypto";
import type { KarmaMilestone, KeeperHubExecution, MilestonePayoutManifest } from "@/lib/domain";

const uid = (tail: string) => `0x${tail.padStart(64, "0")}`;

export const DEMO_PROJECT = {
  name: "Open Climate Commons",
  slug: "open-climate-commons",
  community: "Climate Action Fund",
  grantUID: uid("7a3c9f2e"),
  milestoneUID: uid("9c1e4b6d"),
  approvalUID: uid("b7e15a91"),
  recipient: "0x6F3a8E0B3e67A981305daD781cd24eB4A9fA2a7C",
  token: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
} as const;

export function demoMilestone(): KarmaMilestone {
  return {
    uid: DEMO_PROJECT.milestoneUID,
    grantUID: DEMO_PROJECT.grantUID,
    projectSlug: DEMO_PROJECT.slug,
    title: "Publish audited emissions registry",
    description: "Deploy and document the public registry with an independent audit report.",
    endsAt: Date.parse("2026-09-12T12:00:00.000Z") / 1000,
    recipient: DEMO_PROJECT.recipient,
    revoked: false,
    status: "approved",
    approvalAttestationUID: DEMO_PROJECT.approvalUID,
    approvalRevoked: false,
    evidenceUrl: `https://www.karmahq.xyz/project/${DEMO_PROJECT.slug}`
  };
}

export function demoManifest(): MilestonePayoutManifest {
  return {
    kind: "milestone_payout",
    version: 1,
    karmaProjectSlug: DEMO_PROJECT.slug,
    karmaGrantUID: DEMO_PROJECT.grantUID,
    karmaMilestoneUID: DEMO_PROJECT.milestoneUID,
    approvalAttestationUID: DEMO_PROJECT.approvalUID,
    requiredStatus: "approved",
    chainId: 10,
    tokenAddress: DEMO_PROJECT.token,
    tokenSymbol: "USDC",
    tokenDecimals: 6,
    recipient: DEMO_PROJECT.recipient,
    amount: "1.00",
    tranche: 1,
    evidenceUrl: `https://www.karmahq.xyz/project/${DEMO_PROJECT.slug}`,
    createdAt: "2026-09-10T20:00:00.000Z"
  };
}

export function demoExecution(workflowId: string, seed = workflowId): KeeperHubExecution {
  const digest = createHash("sha256").update(`grantrail-demo:${seed}`).digest("hex");
  return {
    executionId: `exec_demo_${digest.slice(0, 16)}`,
    workflowId,
    status: "success",
    completed: true,
    transactionHash: `0x${digest}`,
    transactionLink: `https://optimistic.etherscan.io/tx/0x${digest}`,
    logs: [
      { nodeName: "Manual approval", status: "success" },
      { nodeName: "Transfer USDC", status: "success", demo: true },
      { nodeName: "Verify receipt", status: "success" }
    ]
  };
}
