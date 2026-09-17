# Security model

## Protected invariants

1. One project-support intent maps to at most one payout record.
2. Project support never executes unless Karma still publishes an Optimism donation recipient.
3. The recipient used by KeeperHub equals the chain-specific recipient reported by Karma.
4. Chain, token and amount satisfy server-owned policy.
5. The executed manifest is byte-for-byte equivalent after canonicalization to the reviewed manifest.
6. An ambiguous execution is reconciled, never blindly retried.

## Controls

- Strict Zod schemas reject unknown manifest keys and malformed Ethereum identifiers.
- Production configuration refuses to boot without a long administrator token and KeeperHub key.
- Public composition checks the exact browser origin, applies a three-per-minute per-instance rate limit and caps the simulated amount. Approval and execution additionally require a bearer token or signed, HTTP-only operator session.
- KeeperHub credentials exist only on the server.
- Anonymous visitors can run the isolated `/demo`, resolve live Karma data, create a disabled workflow, run preflight and inspect receipts. They cannot freeze or execute it.
- Upstream HTTP calls have abort deadlines and bounded error bodies.
- CSP, frame denial, MIME sniffing protection and restrictive permissions headers are applied globally.
- Production CSP excludes `unsafe-eval`; strict transport security and secure cookies assume the deployment is served over HTTPS.
- The workflow is created disabled with a manual trigger; only GrantRail initiates the payout.
- KeeperHub’s execution wait endpoint is used instead of implementing unsafe client polling/rebroadcast logic.

## Known limitations

- The in-memory rate limiter is per instance. Put a gateway or distributed limiter in front of horizontally scaled production deployments.
- Terminate TLS at the application gateway and do not expose a production deployment over plain HTTP.
- GrantRail validates the KeeperHub transaction reported by its execution receipt, but independent Optimism RPC postcondition verification should be added before handling material value.
- Automatic donation-history write-back to Karma requires a signed-in donor session and is intentionally not impersonated.
- Only Optimism USDC and a single-recipient tranche are supported in the initial release.

## Reporting

Do not open public issues containing API keys, wallet details or undisclosed vulnerabilities. Use the contact method in the submission profile for private disclosure.
