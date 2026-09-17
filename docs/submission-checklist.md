# Submission checklist

## Required artifacts

- [ ] Public source repository at a tagged, passing commit
- [ ] Short uncut video showing Karma → KeeperHub → Optimism → receipt
- [ ] Real Optimism transaction executed by KeeperHub
- [ ] Public Karma project link showing donations enabled
- [ ] KeeperHub workflow ID and execution ID
- [ ] Reachable email and X or Discord handle

## Judge review

- [ ] README explains the real integration in one sentence
- [ ] Fresh clone works using `.env.example`
- [ ] CI runs lint, typecheck, tests and production build
- [ ] No secrets, local databases or private keys are committed
- [ ] Failure tests cover duplicate, tamper, changed recipient and ambiguous execution
- [ ] Demo records are visibly distinguishable from real transactions
- [ ] `What remains unfinished` is candid

## Bounty

The KeeperHub Karma plugin must be submitted as a separate BUIDL with its upstream PR. Do not attach the same BUIDL to both tracks.
