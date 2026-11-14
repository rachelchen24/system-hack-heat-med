import Link from "next/link";
import { Placeholder } from "@/components/Placeholder";
import { STAGES } from "@/lib/journey";

// Public story (placeholder). Plain language first (spec §3.4).
export default function Home() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">The Missing Label</p>
        <h1 className="text-4xl font-bold leading-tight">
          Some everyday medicines make heat more dangerous. Their labels rarely say so.
        </h1>
        <p className="text-lg text-ink-muted">
          We follow a medicine from the prescription to the days after a heat wave, and show what heat does at each
          step, what the evidence says, and who should act.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/map" className="rounded bg-ink px-4 py-2 font-semibold text-page">
            Open the Evidence Map
          </Link>
          <Link href="/patient" className="rounded border-2 border-ink px-4 py-2 font-semibold">
            See the patient app
          </Link>
        </div>
      </section>

      <section aria-labelledby="journey-h">
        <h2 id="journey-h" className="mb-3 text-2xl font-bold">
          The medicine&apos;s journey
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((s) => (
            <li key={s.id} className="rounded-tile border border-line bg-surface p-4">
              <Link href={`/journey/${s.id}`} className="block space-y-1">
                <div className="text-sm font-semibold text-ink-muted">Step {s.n}</div>
                <div className="text-lg font-bold">{s.name}</div>
                <p className="text-sm">{s.heat}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <Placeholder title="Public story: scrolling narrative" spec="§3, §7.5">
        Headline line, the featured schizophrenia / antipsychotics case, and the four strengths go here.
      </Placeholder>
    </div>
  );
}
