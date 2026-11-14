import { Suspense } from "react";
import Link from "next/link";
import { PatientPlanMapView, PatientPlanMore } from "@/components/map/PatientPlanMapView";
import { getPatientPlanMapData, HOT_FEELS_LIKE_F } from "@/components/map/patientPlanData";
import { Placeholder } from "@/components/Placeholder";
import { getPanelPatient } from "@/lib/panel";
import { MASKED_WHY_ES, patientWhy, patientWhyEs, plainName, RISK, RISK_LABEL_ES, riskGroup, SIGN_ES } from "@/lib/risk";
import { HOURLY_FILE, hourlyHeat } from "@/lib/synthetic";
import { Phone } from "./Phone";
import { MedicineCabinet, type CabinetEffect } from "@/components/cabinet/MedicineCabinet";

/** "Blood pressure (dizziness, fainting)" → title + signs */
function splitLabel(label: string): { title: string; signs: string | null } {
  const m = /^(.*?)\s*\((.*)\)\s*$/.exec(label);
  return m ? { title: m[1], signs: m[2] } : { title: label, signs: null };
}

// Patient "my heat plan" (P3). Everything comes from panel_scores_replay.json,
// replay_heatwave_hourly.csv and the map component's files. Map first: "where do I go?"
export default function PhonePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
      <PhoneForPatient params={params} />
    </Suspense>
  );
}

const hourLabel = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);
const hourLong = (h: number) => (h === 0 || h === 24 ? "midnight" : h < 12 ? `${h} AM` : h === 12 ? "noon" : `${h - 12} PM`);
const hourLongEs = (h: number) =>
  h === 0 || h === 24 ? "la medianoche" : h === 12 ? "el mediodía" : `${h % 12 === 1 ? "la" : "las"} ${h % 12} ${h < 12 ? "a.m." : "p.m."}`;

// Fixed UI labels. Spanish is a machine-style translation, noted under "More".
const T = {
  en: {
    risk: "Your heat risk today:",
    synthetic: "Synthetic patient",
    replay: "Heat wave replay, June 24, 2025.",
    safest: "Best time to go out",
    stayInside: (a: number, b: number) => `Stay inside ${hourLong(a)} to ${hourLong(b)}.`,
    noHot: "No very hot hours today.",
    hourly: "Hourly heat today",
    feels: (h: number, f: number) => `${hourLong(h)}: feels like ${f}°F`,
    ok: "OK",
    stayIn: "Stay in",
    watch: "Watch for",
    mayNot: (l: string) => `${l} may not happen:`,
    checkIn: "We will check in with you today.",
    contact: (n: string) => ` If you don't answer, we will ask ${n} to check on you.`,
    talk: "Talk to your doctor or pharmacist.",
    more: "More",
    update: "Update my answers",
    note: null as string | null,
  },
  es: {
    risk: "Su riesgo por calor hoy:",
    synthetic: "Paciente de prueba",
    replay: "Repetición de la ola de calor, 24 de junio de 2025.",
    safest: "La mejor hora para salir",
    stayInside: (a: number, b: number) => `Quédese adentro de ${hourLongEs(a)} a ${hourLongEs(b)}.`.replace(/\.\.$/, "."),
    noHot: "Hoy no hay horas de mucho calor.",
    hourly: "Calor por hora hoy",
    feels: (h: number, f: number) => `${hourLongEs(h)}: se siente como ${f}°F`,
    ok: "Puede salir",
    stayIn: "Quédese adentro",
    watch: "Señales de alerta",
    mayNot: (l: string) => `${l} (puede no aparecer):`,
    checkIn: "Hoy le vamos a preguntar cómo está.",
    contact: (n: string) => ` Si no contesta, le pediremos a ${n} que vaya a verle.`,
    talk: "Hable con su médico o farmacéutico.",
    more: "Más",
    update: "Actualizar mis respuestas",
    note: "Traducción automática — por revisar" as string | null,
  },
};

/** First sentence only, so the headline reason stays one short line. */
const firstSentence = (s: string) => (/^.*?[.!?](\s|$)/.exec(s)?.[0] ?? s).trim();

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
  const symptoms = [...(p.stacking?.symptoms ?? [])].sort((a, b) => Number(b.stacked) - Number(a.stacked)).slice(0, 4);
  const masked = p.stacking?.maskedSigns ?? [];
  const contact = p.escalation?.contacts?.find((c) => c.contactId === p.escalation?.firstContactId);
  const es = p.language === "es";
  const t = es ? T.es : T.en;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mechanisms = ((p as any).stacking?.mechanisms ?? []) as { defense: string; label: string; drugs: string[] }[];
  const cabinet: CabinetEffect[] = mechanisms
    .filter((m) => m.drugs?.length)
    .map((m) => ({ id: m.defense, ...splitLabel(m.label), drugs: m.drugs }));
  const lang = es ? "es" : "en";
  const mapData = getPatientPlanMapData(p.patientId);
  const why = es ? patientWhyEs(p) : patientWhy(p);

  const plan = (
    <div className="space-y-8">
      {/* 1. Risk headline + the map: "where do I go?" first */}
      <section className="space-y-1">
        <p className="text-patient-lg font-bold leading-snug">
          {t.risk}{" "}
          <span className={`inline-block rounded-full px-3 ${RISK[g].solid}`}>{es ? RISK_LABEL_ES[g] : RISK[g].label}</span>
        </p>
        <p>{firstSentence(why)}</p>
      </section>

      <PatientPlanMapView data={mapData} height={320} lang={lang} variant="patient" />

      {/* 2. Best time to go out */}
      <section className="space-y-2">
        <h2 className="text-patient-lg font-bold">{t.safest}</h2>
        {hours.length ? (
          <>
            <p>{hot.length ? t.stayInside(hot[0].hour, hot[hot.length - 1].hour + 1) : t.noHot}</p>
            <ol className="flex gap-0.5" aria-label={t.hourly}>
              {hours.map((h) => {
                const isHot = (h.heatIndexF ?? h.tempF) >= HOT_FEELS_LIKE_F;
                return (
                  <li key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                    <span
                      title={t.feels(h.hour, Math.round(h.heatIndexF ?? h.tempF))}
                      className={`h-8 w-full rounded ${isHot ? "bg-hold-solid" : "bg-verify-double-bg border border-verify-double-fg"}`}
                    />
                    {h.hour % 3 === 0 && <span className="text-sm text-ink-muted">{hourLabel(h.hour)}</span>}
                  </li>
                );
              })}
            </ol>
            <p className="flex gap-5 text-base">
              <span><span aria-hidden className="mr-1 inline-block h-3 w-3 rounded-sm border border-verify-double-fg bg-verify-double-bg" />{t.ok}</span>
              <span><span aria-hidden className="mr-1 inline-block h-3 w-3 rounded-sm bg-hold-solid" />{t.stayIn}</span>
            </p>
          </>
        ) : (
          <Placeholder title="Hourly heat">Data goes here: {HOURLY_FILE}</Placeholder>
        )}
      </section>

      {/* 3. What to watch for (max 4) */}
      {symptoms.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-patient-lg font-bold">{t.watch}</h2>
          <ul className="list-disc space-y-1 pl-6">
            {symptoms.map((s) => (
              <li key={s.sign}>{es ? SIGN_ES[s.sign] ?? s.label : s.label}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Medicine cabinet (visual) */}
      <MedicineCabinet
        effects={cabinet}
        title={es ? "Sus medicinas y el calor" : "Your medicines in the heat"}
        hint={es ? "Toque sus medicinas para ver qué le pueden hacer con el calor." : "Tap your medicines to see what they can do in the heat."}
      />
    </div>
  );

  const footer = (
    <div className="space-y-4 pb-4">
      <p className="text-patient-lg font-bold">{t.talk}</p>
      <details className="text-base text-ink-muted">
        <summary className="flex min-h-tap cursor-pointer items-center font-semibold text-ink">{t.more}</summary>
        <div className="space-y-2 pt-2">
          {why !== firstSentence(why) && <p>{why}</p>}
          {masked.map((m) => (
            <p key={m.sign}>
              <b>{t.mayNot(es ? SIGN_ES[m.sign] ?? m.label : m.label)}</b> {es ? MASKED_WHY_ES[m.sign] ?? m.why : m.why}.
            </p>
          ))}
          <PatientPlanMore data={mapData} lang={lang} />
          <p>{t.synthetic}. {t.replay}</p>
          {t.note && <p className="italic">{t.note}</p>}
          <Link href={`/phone/signup?patient=${p.patientId}`} className="inline-flex min-h-tap items-center underline">
            {t.update}
          </Link>
        </div>
      </details>
    </div>
  );

  return (
    <Phone
      patientId={p.patientId}
      firstName={name}
      language={lang}
      badge={t.synthetic}
      checkInNote={g === "high" ? t.checkIn + (contact ? t.contact(plainName(contact.name)) : "") : null}
      footer={footer}
    >
      {plan}
    </Phone>
  );
}
