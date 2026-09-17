import type { Metadata } from "next";
import { PublicDemo } from "@/components/public-demo";

export const metadata: Metadata = {
  title: "Public demo",
  description: "Run GrantRail's deterministic approval-to-receipt flow without credentials or chain writes."
};

export default function DemoPage() {
  return <PublicDemo />;
}
