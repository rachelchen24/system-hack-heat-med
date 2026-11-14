import type { Metadata } from "next";
import Link from "next/link";
import { ClinicianMap } from "@/components/map/ClinicianMap";
import { FILES, loadMapPatients } from "@/components/map/data";

export const metadata: Metadata = { title: "Heat map · The Missing Label" };

// Clinician heat + help map (also the home page, see app/page.tsx). Patients load server-side
// (small); heat areas and help places are fetched by the client from /api/map/layers.
export default function MapPage() {
  const patients = loadMapPatients();
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Who is at risk in the heat, and where to cool off</h1>
          <p className="text-[var(--ui-ink-muted,#4b5563)]">Each dot is a patient&apos;s home. Click a dot or a neighborhood.</p>
        </div>
        <nav aria-label="Other views" className="flex gap-4 text-sm text-[var(--ui-ink-muted,#4b5563)]">
          <Link href="/board" className="underline-offset-2 hover:underline">Clinician list</Link>
          <Link href="/phone" className="underline-offset-2 hover:underline">Patient app</Link>
        </nav>
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
