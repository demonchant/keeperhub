import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="logo" href="/" aria-label="GrantRail home">
      <Image src="/brand-mark.svg" width={38} height={38} alt="" priority />
      {!compact && <span>Grant<span>Rail</span></span>}
    </Link>
  );
}
