# Architecture

## Trust boundary

The AI agent is a workflow author, not the runtime decision-maker. It may help compose a KeeperHub workflow from a reviewed payout manifest. Once approved, the canonical JSON and its SHA-256 digest become the authorization boundary.

```text
Karma GAP API
  └─ project UID
      └─ owner-configured Optimism donation recipient
              ↓
        GrantRail policy engine
          ├─ server-derived recipient
          ├─ chain/token allowlists
          ├─ amount ceiling
          └─ canonical hash
              ↓
        KeeperHub workflow
          └─ workflow execution
              └─ confirmed Optimism transaction
```

## Preparation

`PayoutService.prepare` retrieves `/v2/projects/:slug`, validates the returned project identity, and derives the recipient from `chainPayoutAddress["10"]`. The caller never submits a recipient. GrantRail creates a canonical manifest, enforces server policy, derives the idempotency key, creates or reuses a disabled KeeperHub workflow, calls KeeperHub's read-only workflow preflight, and records `DRAFT → VALIDATED → SIMULATED`.

Public visitors may perform this preparation within the rate and amount caps. This is the product’s review boundary, not authority to spend funds.

The operator must then submit the exact displayed hash to the approval endpoint. Only that distinct action records `APPROVED → FROZEN`; preparation never self-approves.

## Execution

`PayoutService.execute` reloads the stored manifest, verifies its digest and the operator-supplied digest, re-queries Karma, and compares the current project UID and donation recipient with the frozen values. Only then can it enter `EXECUTING` and call KeeperHub. The retained milestone mode similarly revalidates its approval UID and recipient.

A submitted execution always transitions through `CONFIRMING`. A success without a transaction hash is not considered verified. A timeout or connection loss after submission enters `RECONCILIATION_REQUIRED`; it never creates a second write.

## Persistence

libSQL stores payout state and audit events. Unique indexes cover the derived idempotency key, KeeperHub execution ID, and transaction hash. Optimistic state updates include the previous state in the SQL predicate so concurrent workers cannot both advance the same payout.

For multi-instance deployment use remote libSQL/Turso by changing `DATABASE_URL` and `DATABASE_AUTH_TOKEN`; local SQLite is intended for the demo and single-instance deployment.
