import Link from "next/link";
import { Suspense } from "react";
import { DISCLAIMER } from "./Disclaimer";
import { ActiveNav, NavLinks } from "./SiteNav";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-page">
      <p className="border-b border-line bg-surface px-4 py-1 text-center text-xs text-ink-muted">{DISCLAIMER}</p>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight" style={{ color: "var(--bucket-store-solid, #0e7c86)" }}>
          Cool-Aid
        </Link>
        <Suspense fallback={<NavLinks path={null} />}>
          <ActiveNav />
        </Suspense>
      </div>
    </header>
  );
}
