# Two-minute demo runbook

The verified transfer has already executed. Do **not** execute another transfer for the recording.

1. Open the live [Karma project](https://www.karmahq.xyz/project/karma) and show that donations are enabled.
2. Open GrantRail in a private window, without an administrator session, and press **Resolve & simulate**.
3. Show that GrantRail resolves project UID `0x86c6…323c` and the Optimism recipient from Karma; neither address is browser-supplied.
4. Show the exact 1 USDC amount, Optimism chain, simulation result and canonical hash.
5. Point out that a public user can inspect the simulation but cannot freeze or spend from the funded wallet.
6. Open **Mainnet proof** and show workflow `0fdlxsr3rpq2s4vpptbfk`, execution `rgn2fnc4do7njpreze1ha` and the frozen manifest hash.
7. Open the existing KeeperHub workflow and execution. Show the successful manual trigger and transfer-token node.
8. Open the [verified Optimism transaction](https://optimistic.etherscan.io/tx/0xe0d641331802687902d519f0c93bdd5ffbd2ad4da54537549ea8d9dde9cac381) and confirm token, recipient and amount.
9. Open the [repository evidence](../docs/evidence/mainnet-proof.json) and show the audit timeline.
10. End on the public dashboard to reinforce that judges can repeat the live resolution and simulation without administrator access.

Record this review in one cut. Never present the local demo transaction placeholder as real evidence, expose the administrator token, or broadcast a second payment.
