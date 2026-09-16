# KeeperHub Karma GAP plugin contribution

This directory is an upstream-compatible, read-only KeeperHub plugin proposed for the separate **Best KeeperHub Feature** bounty.

Actions:

- `karma/get-project`
- `karma/get-grant`
- `karma/get-milestone`
- `karma/verify-milestone-approval`

The implementation uses KeeperHub `safeFetch`, fixed Karma API origin, bounded parsing and structured failures. No credentials are required because Karma's v2 indexer is public. The included test suite covers malformed UIDs, grant/milestone ownership, revoked grants, revoked milestones, revoked approvals, and conflicting rejections.

To prepare the upstream PR, copy `plugins/karma` into the KeeperHub repository, add `karma` to `plugins/plugin-allowlist.json`, run `pnpm discover-plugins`, then run the repository's typecheck, formatting and test suite. The files follow `plugins/AGENTS.md` from KeeperHub staging at commit `bac57a097705e4b75fe4fd10c108c692899b0451`.
