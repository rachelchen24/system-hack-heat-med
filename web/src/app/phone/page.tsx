import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Placeholder } from "@/components/Placeholder";
import { loadPanel } from "@/lib/panel";
import { patientWhy, plainName, RISK, riskGroup } from "@/lib/risk";

export const metadata: Metadata = { title: "Patient app · Cool-Aid" };

// Pick which synthetic patient the patient app plays. Story patients first (S01–S10).
export default function PhonePicker() {
  const panel = loadPanel("replay");
  if (!panel) {
    return <Placeholder title="Patient app">Data goes here: data/processed/panel_scores_replay.json</Placeholder>;
  }
  const story = panel.data.patients.filter((p) => p.storyLabel).sort((a, b) => a.patientId.localeCompare(b.patientId));
  return (
    <div className="max-w-2xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Patient app</h1>
        <p className="text-ink-muted">Pick a patient to see their heat plan for today. All patients are synthetic.</p>
      </header>
      <Link
        href="/phone/signup"
        className="inline-flex h-11 items-center rounded-md bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90"
      >
        New here? Get your heat plan
      </Link>
      <Card className="overflow-hidden border-line"><ul className="divide-y divide-line">
        {story.map((p) => {
          const g = riskGroup(p.readiness?.level);
          return (
            <li key={p.patientId}>
              <Link href={`/phone/${p.patientId}`} className="block px-4 py-3 hover:bg-surface">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{plainName(p.displayName)}</span>
                  <span className="text-sm text-ink-muted">· {p.age}</span>
                  <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK[g].chip}`}>{RISK[g].label} risk</span>
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">{patientWhy(p)}</span>
              </Link>
            </li>
          );
        })}
      </ul></Card>
    </div>
  );
}
