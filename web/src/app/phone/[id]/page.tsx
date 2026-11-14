import { Suspense } from "react";
import PatientPlanMap from "@/components/map/PatientPlanMap";
import { HOT_FEELS_LIKE_F } from "@/components/map/patientPlanData";
import { Placeholder } from "@/components/Placeholder";
import { getPanelPatient } from "@/lib/panel";
import { patientWhy, plainName, RISK, riskGroup } from "@/lib/risk";
import { HOURLY_FILE, hourlyHeat } from "@/lib/synthetic";
import { Phone } from "./Phone";

// Patient "my heat plan" (P3). Everything comes from panel_scores_replay.json,
// replay_heatwave_hourly.csv and the map component's files.
export default function PhonePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
      <PhoneForPatient params={params} />
    </Suspense>
  );
}

const hourLabel = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);
const hourLong = (h: number) => (h === 0 || h === 24 ? "midnight" : h < 12 ? `${h} AM` : h === 12 ? "noon" : `${h - 12} PM`);

async function PhoneForPatient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getPanelPatient(id, "replay");
  if (!p) {
    return <Placeholder title={`Demo phone: ${id}`}>Patient not found in data/processed/panel_scores_replay.json</Placeholder>;
  }
  const name = plainName(p.displayName);
  const g = riskGroup(p.readiness?.level);
  const heat = hourlyHeat();
  const hours = (heat?.hours ?? []).filter((h) => h.hour >= 6 && h.hour <= 22);
  const hot = hours.filter((h) => (h.heatIndexF ?? h.tempF) >= HOT_FEELS_LIKE_F);
  const symptoms = [...(p.stacking?.symptoms ?? [])].sort((a, b) => Number(b.stacked) - Number(a.stacked)).slice(0, 5);
  const masked = p.stacking?.maskedSigns ?? [];
  const contact = p.escalation?.contacts?.find((c) => c.contactId === p.escalation?.firstContactId);

  const plan = (
    <div className="space-y-6">
      {/* 1. Risk today */}
      <section className={`rounded-2xl border-2 p-4 ${RISK[g].chip}`}>
        <p className="text-patient-lg font-bold">Your heat risk today: {RISK[g].label}</p>
        <p className="mt-1 text-ink">{patientWhy(p)}</p>
        <p className="mt-1 text-base text-ink-muted">Synthetic patient · heat wave replay, June 24, 2025</p>
      </section>

      {/* 2. Safest time to go out */}
      <section className="space-y-2">
        <h2 className="text-patient-lg font-bold">Safest time to go out</h2>
        {hours.length ? (
          <>
            <p>
              {hot.length
                ? `Stay inside from ${hourLong(hot[0].hour)} to ${hourLong(hot[hot.length - 1].hour + 1)}. Go out early in the morning.`
                : "No very hot hours today."}
            </p>
            <ol className="flex gap-0.5" aria-label="Hourly heat today">
              {hours.map((h) => {
                const isHot = (h.heatIndexF ?? h.tempF) >= HOT_FEELS_LIKE_F;
                return (
                  <li key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                    <span
                      title={`${hourLong(h.hour)}: feels like ${Math.round(h.heatIndexF ?? h.tempF)}°F`}
                      className={`h-8 w-full rounded ${isHot ? "bg-hold-solid" : "bg-verify-double-bg border border-verify-double-fg"}`}
                    />
                    {h.hour % 3 === 0 && <span className="text-xs text-ink-muted">{hourLabel(h.hour)}</span>}
                  </li>
                );
              })}
            </ol>
            <p className="flex gap-4 text-base">
              <span><span aria-hidden className="mr-1 inline-block h-3 w-3 rounded-sm border border-verify-double-fg bg-verify-double-bg" />OK to go out</span>
              <span><span aria-hidden className="mr-1 inline-block h-3 w-3 rounded-sm bg-hold-solid" />Stay in (feels like {HOT_FEELS_LIKE_F}°F+)</span>
            </p>
          </>
        ) : (
          <Placeholder title="Hourly heat">Data goes here: {HOURLY_FILE}</Placeholder>
        )}
      </section>

      {/* 3. Where to go */}
      <section className="space-y-2">
        <h2 className="text-patient-lg font-bold">Where to go</h2>
        <div className="overflow-hidden rounded-2xl border border-line">
          <PatientPlanMap patientId={p.patientId} height={300} />
        </div>
      </section>

      {/* 4. Or stay in */}
      <section className="rounded-2xl bg-surface p-4">
        <h2 className="text-patient-lg font-bold">Or stay in</h2>
        <p>If it is hard to get out, ask your clinic for a delivery instead, and stay in the coolest room you have.</p>
      </section>

      {/* 5. What to watch for */}
      <section className="space-y-2">
        <h2 className="text-patient-lg font-bold">What to watch for</h2>
        <ul className="list-disc space-y-1 pl-6">
          {symptoms.map((s) => (
            <li key={s.sign}>{s.label}</li>
          ))}
        </ul>
        {masked.map((m) => (
          <p key={m.sign} className="text-base">
            <b>{m.label} may not happen:</b> {m.why}.
          </p>
        ))}
        {g === "high" && (
          <p className="text-base">
            We will check in with you today.{contact ? ` If you don't answer, we will ask ${plainName(contact.name)} to check on you.` : ""}
          </p>
        )}
        <p className="font-bold">Talk to your doctor or pharmacist.</p>
      </section>
    </div>
  );

  return (
    <Phone patientId={p.patientId} firstName={name} language={p.language === "es" ? "es" : "en"}>
      {plan}
    </Phone>
  );
}
