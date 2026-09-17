# GrantRail submission

Replace every placeholder after the verified production run.

- **Source:** `https://github.com/demonchant/keeperhub`
- **Release:** `https://github.com/demonchant/keeperhub/releases/tag/v1.0.0-demo`
- **Demo video:** `REPLACE`
- **KeeperHub workflow:** `0fdlxsr3rpq2s4vpptbfk` (created and simulated from the live Karma project configuration)
- **KeeperHub execution:** `REPLACE`
- **Optimism transaction:** `REPLACE`
- **Karma project:** `https://www.karmahq.xyz/project/karma`
- **Public GrantRail receipt:** `REPLACE`
- **Contact email:** `REPLACE`
- **X or Discord:** `REPLACE`

## Which project did you integrate with, and what does it do?

We integrated with Karma, a live funding and grantee-accountability platform. GrantRail reads a real project’s owner-configured, chain-specific donation recipient from Karma’s live API and makes KeeperHub the execution layer for project support. Visitors can resolve and dry-run the exact workflow without credentials; a treasury operator reviews the canonical hash and authorizes the real transfer. GrantRail joins the Karma project evidence, KeeperHub execution log and Optimism transaction into one public receipt.

## KeeperHub surfaces

KeeperHub MCP/schema conventions and agent-authored workflows, workflow creation and execution APIs, the execution wait endpoint, logs and audit trail. The financial instruction is frozen before execution.

## Network

Optimism mainnet for the submitted USDC transfer. Local demo mode is simulated and clearly labeled.

## What remains unfinished?

GrantRail currently supports one Karma-published recipient and native USDC on Optimism per workflow. Karma donation-history write-back requires a signed-in Karma donor session; without that authority GrantRail produces its own public receipt and the onchain transfer remains independently visible. Multi-recipient support, Safe treasury execution, durable distributed rate limiting and independent RPC postcondition verification are not in v1.
