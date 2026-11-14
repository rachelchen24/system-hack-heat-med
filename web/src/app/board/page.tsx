import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
import { loadPanel, type CallListRow } from "@/lib/panel";
import { Board } from "./Board";

export const metadata: Metadata = { title: "Clinic board · The Missing Label" };

// Core loop, clinician side (spec §4.0, §7.1). Call list = panel_scores_replay.json (Myra's pipeline).
export default function BoardPage() {
  const panel = loadPanel("replay");
  if (!panel) {
    return (
      <Placeholder title="Clinic board" spec="§4.0">
        Data goes here: data/processed/panel_scores_replay.json (run scripts/compute_panel.ts).
      </Placeholder>
    );
  }
  const rows: CallListRow[] = panel.data.call_list.map((r) => ({
    rank: r.rank, patient_id: r.patient_id, story: r.story, age: r.age, zip: r.zip,
    heatrisk_today: r.heatrisk_today, tier: r.tier, tier_label: r.tier_label, why: r.why, readiness: r.readiness,
  }));
  return <Board rows={rows} source={panel.file} asOf={panel.data.meta.as_of} />;
}
