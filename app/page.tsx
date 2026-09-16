import Link from "next/link";
import { ArrowRight, Bolt, Check, Eye, FileCheck2, Gauge, GitBranch, Link2, Play, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

const timeline = [
  ["Milestone approved", "Karma GAP"],
  ["Manifest verified", "Policy engine"],
  ["Workflow frozen", "KeeperHub"],
  ["USDC transferred", "Optimism"],
  ["Receipt confirmed", "GrantRail"]
] as const;

export default function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing-nav wrap">
        <Logo />
        <div className="nav-links">
          <a href="#how">How it works</a><a href="#security">Security</a><Link href="/docs">Docs</Link><Link href="/dashboard">Demo</Link>
        </div>
        <Link className="button button-primary nav-cta" href="/dashboard">Open app <ArrowRight size={17} /></Link>
      </nav>

      <section className="hero wrap">
        <div className="hero-glow" />
        <div className="hero-copy">
          <p className="eyebrow">FROM APPROVAL TO PAYMENT — ONCHAIN</p>
          <h1><span>GrantRail</span><br />Karma milestone payouts executed by <em>KeeperHub</em></h1>
          <p className="hero-lede">When a grant milestone is approved on Karma, GrantRail releases the exact pre-approved USDC tranche through KeeperHub—and proves every step.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/dashboard">Run the demo <ArrowRight size={18} /></Link>
            <a className="button button-secondary" href="#how"><Play size={16} fill="currentColor" /> See how it works</a>
          </div>
          <div className="trust-row"><span><Check size={14} /> Open source</span><span><Check size={14} /> Non-custodial</span><span><Check size={14} /> Optimism mainnet ready</span></div>
        </div>

        <div className="hero-console" aria-label="GrantRail execution preview">
          <div className="console-top"><Logo /><span className="wallet-dot" /> <code>0x6f3...2a7c</code></div>
          <div className="console-body">
            <aside><b>Overview</b><span>Grants</span><span>Milestones</span><span>Payouts</span><span>Receipts</span></aside>
            <div className="console-content">
              <div className="console-heading"><div><small>LIVE PAYOUT</small><h3>Climate Action Fund</h3></div><span className="live-pill">Approved</span></div>
              <div className="console-grid">
                <div className="grant-card">
                  <label>Karma grant UID</label><code>0x7a3...9f2e</code>
                  <label>Milestone</label><strong>Audited registry</strong>
                  <label>Recipient</label><code>0x6f3...2a7c</code>
                  <div className="amount-row"><div><label>Amount</label><strong>1.00 USDC</strong></div><div><label>Chain</label><strong>Optimism</strong></div></div>
                </div>
                <div className="timeline-card">
                  <small>EXECUTION TIMELINE</small>
                  {timeline.map(([label, source], index) => <div className="timeline-item" key={label}><i><Check size={10} /></i><span><b>{label}</b><small>{source}</small></span><time>{`14:${32 + index * 2}`}</time></div>)}
                </div>
              </div>
              <div className="hash-bar"><ShieldCheck size={15} /><span>Manifest locked</span><code>sha256:8ef3...c2a9</code></div>
            </div>
          </div>
        </div>
      </section>

      <section className="proof-strip wrap">
        <article><Link2 /><div><b>Real Karma integration</b><span>Live grants, milestones and approvals</span></div></article>
        <article><ShieldCheck /><div><b>Frozen by design</b><span>No interpretation during execution</span></div></article>
        <article><Bolt /><div><b>KeeperHub execution</b><span>Reliable USDC payouts on Optimism</span></div></article>
        <article><Eye /><div><b>One public receipt</b><span>Evidence through transaction</span></div></article>
      </section>

      <section className="section wrap" id="how">
        <div className="section-kicker">THE DETERMINISTIC BOUNDARY</div>
        <div className="section-title-row"><h2>Let the agent reason.<br /><span>Never let it improvise with funds.</span></h2><p>The agent composes once. A human reviews once. KeeperHub executes exactly what was approved.</p></div>
        <div className="steps-grid">
          <article><span>01</span><GitBranch /><h3>Connect a real grant</h3><p>GrantRail reads the Karma grant, milestone, approval attestation and canonical payout address.</p></article>
          <article><span>02</span><FileCheck2 /><h3>Review and freeze</h3><p>The complete payout manifest is validated, simulated and sealed with a canonical SHA-256 hash.</p></article>
          <article><span>03</span><Gauge /><h3>Execute and prove</h3><p>KeeperHub moves USDC and GrantRail joins every execution artifact into a public receipt.</p></article>
        </div>
      </section>

      <section className="security-section" id="security">
        <div className="wrap security-grid">
          <div><p className="eyebrow">FAIL CLOSED. ALWAYS.</p><h2>Safety is the product,<br />not a disclaimer.</h2><p>Every payout crosses explicit checks before KeeperHub receives an execution request.</p><Link className="text-link" href="/docs">Read the security model <ArrowRight size={16} /></Link></div>
          <div className="security-list">
            {["Approval is live and not revoked", "Recipient matches the Karma grant", "Chain and token are allowlisted", "Manifest hash is unchanged", "Tranche has never been paid", "Ambiguous writes are never rebroadcast"].map((item) => <div key={item}><ShieldCheck size={20} /><span>{item}</span><small>ENFORCED</small></div>)}
          </div>
        </div>
      </section>

      <footer className="wrap"><Logo /><p>Approved on Karma. Executed exactly by KeeperHub.</p><div><a href="https://github.com" rel="noreferrer">GitHub</a><Link href="/docs">Documentation</Link></div></footer>
    </main>
  );
}
