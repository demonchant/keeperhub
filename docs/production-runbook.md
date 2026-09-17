# Production runbook

## Before broadcast

- Pin a tagged Git commit and run `npm run check`.
- Use an Optimism KeeperHub wallet created for the demo with only the required ETH and USDC.
- Set `MAX_PAYOUT_USDC` to the exact demo ceiling.
- Confirm the official Optimism USDC address is allowlisted.
- Confirm the recipient displayed by GrantRail exactly matches Karma’s `chainPayoutAddress["10"]`; do not copy an address into GrantRail manually.
- Prepare the manifest and independently read every field and its SHA-256 hash.
- Capture the KeeperHub workflow ID before execution.

## Broadcast

- Execute once using the stored payout ID and hash.
- If the HTTP call times out, do not repeat it with another payout or tranche number.
- Query the existing payout receipt and KeeperHub execution status.
- Wait for `VERIFIED` and an explorer link.

## After broadcast

- Compare explorer recipient, token and amount against the manifest.
- Save the receipt JSON and video recording.
- Put the real transaction, KeeperHub execution, Karma project, tagged source commit and video links in `SUBMISSION.md`.
- Revoke the demo API key or reduce its privileges/balance after judging.
