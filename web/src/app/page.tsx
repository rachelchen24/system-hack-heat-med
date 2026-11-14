import type { Metadata } from "next";
import { Map as MapIcon, Smartphone } from "lucide-react";
import { Hero195 } from "@/components/ui/hero-195";
import { ClinicianMap } from "@/components/map/ClinicianMap";
import { FILES, loadMapPatients } from "@/components/map/data";
import PatientPlanMap from "@/components/map/PatientPlanMap";

export const metadata: Metadata = { title: "The Missing Label" };

// Home: hero with the live clinic map as the default tab, and one patient's plan as the second.
export default function Home() {
  const patients = loadMapPatients();
  const clinicMap = patients.length ? (
    <div className="bg-white p-2 sm:p-3">
      <ClinicianMap patients={patients} files={{ panel: FILES.panel, patients: FILES.patients }} mapHeight="min(64vh, 620px)" />
    </div>
  ) : (
    <p className="p-4 text-sm">Patients go here: {FILES.panel} and {FILES.patients} (not found).</p>
  );
  return (
    <Hero195
      title="Who is at risk in the heat, and where to cool off"
      description="Each dot is a patient's home. Click a dot or a neighborhood."
      className="[&_h1]:text-2xl sm:[&_h1]:text-4xl [&_h1+p]:mt-2 [&_h1+p]:text-base"
      defaultTab="map"
      tabs={[
        { value: "map", label: "Clinic map", icon: <MapIcon className="size-4" aria-hidden />, content: clinicMap },
        { value: "patient", label: "A patient's plan", icon: <Smartphone className="size-4" aria-hidden />, content: <div className="bg-white p-2 sm:p-3"><PatientPlanMap patientId="S01" variant="patient" height={420} /></div> },
      ]}
    />
  );
}
