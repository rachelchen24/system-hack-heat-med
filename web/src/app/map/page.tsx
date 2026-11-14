import type { Metadata } from "next";
import Link from "next/link";
import { ClinicianMap } from "@/components/map/ClinicianMap";
import { FILES, loadMapPatients } from "@/components/map/data";
import { Timelapse } from "@/components/replay/Timelapse";
import { loadReplay } from "@/lib/replay";

export const metadata: Metadata = { title: "Heat map · Cool-Aid" };

const VIEWS = [
  { id: "forecast", label: "Who is at risk today" },
  { id: "hours", label: "Hour by hour (time-lapse)" },
] as const;
type View = (typeof VIEWS)[number]["id"];

// Clinician heat + help map, with the heat-day time-lapse as a second view (?view=hours).
// Patients load server-side (small); heat areas and help places are fetched by the client
// from /api/map/layers.
export default async function MapPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: v } = await searchParams;
  const view: View = v === "hours" ? "hours" : "forecast";

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Who is at risk, and where help is</h1>
        <p className="text-[var(--ui-ink-muted,#4b5563)]">
          Heat wave of June 24, 2025 (replay). Each dot is a synthetic patient&apos;s home, colored by heat risk.
        </p>
      </header>

      <nav aria-label="Map view" className="inline-flex rounded-full border border-line bg-surface p-1 text-sm font-semibold">
        {VIEWS.map((x) => (
          <Link
            key={x.id}
            href={x.id === "forecast" ? "/map" : `/map?view=${x.id}`}
            aria-current={view === x.id ? "page" : undefined}
            className={
              view === x.id
                ? "rounded-full bg-ink px-4 py-1.5 text-page"
                : "rounded-full px-4 py-1.5 text-ink-muted hover:text-ink"
            }
          >
            {x.label}
          </Link>
        ))}
      </nav>

      {view === "hours" ? <HoursView /> : <ForecastView />}
    </div>
  );
}

function ForecastView() {
  const patients = loadMapPatients();
  return patients.length ? (
    <ClinicianMap patients={patients} files={{ panel: FILES.panel, patients: FILES.patients }} />
  ) : (
    <p className="rounded-xl border border-dashed p-4 text-sm">
      Patients go here: {FILES.panel} and {FILES.patients} (not found).
    </p>
  );
}

function HoursView() {
  const data = loadReplay();
  return data ? (
    <Timelapse data={data} embedded />
  ) : (
    <p className="rounded-xl border border-dashed p-4 text-sm">
      Data goes here: data/processed/replay_heatwave_hourly.csv, hvi_modzcta.geojson, synthetic/patients.csv,
      panel_scores_replay.json (not found).
    </p>
  );
}
