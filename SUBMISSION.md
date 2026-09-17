# GrantRail submission

Final submission package for the verified production integration.

- **Source:** `https://github.com/demonchant/keeperhub`
- **Release:** `https://github.com/demonchant/keeperhub/releases/tag/v1.2.0-submission`
- **Demo video:** `https://youtu.be/EG6Z2ASVn-0`
- **KeeperHub workflow:** `0fdlxsr3rpq2s4vpptbfk` (created and simulated from the live Karma project configuration)
- **KeeperHub execution:** `rgn2fnc4do7njpreze1ha`
- **Optimism transaction:** `https://optimistic.etherscan.io/tx/0xe0d641331802687902d519f0c93bdd5ffbd2ad4da54537549ea8d9dde9cac381`
- **Karma project:** `https://www.karmahq.xyz/project/karma`
- **Public application:** `https://grantrail.onrender.com/`
- **Public GrantRail receipt:** `https://grantrail.onrender.com/proof`
- **Contact email:** `oladapodamiey@gmail.com`
- **X:** `@thoyourbaby`

## Which project did you integrate with, and what does it do?

We integrated with Karma, a live funding and grantee-accountability platform. GrantRail reads a real project’s owner-configured, chain-specific donation recipient from Karma’s live API and makes KeeperHub the execution layer for project support. Visitors can resolve and dry-run the exact workflow without credentials; a treasury operator reviews the canonical hash and authorizes the real transfer. GrantRail joins the Karma project evidence, KeeperHub execution log and Optimism transaction into one public receipt.

## KeeperHub surfaces

KeeperHub MCP/schema conventions and agent-authored workflows, workflow creation and execution APIs, the execution wait endpoint, logs and audit trail. The financial instruction is frozen before execution.

## Network

Optimism mainnet for the submitted USDC transfer. Local demo mode is simulated and clearly labeled.

The submitted transfer moved exactly 1 USDC through KeeperHub to the Optimism recipient published by Karma. The execution completed at `2026-09-17T10:55:35.817Z`; its canonical repository evidence is in [`docs/evidence/mainnet-proof.json`](docs/evidence/mainnet-proof.json).

## What remains unfinished?

GrantRail currently supports one Karma-published recipient and native USDC on Optimism per workflow. Karma donation-history write-back requires a signed-in Karma donor session; without that authority GrantRail produces its own public receipt and the onchain transfer remains independently visible. Multi-recipient support, Safe treasury execution, durable distributed rate limiting and independent RPC postcondition verification are not in v1.
