# GrantRail

**Approved on Karma. Executed exactly by KeeperHub.**

GrantRail connects a real Karma GAP milestone approval to a frozen KeeperHub USDC payout workflow. It gives grant managers one evidence chain from milestone approval to the confirmed Optimism transaction, without asking an agent to reinterpret financial intent when execution begins.

## What is real

- Karma GAP v2 grant and milestone data is fetched from the official public indexer.
- Approval status, revocation state, grant relationship and payout recipient are validated.
- KeeperHub authors and executes the ERC-20 workflow in production mode.
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

## Production configuration

1. Create a KeeperHub organization and connect its non-custodial wallet.
2. Fund that wallet with a small amount of Optimism ETH and USDC.
3. Create `.env.local` from `.env.example`.
4. Set `GRANTRAIL_MODE=production`, a random 32+ character administrator token, and a KeeperHub API key.
5. Keep `ALLOWED_CHAIN_IDS`, `ALLOWED_TOKEN_ADDRESSES` and `MAX_PAYOUT_USDC` narrow.
6. Call the prepare route with a real Karma project, grant and milestone.
7. Review the returned canonical hash, then execute with the administrator bearer token.

See [architecture](docs/architecture.md), [security](docs/security.md), [production runbook](docs/production-runbook.md), [demo script](docs/demo-runbook.md), and [submission checklist](docs/submission-checklist.md).

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Readiness and operating mode |
| `/api/payouts` | GET | Recent manifests and states |
| `/api/payouts/prepare` | POST | Validate Karma and create/simulate a KeeperHub workflow |
| `/api/payouts/:id/approve` | POST | Record human review and freeze the exact manifest hash |
| `/api/payouts/:id/execute` | POST | Revalidate and execute the exact frozen workflow |
| `/api/payouts/:id/receipt` | GET | Machine-readable evidence bundle |

Production POST routes require `Authorization: Bearer $GRANTRAIL_ADMIN_TOKEN` and an allowed browser origin.

## Quality gates

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## License

Apache-2.0. See [LICENSE](LICENSE).
