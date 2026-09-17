# GrantRail

**Resolved from Karma. Executed exactly by KeeperHub.**

GrantRail makes KeeperHub the deterministic execution layer for Karma project support. A visitor selects a live Karma project; GrantRail resolves its owner-configured Optimism donation recipient from Karma’s public API, composes and dry-runs an exact USDC workflow through KeeperHub, and records one evidence chain through the confirmed transaction. Milestone payouts remain supported as an operator-only secondary path.

- Live application: [grantrail.onrender.com](https://grantrail.onrender.com/)
- Two-minute demo: [YouTube](https://youtu.be/EG6Z2ASVn-0)

## Verified Optimism mainnet proof

- Karma project: [Karma](https://www.karmahq.xyz/project/karma)
- KeeperHub workflow: `0fdlxsr3rpq2s4vpptbfk`
- KeeperHub execution: `rgn2fnc4do7njpreze1ha`
- Transfer: `1.00 USDC` to Karma's published Optimism donation recipient
- Transaction: [`0xe0d641…ac381`](https://optimistic.etherscan.io/tx/0xe0d641331802687902d519f0c93bdd5ffbd2ad4da54537549ea8d9dde9cac381)
- Canonical manifest: `sha256:101125e53e165750ce935d697e1ecc2a76f202f620ca50230c7584e5d5ac127f`
- Repository evidence: [`docs/evidence/mainnet-proof.json`](docs/evidence/mainnet-proof.json)

## What is real

- Karma v2 project and chain-specific donation data is fetched from the official public indexer.
- Project identity and donation recipient are derived server-side and pinned into the manifest; callers cannot supply the destination.
- KeeperHub authors and executes the ERC-20 workflow in production mode.
- Anyone can compose and simulate within the public 1 USDC cap; only an authenticated treasury operator can freeze or execute.
- Every transition is stored in an append-only audit table.
- Production receipts expose the KeeperHub execution ID and explorer transaction.

## What is simulated

The default `GRANTRAIL_MODE=demo` uses explicit fixtures and a simulated KeeperHub execution. Demo receipts carry a prominent warning and must never be submitted as onchain evidence. No private key or signing code exists in GrantRail.

## Run locally

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open `http://localhost:3000`, then select **Run the demo**. The demo persists to `data/grantrail.db`.

The `/demo` route is a public, client-isolated guided walkthrough that requires no credentials and can never broadcast. The `/dashboard` route performs the real Karma lookup and KeeperHub dry-run for any visitor. Freezing and executing remain operator-only, so evaluators can exercise the integration without gaining control of the shared funded wallet.

## Production configuration

1. Create a KeeperHub organization and connect its non-custodial wallet.
2. Fund that wallet with a small amount of Optimism ETH and USDC.
3. Create `.env.local` from `.env.example`.
4. Set `GRANTRAIL_MODE=production`, a random 32+ character administrator token, and a KeeperHub API key.
5. Keep `ALLOWED_CHAIN_IDS`, `ALLOWED_TOKEN_ADDRESSES` and `MAX_PAYOUT_USDC` narrow.
6. Open `/dashboard`, leave the verified `karma` project slug selected, and run the public live simulation.
7. Authenticate as operator, review the derived recipient and canonical hash, freeze, then execute once.

See [architecture](docs/architecture.md), [security](docs/security.md), [production runbook](docs/production-runbook.md), [demo script](docs/demo-runbook.md), and [submission checklist](docs/submission-checklist.md).

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Readiness and operating mode |
| `/api/payouts` | GET | Recent manifests and states |
| `/api/payouts/prepare` | POST | Publicly resolve Karma and create/simulate a capped KeeperHub workflow |
| `/api/payouts/:id/approve` | POST | Record human review and freeze the exact manifest hash |
| `/api/payouts/:id/execute` | POST | Revalidate and execute the exact frozen workflow |
| `/api/payouts/:id/receipt` | GET | Machine-readable evidence bundle |

Public project-support preparation requires the configured browser origin, is rate-limited, derives the recipient server-side, and is capped by `PUBLIC_MAX_SUPPORT_USDC`. Approval and execution require an administrator bearer token or signed operator session.

## Quality gates

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## License

Apache-2.0. See [LICENSE](LICENSE).
