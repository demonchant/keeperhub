"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, Check, CircleDollarSign, ExternalLink, FileClock, Gauge, KeyRound, LayoutDashboard, LoaderCircle, LockKeyhole, Play, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { Logo } from "@/components/logo";
import { StatusPill } from "@/components/status-pill";
import type { PayoutRecord } from "@/lib/domain";

type ApiError = { error?: string };
type AppMode = "demo" | "production";

const OPTIMISM_USDC = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";
const emptyPayout = {
  karmaProjectSlug: "",
  karmaGrantUID: "",
  karmaMilestoneUID: "",
  recipient: "",
  amount: "1.00",
  tranche: "1",
  evidenceUrl: ""
};

export function DashboardApp() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [selected, setSelected] = useState<PayoutRecord | null>(null);
  const [busy, setBusy] = useState<"prepare" | "approve" | "execute" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AppMode | null>(null);
  const [draft, setDraft] = useState(emptyPayout);

  const load = useCallback(async (mode: "refresh" | null = null) => {
    if (mode) setBusy(mode);
    try {
      const response = await fetch("/api/payouts", { cache: "no-store" });
      const data = await response.json() as { payouts?: PayoutRecord[] } & ApiError;
      if (!response.ok) throw new Error(data.error || "Could not load payouts");
      const next = data.payouts ?? [];
      setPayouts(next);
      setSelected((current) => current ? next.find((p) => p.id === current.id) ?? current : next[0] ?? null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load payouts"); }
    finally { if (mode) setBusy(null); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/payouts", { cache: "no-store", signal: controller.signal }),
      fetch("/api/health", { cache: "no-store", signal: controller.signal })
    ])
      .then(async ([payoutResponse, healthResponse]) => {
        const response = payoutResponse;
        const data = await response.json() as { payouts?: PayoutRecord[] } & ApiError;
        if (!response.ok) throw new Error(data.error || "Could not load payouts");
        const health = await healthResponse.json() as { mode?: AppMode } & ApiError;
        if (!healthResponse.ok || !health.mode) throw new Error(health.error || "Could not determine operating mode");
        return { payouts: data.payouts ?? [], mode: health.mode };
      })
      .then(({ payouts: next, mode: nextMode }) => { setPayouts(next); setSelected(next[0] ?? null); setMode(nextMode); })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) setError(cause instanceof Error ? cause.message : "Could not load payouts");
      });
    return () => controller.abort();
  }, []);

  async function prepare() {
    setBusy("prepare"); setError(null);
    try {
      const body = mode === "production" ? {
        ...draft,
        chainId: 10,
        tokenAddress: OPTIMISM_USDC,
        tranche: Number(draft.tranche)
      } : {};
      const response = await fetch("/api/payouts/prepare", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json() as { payout?: PayoutRecord } & ApiError;
      if (!response.ok || !data.payout) throw new Error(data.error || "Preparation failed");
      setSelected(data.payout); setDraft(emptyPayout); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Preparation failed"); }
    finally { setBusy(null); }
  }

  async function execute() {
    if (!selected) return;
    setBusy("execute"); setError(null);
    try {
      const response = await fetch(`/api/payouts/${selected.id}/execute`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifestHash: selected.manifestHash })
      });
      const data = await response.json() as { payout?: PayoutRecord } & ApiError;
      if (!response.ok || !data.payout) throw new Error(data.error || "Execution failed");
      setSelected(data.payout); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Execution failed"); }
    finally { setBusy(null); }
  }

  async function approve() {
    if (!selected) return;
    setBusy("approve"); setError(null);
    try {
      const response = await fetch(`/api/payouts/${selected.id}/approve`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifestHash: selected.manifestHash })
      });
      const data = await response.json() as { payout?: PayoutRecord } & ApiError;
      if (!response.ok || !data.payout) throw new Error(data.error || "Approval failed");
      setSelected(data.payout); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Approval failed"); }
    finally { setBusy(null); }
  }

  async function authenticate() {
    const token = window.prompt("Enter the GrantRail administrator token. It is exchanged for a secure, HTTP-only operator session and is not stored by the browser application.");
    if (!token) return;
    setError(null);
    try {
      const response = await fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json() as ApiError;
      if (!response.ok) throw new Error(data.error || "Authentication failed");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Authentication failed"); }
  }

  const m = selected?.manifest;
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav><b>WORKSPACE</b><a className="active"><LayoutDashboard />Overview</a><a><FileClock />Milestones</a><a><CircleDollarSign />Payouts</a><a><Activity />Executions</a><a><WalletCards />Receipts</a></nav>
        <div className="sidebar-note"><ShieldCheck /><b>Fail-closed mode</b><p>Every write is policy-gated and idempotent.</p></div>
        <Link className="back-link" href="/"><ArrowLeft /> Back to site</Link>
      </aside>
      <section className="workspace">
        <header className="workspace-header"><div><p>OPERATIONS CONSOLE</p><h1>Milestone payouts</h1></div><div className="header-actions"><button className="icon-button" onClick={authenticate} aria-label="Authenticate operator" title="Authenticate operator"><KeyRound /></button><button className="icon-button" onClick={() => void load("refresh")} aria-label="Refresh"><RefreshCw className={busy === "refresh" ? "spin" : ""} /></button><span className="mode-chip"><i /> {mode ? `${mode.toUpperCase()} · POLICY ACTIVE` : "LOADING POLICY"}</span></div></header>
        {error && <div className="error-banner"><ShieldCheck />{error}<button onClick={() => setError(null)}>×</button></div>}
        <div className="metrics">
          <article><small>TOTAL PAYOUTS</small><strong>{payouts.length.toString().padStart(2, "0")}</strong><span>All time</span></article>
          <article><small>VERIFIED</small><strong>{payouts.filter((p) => p.status === "VERIFIED").length.toString().padStart(2, "0")}</strong><span className="green">Onchain proof</span></article>
          <article><small>BLOCKED</small><strong>{payouts.filter((p) => p.status === "BLOCKED").length.toString().padStart(2, "0")}</strong><span>Policy protected</span></article>
          <article><small>VALUE MOVED</small><strong>{payouts.filter((p) => p.status === "VERIFIED").reduce((n, p) => n + Number(p.manifest.amount), 0).toFixed(2)}</strong><span>USDC</span></article>
        </div>

        <div className="operations-grid">
          <section className="panel payout-list-panel">
            <div className="panel-head"><div><small>QUEUE</small><h2>Payout manifests</h2></div>{mode === "demo" && <button className="button button-primary small" onClick={prepare} disabled={busy !== null}>{busy === "prepare" ? <LoaderCircle className="spin" /> : <Play />} Prepare demo</button>}</div>
            {mode === "production" && <form className="payout-form" onSubmit={(event) => { event.preventDefault(); void prepare(); }}>
              <div className="form-intro"><ShieldCheck /><span><b>Prepare a live payout</b><small>Values are verified against Karma before KeeperHub creates a disabled workflow.</small></span></div>
              <label>Project slug<input required minLength={2} maxLength={120} autoComplete="off" value={draft.karmaProjectSlug} onChange={(event) => setDraft({ ...draft, karmaProjectSlug: event.target.value })} placeholder="project-slug" /></label>
              <label>Grant UID<input required pattern="0x[a-fA-F0-9]{64}" autoComplete="off" value={draft.karmaGrantUID} onChange={(event) => setDraft({ ...draft, karmaGrantUID: event.target.value })} placeholder="0x…" /></label>
              <label>Milestone UID<input required pattern="0x[a-fA-F0-9]{64}" autoComplete="off" value={draft.karmaMilestoneUID} onChange={(event) => setDraft({ ...draft, karmaMilestoneUID: event.target.value })} placeholder="0x…" /></label>
              <label>Approved recipient<input required pattern="0x[a-fA-F0-9]{40}" autoComplete="off" value={draft.recipient} onChange={(event) => setDraft({ ...draft, recipient: event.target.value })} placeholder="0x…" /></label>
              <label>USDC amount<input required inputMode="decimal" pattern="\d+(\.\d{1,6})?" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} /></label>
              <label>Tranche<input required type="number" min="1" step="1" value={draft.tranche} onChange={(event) => setDraft({ ...draft, tranche: event.target.value })} /></label>
              <label className="form-wide">Karma evidence URL<input required type="url" autoComplete="url" value={draft.evidenceUrl} onChange={(event) => setDraft({ ...draft, evidenceUrl: event.target.value })} placeholder="https://gap.karmahq.xyz/project/…" /></label>
              <div className="form-policy"><span>Optimism</span><code>{short(OPTIMISM_USDC, 10)}</code><button className="button button-primary small" type="submit" disabled={busy !== null}>{busy === "prepare" ? <LoaderCircle className="spin" /> : <Play />} Validate &amp; simulate</button></div>
            </form>}
            <div className="payout-list">
              {payouts.length === 0 && mode !== "production" && <div className="empty-state"><LockKeyhole /><h3>No manifest yet</h3><p>Prepare the signed-off demo payout to run the full deterministic path.</p></div>}
              {payouts.map((payout) => <button key={payout.id} className={selected?.id === payout.id ? "payout-row selected" : "payout-row"} onClick={() => setSelected(payout)}><div className="project-avatar">OC</div><div><b>{payout.manifest.karmaProjectSlug.replaceAll("-", " ")}</b><code>{short(payout.manifest.karmaMilestoneUID)}</code></div><strong>{payout.manifest.amount} <small>USDC</small></strong><StatusPill status={payout.status} /></button>)}
            </div>
          </section>

          <section className="panel detail-panel">
            <div className="panel-head"><div><small>SELECTED PAYOUT</small><h2>Frozen instruction</h2></div>{selected && <StatusPill status={selected.status} />}</div>
            {!selected ? <div className="empty-state"><Gauge /><h3>Nothing selected</h3><p>Prepare or select a payout manifest.</p></div> : <>
              <div className="detail-fields">
                <label>Karma grant UID <code>{short(m!.karmaGrantUID, 10)}</code></label>
                <label>Milestone UID <code>{short(m!.karmaMilestoneUID, 10)}</code></label>
                <label>Approval attestation <code>{short(m!.approvalAttestationUID, 10)}</code></label>
                <label>Recipient <code>{short(m!.recipient, 10)}</code></label>
              </div>
              <div className="money-block"><div><small>EXACT AMOUNT</small><strong>{m!.amount} <span>USDC</span></strong></div><div><small>NETWORK</small><strong>Optimism <span>#{m!.chainId}</span></strong></div></div>
              <div className="manifest-hash"><LockKeyhole /><div><small>CANONICAL MANIFEST HASH</small><code>{selected.manifestHash}</code></div></div>
              <div className="detail-actions">
                <a className="button button-secondary small" href={m!.evidenceUrl} target="_blank" rel="noreferrer">Karma evidence <ExternalLink /></a>
                {selected.status === "SIMULATED" && <button className="button button-primary small" disabled={busy !== null} onClick={approve}>{busy === "approve" ? <LoaderCircle className="spin" /> : <LockKeyhole />} Review &amp; freeze</button>}
                {selected.status === "FROZEN" && <button className="button button-primary small" disabled={busy !== null} onClick={execute}>{busy === "execute" ? <LoaderCircle className="spin" /> : <BoltIcon />} Execute exact workflow</button>}
                {selected.status === "VERIFIED" && <Link className="button button-primary small" href={`/receipt/${selected.id}`}>Open receipt <ArrowRight /></Link>}
              </div>
            </>}
          </section>
        </div>
        <div className="integrity-note"><ShieldCheck /><p><b>{mode === "production" ? "Production safety boundary" : "Demo safety boundary"}</b><span>{mode === "production" ? "Every input is checked against live Karma data, frozen by hash, then revalidated before KeeperHub execution." : "Demo executions are visibly labeled and never presented as submission evidence. Production requires KeeperHub credentials and an administrator token."}</span></p><Check /></div>
      </section>
    </main>
  );
}

function short(value: string, size = 6) { return `${value.slice(0, size)}…${value.slice(-4)}`; }
function BoltIcon() { return <Play size={16} fill="currentColor" />; }
