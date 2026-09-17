import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GrantRail — Deterministic onchain project support", template: "%s · GrantRail" },
  description: "Karma project support executed exactly through KeeperHub, with one auditable record from live recipient resolution to transaction.",
  metadataBase: new URL("https://grantrail.dev"),
  openGraph: {
    title: "GrantRail",
    description: "Approved on Karma. Executed exactly by KeeperHub.",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
