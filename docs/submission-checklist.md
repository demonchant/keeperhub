# Submission checklist

## Required artifacts

- [x] Public source repository at tagged commit `v1.2.0-submission`
- [x] [Two-minute video showing Karma → KeeperHub → Optimism → receipt](https://youtu.be/EG6Z2ASVn-0)
- [x] [Real Optimism transaction executed by KeeperHub](https://optimistic.etherscan.io/tx/0xe0d641331802687902d519f0c93bdd5ffbd2ad4da54537549ea8d9dde9cac381)
- [x] [Public Karma project link showing donations enabled](https://www.karmahq.xyz/project/karma)
- [x] KeeperHub workflow `0fdlxsr3rpq2s4vpptbfk` and execution `rgn2fnc4do7njpreze1ha`
- [x] Reachable email and X handle included in `SUBMISSION.md`

## Judge review

- [x] README explains the real integration in one sentence
- [x] Fresh clone works using `.env.example`
- [x] CI runs lint, typecheck, tests and production build
- [x] No secrets, local databases or private keys are committed
- [x] Failure tests cover duplicate, tamper, changed recipient and ambiguous execution
- [x] Demo records are visibly distinguishable from real transactions
- [x] `What remains unfinished` is candid

## Bounty

The KeeperHub Karma plugin must be submitted as a separate BUIDL with its upstream PR. Do not attach the same BUIDL to both tracks.
