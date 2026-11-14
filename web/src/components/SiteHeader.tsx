import Link from "next/link";
import { DISCLAIMER } from "./Disclaimer";

const NAV = [
  { href: "/board", label: "Patients" },
  { href: "/map", label: "Map" },
  { href: "/medicines", label: "Medicines" },
  { href: "/phone", label: "Patient app" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-page">
      <div className="bg-ink px-4 py-1.5 text-center text-xs font-semibold text-page">{DISCLAIMER}</div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight" style={{ color: "var(--bucket-store-solid, #0072b2)" }}>
          Cool-Aid
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-1 text-sm font-medium">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 hover:bg-surface">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
