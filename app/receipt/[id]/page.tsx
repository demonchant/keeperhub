import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { StatusPill } from "@/components/status-pill";
import { PayoutService } from "@/lib/service";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await new PayoutService().receipt(id);
  if (!receipt) return <main className="receipt-page"><div className="receipt-wrap"><Logo /><h1>Receipt not found</h1><Link href="/dashboard">Return to dashboard</Link></div></main>;
  const { payout, events } = receipt;
  return <main className="receipt-page"><div className="receipt-wrap">
    <header className="receipt-nav"><Logo /><Link href="/dashboard"><ArrowLeft /> Operations</Link></header>
    {payout.demo && <div className="demo-ribbon">DEMO RECORD — NOT ONCHAIN SUBMISSION EVIDENCE</div>}
    <section className="receipt-hero"><div><p>GRANTRAIL EXECUTION RECEIPT</p><h1>Approval to payment,<br />fully accounted for.</h1></div><StatusPill status={payout.status} /></section>
    <section className="receipt-card">
      <div className="receipt-summary"><div><small>AMOUNT</small><strong>{payout.manifest.amount} USDC</strong></div><div><small>NETWORK</small><strong>Optimism</strong></div><div><small>TRANCHE</small><strong>#{payout.manifest.tranche}</strong></div><div><small>EXECUTION</small><strong>{payout.executionId ?? "Not submitted"}</strong></div></div>
      <div className="receipt-chain">{events.map((event) => <div key={event.id} className="receipt-event"><i><Check /></i><div><b>{event.event.replaceAll("_", " ")}</b><span>{event.toStatus}</span></div><time>{new Date(event.createdAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</time></div>)}</div>
      <div className="receipt-proof"><ShieldCheck /><div><small>FROZEN MANIFEST</small><code>{payout.manifestHash}</code></div></div>
      <div className="receipt-links"><a href={payout.manifest.evidenceUrl} target="_blank" rel="noreferrer">Karma evidence <ExternalLink /></a>{payout.transactionLink && <a href={payout.transactionLink} target="_blank" rel="noreferrer">Optimism transaction <ExternalLink /></a>}<a href={`/api/payouts/${payout.id}/receipt`} target="_blank">Machine-readable JSON <ExternalLink /></a></div>
    </section>
    <p className="receipt-footnote">This receipt binds a Karma milestone approval to one immutable payout instruction and one KeeperHub execution.</p>
  </div></main>;
}
