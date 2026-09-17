import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Documentation" };

export default function DocsPage() {
  return <main className="docs-page"><div className="docs-layout">
    <aside className="docs-side"><Logo /><nav><a href="#overview">Overview</a><a href="#quickstart">Quick start</a><a href="#architecture">Architecture</a><a href="#security">Security model</a><a href="#production">Production run</a><a href="#evidence">Submission evidence</a><Link href="/dashboard">Open demo →</Link></nav></aside>
    <article className="docs-content">
      <p className="eyebrow">GRANTRAIL DOCUMENTATION</p><h1 id="overview">Deterministic grant execution.</h1>
      <p>GrantRail connects a real Karma GAP milestone approval to a frozen KeeperHub payout workflow. The agent may help author the instruction, but no financial parameter is inferred when funds move.</p>
      <div className="callout">Demo mode is visibly isolated and never broadcasts. Only a production run with a real KeeperHub execution ID and explorer transaction should be used as submission evidence.</div>
      <h2 id="quickstart">Quick start</h2><pre>{`npm install
copy .env.example .env.local
npm run dev
# open http://localhost:3000`}</pre>
      <p>The public <code>/demo</code> route provides a credential-free, zero-funds walkthrough for evaluators. The default development configuration also supports a persisted fixture run. In production, the public dashboard exposes receipts while the live Karma payout form appears only after operator authentication.</p>
      <h2 id="architecture">Architecture</h2><pre>{`Karma GAP v2 API
      │ live milestone + approval
      ▼
Policy engine ── canonical manifest ── SHA-256 lock
      │
      ▼
KeeperHub workflow ── execution/wait API ── Optimism
      │
      ▼
Audit database + public receipt JSON`}</pre>
      <p>The idempotency key is derived only from the grant UID, milestone UID and tranche number. A database uniqueness constraint prevents two workers from creating two payouts for the same tranche.</p>
      <h2 id="security">Security model</h2><ul><li>Production mutations require an administrator bearer token and exact-origin validation.</li><li>Karma approval and payout address are re-read immediately before KeeperHub execution.</li><li>Chain, token and maximum amount are server-side allowlists.</li><li>The canonical manifest hash must match both stored and operator-supplied values.</li><li>State transitions are explicit and atomically recorded.</li><li>Unknown or timed-out writes enter reconciliation; they are never blindly rebroadcast.</li><li>KeeperHub keys stay server-side and are never returned to the browser.</li></ul>
      <h2 id="production">Production run</h2><pre>{`GRANTRAIL_MODE=production
GRANTRAIL_ADMIN_TOKEN=<32+ random characters>
KEEPERHUB_API_KEY=kh_...
KARMA_PROJECT_SLUG=<real-project>
ALLOWED_CHAIN_IDS=10
ALLOWED_TOKEN_ADDRESSES=0x0b2C...7Ff85
MAX_PAYOUT_USDC=10`}</pre>
      <p>Connect a funded KeeperHub organization wallet on Optimism. Authenticate from the console, enter a real Karma grant and milestone, review the returned canonical hash, freeze it, and execute. The same flow is available through the API for automation.</p>
      <h2 id="evidence">Submission evidence</h2><p>A valid evidence bundle includes the public repository at the tagged demo commit, a short uncut video, the public receipt URL, the KeeperHub workflow and execution identifiers, the real Karma milestone URL, and the Optimism explorer transaction.</p>
    </article>
  </div></main>;
}
