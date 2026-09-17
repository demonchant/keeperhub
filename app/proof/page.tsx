import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { StatusPill } from "@/components/status-pill";

export const metadata: Metadata = {
  title: "Verified mainnet proof",
  description: "The verified Karma project-support transaction executed through KeeperHub on Optimism."
};

const transactionHash = "0xe0d641331802687902d519f0c93bdd5ffbd2ad4da54537549ea8d9dde9cac381";
const transactionUrl = `https://optimistic.etherscan.io/tx/${transactionHash}`;
const manifestHash = "sha256:101125e53e165750ce935d697e1ecc2a76f202f620ca50230c7584e5d5ac127f";
const timeline = [
  ["Karma recipient validated", "VALIDATED", "02:42 UTC"],
  ["KeeperHub workflow simulated", "SIMULATED", "02:48 UTC"],
  ["Operator reviewed exact hash", "FROZEN", "10:55 UTC"],
  ["KeeperHub execution submitted", "CONFIRMING", "10:55 UTC"],
  ["Optimism transaction verified", "VERIFIED", "10:55 UTC"]
] as const;

export default function ProofPage() {
  return <main className="receipt-page"><div className="receipt-wrap">
    <header className="receipt-nav"><Logo /><Link href="/"><ArrowLeft /> Home</Link></header>
    <section className="receipt-hero"><div><p>VERIFIED MAINNET EVIDENCE</p><h1>Karma project support,<br />executed by KeeperHub.</h1></div><StatusPill status="VERIFIED" /></section>
    <section className="receipt-card">
      <div className="receipt-summary"><div><small>AMOUNT</small><strong>1.00 USDC</strong></div><div><small>NETWORK</small><strong>Optimism</strong></div><div><small>RECIPIENT</small><strong>0xC987…A09B</strong></div><div><small>EXECUTION</small><strong>rgn2fnc4do7njpreze1ha</strong></div></div>
      <div className="receipt-chain">{timeline.map(([event, status, time]) => <div key={event} className="receipt-event"><i><Check /></i><div><b>{event}</b><span>{status}</span></div><time>17 Sep 2026 · {time}</time></div>)}</div>
      <div className="receipt-proof"><ShieldCheck /><div><small>FROZEN MANIFEST</small><code>{manifestHash}</code></div></div>
      <div className="receipt-links">
        <a href="https://www.karmahq.xyz/project/karma" target="_blank" rel="noreferrer">Karma project <ExternalLink /></a>
        <a href={transactionUrl} target="_blank" rel="noreferrer">Optimism transaction <ExternalLink /></a>
        <a href="https://github.com/demonchant/keeperhub/blob/main/docs/evidence/mainnet-proof.json" target="_blank" rel="noreferrer">Repository evidence <ExternalLink /></a>
      </div>
    </section>
    <p className="receipt-footnote">KeeperHub workflow <code>0fdlxsr3rpq2s4vpptbfk</code> transferred native Optimism USDC to the chain-specific recipient published by Karma.</p>
  </div></main>;
}
