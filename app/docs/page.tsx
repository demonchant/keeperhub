import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Documentation" };

export default function DocsPage() {
  return <main className="docs-page"><div className="docs-layout">
    <aside className="docs-side"><Logo /><nav><a href="#overview">Overview</a><a href="#quickstart">Quick start</a><a href="#architecture">Architecture</a><a href="#security">Security model</a><a href="#production">Production run</a><a href="#evidence">Submission evidence</a><Link href="/dashboard">Open demo →</Link></nav></aside>
    <article className="docs-content">
      <p className="eyebrow">GRANTRAIL DOCUMENTATION</p><h1 id="overview">Deterministic value execution.</h1>
      <p>GrantRail resolves a live project’s chain-specific donation recipient from Karma and composes a frozen KeeperHub USDC workflow. The agent or visitor may author the intent, but no financial parameter is inferred when funds move.</p>
      <div className="callout">Demo mode is visibly isolated and never broadcasts. Only a production run with a real KeeperHub execution ID and explorer transaction should be used as submission evidence.</div>
      <h2 id="quickstart">Quick start</h2><pre>{`npm install
copy .env.example .env.local
npm run dev
# open http://localhost:3000`}</pre>
      <p>The public <code>/demo</code> route provides a credential-free, zero-funds walkthrough. In production, <code>/dashboard</code> lets anyone resolve live Karma data and run KeeperHub preflight. Only review/freeze and execute require the operator session.</p>
      <h2 id="architecture">Architecture</h2><pre>{`Karma GAP v2 API
      │ live project + Optimism donation recipient
      ▼
Policy engine ── canonical manifest ── SHA-256 lock
      │
      ▼
KeeperHub workflow ── execution/wait API ── Optimism
      │
      ▼
Audit database + public receipt JSON`}</pre>
      <p>The project-support idempotency key binds project UID, chain, token and amount. A database uniqueness constraint prevents duplicate preparation from becoming duplicate value movement.</p>
      <h2 id="security">Security model</h2><ul><li>Public composition requires the exact application origin, is rate-limited and capped at 1 USDC by default.</li><li>Freeze and execution require an administrator bearer token or signed HTTP-only session.</li><li>Karma project identity and donation recipient are re-read immediately before KeeperHub execution.</li><li>Chain, token and maximum amount are server-side allowlists.</li><li>The canonical manifest hash must match both stored and operator-supplied values.</li><li>Unknown or timed-out writes enter reconciliation; they are never blindly rebroadcast.</li><li>KeeperHub keys stay server-side and are never returned to the browser.</li></ul>
      <h2 id="production">Production run</h2><pre>{`GRANTRAIL_MODE=production
GRANTRAIL_ADMIN_TOKEN=<32+ random characters>
KEEPERHUB_API_KEY=kh_...
KARMA_PROJECT_SLUG=<real-project>
ALLOWED_CHAIN_IDS=10
ALLOWED_TOKEN_ADDRESSES=0x0b2C...7Ff85
MAX_PAYOUT_USDC=10
PUBLIC_MAX_SUPPORT_USDC=1`}</pre>
      <p>Connect a funded KeeperHub organization wallet on Optimism. A public visitor can select a Karma project and simulate. The operator independently reviews the server-derived recipient and canonical hash, freezes it, and executes once.</p>
      <h2 id="evidence">Submission evidence</h2><p>A valid evidence bundle includes the public repository at the tagged commit, a short uncut video, the public receipt URL, KeeperHub workflow and execution identifiers, the live Karma project URL, and the Optimism explorer transaction.</p>
    </article>
  </div></main>;
}
