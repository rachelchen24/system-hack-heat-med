import { Suspense } from "react";
import PatientPlanMap from "@/components/map/PatientPlanMap";
import { HOT_FEELS_LIKE_F } from "@/components/map/patientPlanData";
import { Placeholder } from "@/components/Placeholder";
import { getPanelPatient } from "@/lib/panel";
import { MASKED_WHY_ES, patientWhy, patientWhyEs, plainName, RISK, RISK_LABEL_ES, riskGroup, SIGN_ES } from "@/lib/risk";
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
const hourLongEs = (h: number) =>
  h === 0 || h === 24 ? "la medianoche" : h === 12 ? "el mediodía" : `${h % 12 === 1 ? "la" : "las"} ${h % 12} ${h < 12 ? "a.m." : "p.m."}`;

// Fixed UI labels. Spanish is a machine-style translation, shown with a "por revisar" note.
const T = {
  en: {
    risk: "Your heat risk today:",
    synthetic: "Synthetic patient · heat wave replay, June 24, 2025",
    safest: "Safest time to go out",
    stayInside: (a: number, b: number) => `Stay inside from ${hourLong(a)} to ${hourLong(b)}. Go out early in the morning.`,
    noHot: "No very hot hours today.",
    hourly: "Hourly heat today",
    feels: (h: number, f: number) => `${hourLong(h)}: feels like ${f}°F`,
    ok: "OK to go out",
    stayIn: (f: number) => `Stay in (feels like ${f}°F+)`,
    where: "Where to go",
    orStay: "Or stay in",
    orStayText: "If it is hard to get out, ask your clinic for a delivery instead, and stay in the coolest room you have.",
    watch: "What to watch for",
    mayNot: (l: string) => `${l} may not happen:`,
    checkIn: "We will check in with you today.",
    contact: (n: string) => ` If you don't answer, we will ask ${n} to check on you.`,
    talk: "Talk to your doctor or pharmacist.",
    note: null as string | null,
  },
  es: {
    risk: "Su riesgo por calor hoy:",
    synthetic: "Paciente sintético · repetición de la ola de calor, 24 de junio de 2025",
    safest: "La hora más segura para salir",
    stayInside: (a: number, b: number) => `Entre ${hourLongEs(a)} y ${hourLongEs(b)}, quédese adentro. Salga temprano en la mañana.`,
    noHot: "Hoy no hay horas de mucho calor.",
    hourly: "Calor por hora hoy",
    feels: (h: number, f: number) => `${hourLongEs(h)}: se siente como ${f}°F`,
    ok: "Puede salir",
    stayIn: (f: number) => `Quédese adentro (se siente como ${f}°F o más)`,
    where: "Adónde ir",
    orStay: "O quédese en casa",
    orStayText: "Si le cuesta salir, pida a su clínica una entrega a domicilio y quédese en el cuarto más fresco de su casa.",
    watch: "Señales de alerta",
    mayNot: (l: string) => `${l} (puede no aparecer):`,
    checkIn: "Hoy le vamos a preguntar cómo está.",
    contact: (n: string) => ` Si no contesta, le pediremos a ${n} que vaya a verle.`,
    talk: "Hable con su médico o farmacéutico.",
    note: "Traducción automática — por revisar" as string | null,
  },
};

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
  const es = p.language === "es";
  const t = es ? T.es : T.en;

  const plan = (
    <div className="space-y-6">
      {/* 1. Risk today */}
      <section className={`rounded-2xl border-2 p-4 ${RISK[g].chip}`}>
        <p className="text-patient-lg font-bold">{t.risk} {es ? RISK_LABEL_ES[g] : RISK[g].label}</p>
        <p className="mt-1 text-ink">{es ? patientWhyEs(p) : patientWhy(p)}</p>
        <p className="mt-1 text-base text-ink-muted">{t.synthetic}</p>
        {t.note && <p className="mt-1 text-sm italic text-ink-muted">{t.note}</p>}
      </section>

      {/* 2. Safest time to go out */}
      <section className="space-y-2">
        <h2 className="text-patient-lg font-bold">{t.safest}</h2>
        {hours.length ? (
          <>
            <p>
              {hot.length
                ? t.stayInside(hot[0].hour, hot[hot.length - 1].hour + 1)
                : t.noHot}
            </p>
            <ol className="flex gap-0.5" aria-label={t.hourly}>
              {hours.map((h) => {
                const isHot = (h.heatIndexF ?? h.tempF) >= HOT_FEELS_LIKE_F;
                return (
                  <li key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                    <span
                      title={t.feels(h.hour, Math.round(h.heatIndexF ?? h.tempF))}
                      className={`h-8 w-full rounded ${isHot ? "bg-hold-solid" : "bg-verify-double-bg border border-verify-double-fg"}`}
                    />
                    {h.hour % 3 === 0 && <span className="text-xs text-ink-muted">{hourLabel(h.hour)}</span>}
                  </li>
                );
              })}
            </ol>
            <p className="flex gap-4 text-base">
              <span><span aria-hidden className="mr-1 inline-block h-3 w-3 rounded-sm border border-verify-double-fg bg-verify-double-bg" />{t.ok}</span>
              <span><span aria-hidden className="mr-1 inline-block h-3 w-3 rounded-sm bg-hold-solid" />{t.stayIn(HOT_FEELS_LIKE_F)}</span>
            </p>
          </>
        ) : (
          <Placeholder title="Hourly heat">Data goes here: {HOURLY_FILE}</Placeholder>
        )}
      </section>

      {/* 3. Where to go */}
      <section className="space-y-2">
        <h2 className="text-patient-lg font-bold">{t.where}</h2>
        <div className="overflow-hidden rounded-2xl border border-line">
          <PatientPlanMap patientId={p.patientId} height={300} />
        </div>
      </section>

      {/* 4. Or stay in */}
      <section className="rounded-2xl bg-surface p-4">
        <h2 className="text-patient-lg font-bold">{t.orStay}</h2>
        <p>{t.orStayText}</p>
      </section>

      {/* 5. What to watch for */}
      <section className="space-y-2">
        <h2 className="text-patient-lg font-bold">{t.watch}</h2>
        <ul className="list-disc space-y-1 pl-6">
          {symptoms.map((s) => (
            <li key={s.sign}>{es ? SIGN_ES[s.sign] ?? s.label : s.label}</li>
          ))}
        </ul>
        {masked.map((m) => (
          <p key={m.sign} className="text-base">
            <b>{t.mayNot(es ? SIGN_ES[m.sign] ?? m.label : m.label)}</b> {es ? MASKED_WHY_ES[m.sign] ?? m.why : m.why}.
          </p>
        ))}
        {g === "high" && (
          <p className="text-base">
            {t.checkIn}
            {contact ? t.contact(plainName(contact.name)) : ""}
          </p>
        )}
        <p className="font-bold">{t.talk}</p>
      </section>
    </div>
  );

  return (
    <Phone patientId={p.patientId} firstName={name} language={es ? "es" : "en"}>
      {plan}
    </Phone>
  );
}
