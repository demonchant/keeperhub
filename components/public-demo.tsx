"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileCheck2, Gauge, LockKeyhole, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

const phases = ["READY", "COMPOSED", "SIMULATED", "FROZEN", "VERIFIED"] as const;
type Phase = typeof phases[number];

const steps = [
  ["Compose manifest", "Pin grant, milestone, recipient and amount"],
  ["Dry-run workflow", "Simulate without touching the chain"],
  ["Human review", "Freeze the canonical manifest hash"],
  ["Execute exact workflow", "Produce an isolated demonstration receipt"]
] as const;

const actionLabels: Record<Phase, string> = {
  READY: "Compose workflow",
  COMPOSED: "Run dry simulation",
  SIMULATED: "Review & freeze",
  FROZEN: "Execute simulation",
  VERIFIED: "Demo complete"
};

export function PublicDemo() {
  const [phase, setPhase] = useState<Phase>("READY");
  const [busy, setBusy] = useState(false);
  const phaseIndex = phases.indexOf(phase);

  async function advance() {
    if (busy || phase === "VERIFIED") return;
    setBusy(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    const nextPhase = phases[phaseIndex + 1];
    if (nextPhase) setPhase(nextPhase);
    setBusy(false);
  }

  return (
    <main className="public-demo-page">
      <nav className="demo-nav wrap"><Logo /><div><Link href="/"><ArrowLeft /> Home</Link><Link href="/dashboard">Public audit <ArrowRight /></Link></div></nav>
      <section className="demo-wrap">
        <div className="demo-heading">
          <p className="eyebrow">PUBLIC INTERACTIVE SANDBOX</p>
          <h1>Run the entire boundary.<br /><span>Risk nothing.</span></h1>
          <p>This isolated walkthrough uses fixed fixture data. It never calls KeeperHub, signs a transaction or touches a funded wallet.</p>
        </div>

        <div className="demo-safety"><ShieldCheck /><div><b>Zero-funds demonstration</b><span>For evaluators, developers and first-time users. Demonstration hashes and receipts are visibly excluded from submission evidence.</span></div><strong>NO BROADCAST</strong></div>

        <div className="demo-grid">
          <section className="demo-card demo-progress">
            <div className="demo-card-head"><div><small>DETERMINISTIC RUN</small><h2>Approval → receipt</h2></div><span className={`demo-phase phase-${phase.toLowerCase()}`}>{phase}</span></div>
            <div className="demo-steps">
              {steps.map(([title, detail], index) => {
                const complete = phaseIndex > index;
                const active = phaseIndex === index;
                return <div className={`demo-step ${complete ? "complete" : ""} ${active ? "active" : ""}`} key={title}><i>{complete ? <Check /> : index + 1}</i><div><b>{title}</b><span>{detail}</span></div><small>{complete ? "PASSED" : active ? "READY" : "WAITING"}</small></div>;
              })}
            </div>
            <div className="demo-controls">
              <button className="button button-secondary small" onClick={() => setPhase("READY")} disabled={busy || phase === "READY"}><RefreshCw /> Reset</button>
              <button className="button button-primary" onClick={() => void advance()} disabled={busy || phase === "VERIFIED"}>{busy ? <Gauge className="spin" /> : phase === "SIMULATED" ? <LockKeyhole /> : phase === "VERIFIED" ? <Check /> : <Play fill="currentColor" />} {busy ? "Verifying…" : actionLabels[phase]}</button>
            </div>
          </section>

          <section className="demo-card demo-manifest">
            <div className="demo-card-head"><div><small>FIXED INSTRUCTION</small><h2>Canonical manifest</h2></div><FileCheck2 /></div>
            <dl>
              <div><dt>Karma project</dt><dd>open-climate-commons</dd></div>
              <div><dt>Milestone</dt><dd>Audited emissions registry</dd></div>
              <div><dt>Recipient</dt><dd><code>0x6F3a…2a7C</code></dd></div>
              <div><dt>Amount</dt><dd>1.00 USDC</dd></div>
              <div><dt>Network</dt><dd>Optimism · 10</dd></div>
              <div><dt>Tranche</dt><dd>#1</dd></div>
            </dl>
            <div className={`demo-hash ${phaseIndex >= 3 ? "locked" : ""}`}><LockKeyhole /><div><small>MANIFEST SHA-256</small><code>8ef3c68d91b5…f7a2c2a9</code></div></div>
            {phase === "VERIFIED" && <div className="demo-receipt"><Check /><div><b>Demonstration receipt produced</b><span>Execution ID: exec_demo_8ef3c68d</span><code>0xdemo…not-onchain</code></div></div>}
          </section>
        </div>
      </section>
    </main>
  );
}
