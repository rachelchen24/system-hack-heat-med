import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-bold">Patient app</h1>
      <p className="text-ink-muted">Pick a patient to see their heat plan for today. All patients are synthetic.</p>
      <Link
        href="/phone/signup"
        className="block rounded-2xl border border-risk-low bg-risk-low-tint p-4 text-lg font-semibold text-risk-low-ink hover:opacity-90"
      >
        New here? Answer a few questions to get your heat plan →
      </Link>
      <ul className="space-y-2">
        {story.map((p) => {
          const g = riskGroup(p.readiness?.level);
          return (
            <li key={p.patientId}>
              <Link href={`/phone/${p.patientId}`} className="block rounded-2xl border border-line p-4 hover:bg-surface">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">{plainName(p.displayName)}</span>
                  <span className="text-sm text-ink-muted">{p.age}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK[g].chip}`}>{RISK[g].label} risk</span>
                </span>
                <span className="mt-1 block text-sm">{patientWhy(p)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
