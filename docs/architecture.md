# Architecture

## Trust boundary

The AI agent is a workflow author, not the runtime decision-maker. It may help compose a KeeperHub workflow from a reviewed payout manifest. Once approved, the canonical JSON and its SHA-256 digest become the authorization boundary.

```text
Karma GAP API
  └─ grant UID
      └─ milestone UID
          └─ live approval attestation
              ↓
        GrantRail policy engine
          ├─ recipient equality
          ├─ chain/token allowlists
          ├─ amount ceiling
          └─ canonical hash
              ↓
        KeeperHub workflow
          └─ workflow execution
              └─ confirmed Optimism transaction
```

## Preparation

`PayoutService.prepare` retrieves the grant from `/v2/grants/:uid`, proves that the milestone belongs to it, checks the non-revoked approval, and derives the payout recipient from the grant. It creates a canonical manifest, enforces server policy, derives the idempotency key, creates or reuses a KeeperHub workflow, calls KeeperHub's read-only workflow preflight, and records `DRAFT → VALIDATED → SIMULATED`.

The operator must then submit the exact displayed hash to the approval endpoint. Only that distinct action records `APPROVED → FROZEN`; preparation never self-approves.

## Execution

`PayoutService.execute` reloads the stored manifest, verifies its digest and the operator-supplied digest, re-queries Karma, and compares the current approval UID and recipient with the frozen values. Only then can it enter `EXECUTING` and call KeeperHub.

A submitted execution always transitions through `CONFIRMING`. A success without a transaction hash is not considered verified. A timeout or connection loss after submission enters `RECONCILIATION_REQUIRED`; it never creates a second write.

## Persistence

libSQL stores payout state and audit events. Unique indexes cover the derived idempotency key, KeeperHub execution ID, and transaction hash. Optimistic state updates include the previous state in the SQL predicate so concurrent workers cannot both advance the same payout.

For multi-instance deployment use remote libSQL/Turso by changing `DATABASE_URL` and `DATABASE_AUTH_TOKEN`; local SQLite is intended for the demo and single-instance deployment.
