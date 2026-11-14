import { Suspense } from "react";
import { Placeholder } from "@/components/Placeholder";
import { getPanelPatient } from "@/lib/panel";
import { Phone } from "./Phone";

// Cache Components: params are runtime data, so read them inside <Suspense>.
export default function PhonePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
      <PhoneForPatient params={params} />
    </Suspense>
  );
}

async function PhoneForPatient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getPanelPatient(id, "replay");
  if (!p) {
    return <Placeholder title={`Demo phone: ${id}`}>Patient not found in data/processed/panel_scores_replay.json</Placeholder>;
  }
  const firstName = p.displayName.split(" ")[0];
  return <Phone patientId={p.patientId} firstName={firstName} language={p.language === "es" ? "es" : "en"} />;
}
