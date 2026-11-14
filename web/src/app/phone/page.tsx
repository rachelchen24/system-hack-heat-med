import type { Metadata } from "next";
import Link from "next/link";
import { Placeholder } from "@/components/Placeholder";
import { loadPanel } from "@/lib/panel";

export const metadata: Metadata = { title: "Demo phone · The Missing Label" };

// Pick which synthetic patient the demo phone plays. Story patients first (S01–S10).
export default function PhonePicker() {
  const panel = loadPanel("replay");
  if (!panel) {
    return <Placeholder title="Demo phone">Data goes here: data/processed/panel_scores_replay.json</Placeholder>;
  }
  const story = panel.data.patients.filter((p) => p.storyLabel).sort((a, b) => a.patientId.localeCompare(b.patientId));
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Demo phone: pick a patient</h1>
      <p className="text-sm text-ink-muted">Open this on the phone at http://&lt;laptop-ip&gt;:3000/phone. Synthetic patients only.</p>
      <ul className="space-y-2">
        {story.map((p) => (
          <li key={p.patientId}>
            <Link href={`/phone/${p.patientId}`} className="block rounded-tile border border-line-strong p-3 hover:bg-surface">
              <span className="font-semibold">{p.patientId}</span> · {p.age} · {p.language}
              <span className="block text-sm text-ink-muted">{p.storyLabel}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
