# GrantRail submission

Replace every placeholder after the verified production run.

- **Source:** `https://github.com/REPLACE/REPLACE/releases/tag/v1.0.0-demo`
- **Demo video:** `REPLACE`
- **KeeperHub workflow:** `REPLACE`
- **KeeperHub execution:** `REPLACE`
- **Optimism transaction:** `REPLACE`
- **Karma milestone:** `REPLACE`
- **Public GrantRail receipt:** `REPLACE`
- **Contact email:** `REPLACE`
- **X or Discord:** `REPLACE`

## Which project did you integrate with, and what does it do?

We integrated with Karma GAP, a live grants and grantee-accountability platform. GrantRail maps a real Karma grant milestone and its approval attestation to a pre-approved KeeperHub payout workflow. Once the milestone is approved, KeeperHub releases the exact USDC tranche, and GrantRail joins the Karma evidence, KeeperHub execution log and Optimism transaction into one auditable receipt.

## KeeperHub surfaces

KeeperHub MCP/schema conventions and agent-authored workflows, workflow creation and execution APIs, the execution wait endpoint, logs and audit trail. The financial instruction is frozen before execution.

## Network

Optimism mainnet for the submitted USDC transfer. Local demo mode is simulated and clearly labeled.

## What remains unfinished?

GrantRail currently supports one USDC recipient per milestone on Optimism. Karma receipt write-back requires project-owner authorization; without it GrantRail produces a public receipt but does not publish the update to Karma. Multi-recipient payouts, Safe treasury execution and independent RPC postcondition verification are not in v1.
