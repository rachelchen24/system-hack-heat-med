import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
import { loadReplay } from "@/lib/replay";
import { Timelapse } from "@/components/replay/Timelapse";

export const metadata: Metadata = { title: "Heat-day time-lapse · The Missing Label" };

// Heat-day time-lapse: the June 2025 NYC heat wave, hour by hour (pitch opener).
export default function ReplayPage() {
  const data = loadReplay();
  if (!data) {
    return (
      <Placeholder title="Heat-day time-lapse" spec="build plan P5b">
        Data goes here: data/processed/replay_heatwave_hourly.csv, hvi_modzcta.geojson, synthetic/patients.csv,
        panel_scores_replay.json.
      </Placeholder>
    );
  }
  return <Timelapse data={data} />;
}
