import type { Metadata } from "next";
import { ClinicianMap } from "@/components/map/ClinicianMap";
import { FILES, loadMapPatients } from "@/components/map/data";

export const metadata: Metadata = { title: "Heat map · The Missing Label" };

// Clinician heat + help map. Patients load server-side (small); heat areas and help places
// are fetched by the client from /api/map/layers.
export default function MapPage() {
  const patients = loadMapPatients();
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Who is at risk, and where help is</h1>
        <p className="text-[var(--ui-ink-muted,#4b5563)]">
          Heat wave forecast for June 24, 2025 (replay). Each dot is a synthetic patient&apos;s home, colored by heat risk.
        </p>
      </header>
      {patients.length ? (
        <ClinicianMap patients={patients} files={{ panel: FILES.panel, patients: FILES.patients }} />
      ) : (
        <p className="rounded-xl border border-dashed p-4 text-sm">
          Patients go here: {FILES.panel} and {FILES.patients} (not found).
        </p>
      )}
    </div>
  );
}
