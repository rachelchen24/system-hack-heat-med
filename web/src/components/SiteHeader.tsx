import Link from "next/link";
import { STAGES } from "@/lib/journey";
import { DISCLAIMER } from "./Disclaimer";

const NAV = [
  { href: "/", label: "The story" },
  { href: "/map", label: "Evidence Map" },
  { href: "/readiness", label: "Heat-Wave Readiness" },
  { href: "/evidence", label: "Evidence (nerd stats)" },
  { href: "/patient", label: "My Medicine Cabinet" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-page">
      <div className="bg-ink px-4 py-1.5 text-center text-xs font-semibold text-page">{DISCLAIMER}</div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          The Missing Label
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded px-2.5 py-1.5 hover:bg-surface">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav aria-label="Medicine journey" className="border-t border-line bg-surface">
        <ol className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 text-xs">
          {STAGES.map((s, i) => (
            <li key={s.id} className="flex shrink-0 items-center gap-1">
              <Link href={`/journey/${s.id}`} className="rounded px-2 py-1 hover:bg-page">
                <span className="font-semibold">{s.n}.</span> {s.name}
              </Link>
              {i < STAGES.length - 1 && <span aria-hidden className="text-ink-muted">→</span>}
            </li>
          ))}
        </ol>
      </nav>
    </header>
  );
}
