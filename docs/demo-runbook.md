# Two-minute demo runbook

1. Open the live [Karma project](https://www.karmahq.xyz/project/karma) and show that donations are enabled.
2. Open GrantRail in a private window, without an administrator session, and press **Resolve & simulate**.
3. Show that GrantRail resolves project UID `0x86c6…323c` and the Optimism recipient from Karma; neither address is browser-supplied.
4. Show the recipient, exact 1 USDC amount, Optimism chain, simulation result and canonical hash.
5. Point out that the public user can inspect the simulation but cannot freeze or spend funds. Sign in as operator, press **Review & freeze**, then show that the hash and instruction cannot change.
6. Open the workflow in KeeperHub and show the manual trigger and transfer-token node.
7. Press **Execute exact workflow** once.
8. Show the KeeperHub execution ID and logs.
9. Open the Optimism explorer transaction and confirm sender, recipient, token and amount.
10. Open the GrantRail receipt and its machine-readable JSON. Run the same support intent again and show that GrantRail returns the existing record rather than creating a duplicate transfer.

Record the production run in one cut. Never present the local demo transaction placeholder as real evidence.
