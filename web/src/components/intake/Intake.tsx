"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { scoreIntake } from "@/app/phone/signup/actions";
import { RISK } from "@/lib/risk";
import type { IntakeAnswers, IntakeContact, IntakeMed, IntakeResult } from "./types";

// CHILL'D-Out areas (CDC 2024), as listed in research-notes/advisor-models.md.
const AREAS = [
  { key: "C", name: "Cooling" },
  { key: "H", name: "Housing" },
  { key: "I", name: "Isolation" },
  { key: "L", name: "Electricity" },
  { key: "L2", name: "Learning" },
  { key: "D", name: "Drugs" },
  { key: "Out", name: "Outside" },
] as const;
type AreaKey = (typeof AREAS)[number]["key"] | "Contact";

type Opt<V> = { label: string; value: V };
type Choice = {
  kind: "choice";
  area: AreaKey;
  field: keyof IntakeAnswers;
  q: string;
  hint?: string;
  opts: Opt<IntakeAnswers[keyof IntakeAnswers]>[];
  /** Is the pre-filled value one of these options? (floor uses ranges) */
  match?: (v: IntakeAnswers[keyof IntakeAnswers], o: Opt<IntakeAnswers[keyof IntakeAnswers]>) => boolean;
  show?: (a: IntakeAnswers) => boolean;
};
type Step = Choice | { kind: "intro" } | { kind: "meds" } | { kind: "contact" } | { kind: "result" };

const YES_NO = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

const floorBand = (f: number | null) => (f == null ? null : f >= 7 ? 7 : f >= 4 ? 4 : 1);

const STEPS: Step[] = [
  { kind: "intro" },
  {
    kind: "choice", area: "C", field: "workingAc", q: "Do you have working air conditioning at home?",
    opts: [
      { label: "Yes", value: "yes" },
      { label: "Yes, but it costs too much to run", value: "yes_but_cost_limits_use" },
      { label: "No", value: "no" },
    ],
  },
  {
    kind: "choice", area: "C", field: "homeGetsHot", q: "Does your home get very hot in summer?",
    opts: [
      { label: "Rarely", value: "rarely" },
      { label: "Sometimes", value: "sometimes" },
      { label: "Often", value: "often" },
    ],
  },
  { kind: "choice", area: "H", field: "stableHousing", q: "Do you have a stable place to live?", opts: YES_NO },
  {
    kind: "choice", area: "H", field: "floor", q: "What floor do you live on?",
    opts: [
      { label: "Ground to 3rd floor", value: 1 },
      { label: "4th to 6th floor", value: 4 },
      { label: "7th floor or higher", value: 7 },
    ],
    match: (v, o) => floorBand(v as number | null) === o.value,
  },
  {
    kind: "choice", area: "H", field: "hasElevator", q: "Does your building have an elevator?", opts: YES_NO,
    show: (a) => (a.floor ?? 0) >= 4,
  },
  { kind: "choice", area: "I", field: "livesAlone", q: "Do you live alone?", opts: YES_NO },
  {
    kind: "choice", area: "I", field: "someoneChecksOn", q: "Is there a neighbor, friend or family member who can check on you on hot days?",
    opts: YES_NO,
  },
  {
    kind: "choice", area: "I", field: "canReachCoolPlace", q: "Can you get to a cool place, like a library or cooling center?",
    opts: [
      { label: "Yes, on my own", value: "yes" },
      { label: "Only with help", value: "with_help" },
      { label: "No", value: "no" },
    ],
  },
  {
    kind: "choice", area: "L", field: "powerEquipment", q: "Do you use medical equipment that needs electricity?",
    hint: "For example oxygen, a CPAP machine or a power wheelchair. If heat causes a power outage, you need a plan.",
    opts: YES_NO,
  },
  { kind: "choice", area: "L", field: "fridgeMedicines", q: "Do you keep any medicines in the fridge?", hint: "For example insulin.", opts: YES_NO },
  {
    kind: "choice", area: "L2", field: "checksForecast", q: "Do you check the weather to know the hottest time of day?",
    hint: "We will send you the safest hours on hot days.",
    opts: YES_NO,
  },
  { kind: "choice", area: "L2", field: "knowsHeatIllnessSigns", q: "Do you know the signs of getting sick from heat?", opts: YES_NO },
  { kind: "meds" },
  {
    kind: "choice", area: "Out", field: "dayLocation", q: "Where do you spend most of a summer day?",
    opts: [
      { label: "At home", value: "home" },
      { label: "Indoors somewhere cool (work, school, a center)", value: "indoors_ac" },
      { label: "Outdoors, or doing physical work", value: "outdoors_or_physical_work" },
    ],
  },
  { kind: "choice", area: "Out", field: "outdoorWorkOrSports", q: "Do you work or play sports outdoors on hot days?", opts: YES_NO },
  { kind: "contact" },
  { kind: "result" },
];

const areaOf = (s: Step): AreaKey | null => (s.kind === "choice" ? s.area : s.kind === "meds" ? "D" : s.kind === "contact" ? "Contact" : null);

// How the existing questionnaire.csv columns feed each area (shown on the last screen).
const MAPPING: { area: string; cols: string }[] = [
  { area: "C · Cooling", cols: "q1_working_ac, home_gets_hot" },
  { area: "H · Housing", cols: "stable_housing, q3_floor, building_has_elevator" },
  { area: "I · Isolation & mobility", cols: "q4_lives_alone, someone_checks_on_them, q5_can_reach_cool_place" },
  { area: "L · eLectricity", cols: "power_dependent_equipment, fridge_medicines" },
  { area: "L · Learning", cols: "knows_heat_illness_signs (the forecast question is new: no column yet, not scored)" },
  { area: "D · Drugs", cols: "medications.csv (generic_name, status), not a yes/no question" },
  { area: "Out · Outside", cols: "q2_day_location, outdoor_work_or_sports" },
  { area: "Contact", cols: "contacts.csv; alert_opt_in" },
];

export function Intake({
  patientId,
  firstName,
  initial,
  meds: initialMeds,
  contact: initialContact,
  story,
  files,
}: {
  patientId: string;
  firstName: string;
  initial: IntakeAnswers;
  meds: IntakeMed[];
  contact: IntakeContact;
  story: { id: string; name: string }[];
  files: { questionnaire: string; meds: string; contacts: string };
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [a, setA] = useState<IntakeAnswers>(initial);
  const [meds, setMeds] = useState(initialMeds);
  const [contact, setContact] = useState(initialContact);
  const [result, setResult] = useState<IntakeResult | { error: string } | null>(null);
  const [pending, start] = useTransition();

  const visible = STEPS.filter((s) => s.kind !== "choice" || !s.show || s.show(a));
  const step = visible[Math.min(i, visible.length - 1)];
  const questionSteps: Step[] = visible.filter((s) => s.kind !== "intro" && s.kind !== "result");
  const qIndex = questionSteps.indexOf(step);
  const current = areaOf(step);

  const next = () => setI((x) => Math.min(x + 1, visible.length - 1));
  const back = () => setI((x) => Math.max(x - 1, 0));

  const finish = () => {
    start(async () => {
      const r = await scoreIntake(patientId, a, meds.filter((m) => m.taking).map((m) => m.id));
      setResult(r);
      next();
    });
  };

  const choose = (field: keyof IntakeAnswers, value: IntakeAnswers[keyof IntakeAnswers]) => {
    setA((prev) => ({ ...prev, [field]: value }));
    setTimeout(next, 180);
  };

  return (
    // Full-screen so the clinician header is hidden on the demo phone.
    <div className="fixed inset-0 z-50 overflow-auto bg-page text-patient-base leading-relaxed">
      <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 py-5">
        <p className="rounded-full border border-line bg-surface px-3 py-1 text-center text-sm text-ink-muted">
          Prototype · synthetic patient · answers are not saved
        </p>

        {step.kind !== "intro" && step.kind !== "result" && (
          <Progress current={current} n={qIndex + 1} total={questionSteps.length} />
        )}

        {step.kind === "intro" && (
          <section className="flex flex-1 flex-col gap-5">
            <h1 className="text-patient-2xl font-bold leading-tight">Hi {firstName}. Let&rsquo;s get you ready for hot days.</h1>
            <p>
              {questionSteps.length} short questions about your home, the people around you and your medicines. Tap an answer to go on.
            </p>
            <p className="text-base text-ink-muted">
              Based on CDC&rsquo;s CHILL&rsquo;D-Out heat questions. We filled in what your clinic already has; tap to change anything.
            </p>
            <BigButton onClick={next} primary>
              Start
            </BigButton>
            <label className="mt-auto block text-sm text-ink-muted">
              Try another synthetic patient{" "}
              <select
                className="ml-1 rounded-md border border-line bg-page px-2 py-1 text-sm text-ink"
                value={patientId}
                onChange={(e) => router.push(`/phone/signup?patient=${e.target.value}`)}
              >
                {story.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
        )}

        {step.kind === "choice" && (
          <section className="flex flex-1 flex-col gap-4">
            <h1 className="text-patient-xl font-bold leading-snug">{step.q}</h1>
            {step.hint && <p className="text-base text-ink-muted">{step.hint}</p>}
            <div className="flex flex-col gap-3">
              {step.opts.map((o) => {
                const v = a[step.field];
                const on = v != null && (step.match ? step.match(v, o) : v === o.value);
                return (
                  <BigButton key={String(o.value)} selected={on} onClick={() => choose(step.field, step.field === "floor" && on ? v : o.value)}>
                    {o.label}
                  </BigButton>
                );
              })}
            </div>
            {a[step.field] != null && a[step.field] === initial[step.field] && (
              <p className="text-sm text-ink-muted">Pre-filled from your clinic record (synthetic, {files.questionnaire}) where it had an answer.</p>
            )}
          </section>
        )}

        {step.kind === "meds" && (
          <section className="flex flex-1 flex-col gap-4">
            <h1 className="text-patient-xl font-bold leading-snug">Are these still your medicines?</h1>
            <p className="text-base text-ink-muted">From your clinic&rsquo;s medicine list (synthetic, {files.meds}). Tap one you no longer take.</p>
            {meds.length ? (
              <ul className="flex flex-col gap-3">
                {meds.map((m, k) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      aria-pressed={m.taking}
                      onClick={() => setMeds((xs) => xs.map((x, j) => (j === k ? { ...x, taking: !x.taking } : x)))}
                      className={`flex min-h-tap w-full items-start gap-3 rounded-2xl border-2 p-4 text-left ${
                        m.taking ? "border-ink bg-surface" : "border-line text-ink-muted"
                      }`}
                    >
                      <span aria-hidden className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${m.taking ? "border-ink bg-ink text-page" : "border-line-strong"}`}>
                        {m.taking ? "✓" : ""}
                      </span>
                      <span>
                        <span className={`block font-semibold capitalize ${m.taking ? "" : "line-through"}`}>{m.generic}</span>
                        <span className="block text-base text-ink-muted">{m.plainClass}</span>
                        {m.heatLine && m.taking && <span className="mt-1 block text-base">{m.heatLine}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No medicines on file.</p>
            )}
            <p className="font-semibold">Don&rsquo;t stop or change a medicine on your own. Talk to your doctor or pharmacist.</p>
            <BigButton primary onClick={next}>
              Next
            </BigButton>
          </section>
        )}

        {step.kind === "contact" && (
          <section className="flex flex-1 flex-col gap-4">
            <h1 className="text-patient-xl font-bold leading-snug">Who should we call if you don&rsquo;t answer on a hot day?</h1>
            <p className="text-base text-ink-muted">Pre-filled from {files.contacts} (synthetic). Not saved in this prototype.</p>
            <Field label="Name" value={contact.name} onChange={(v) => setContact({ ...contact, name: v })} />
            <Field label="How you know them" value={contact.relationship} onChange={(v) => setContact({ ...contact, relationship: v })} />
            <Field label="Phone" value={contact.phone} type="tel" onChange={(v) => setContact({ ...contact, phone: v })} />
            <p className="mt-2 font-semibold">Can we text you on hot days?</p>
            <div className="grid grid-cols-2 gap-3">
              {YES_NO.map((o) => (
                <BigButton key={String(o.value)} selected={a.alertOptIn === o.value} onClick={() => setA({ ...a, alertOptIn: o.value })}>
                  {o.value ? "Yes, text me" : "No, call me"}
                </BigButton>
              ))}
            </div>
            <BigButton primary onClick={finish} disabled={pending}>
              {pending ? "Working it out…" : "See my result"}
            </BigButton>
          </section>
        )}

        {step.kind === "result" && <Result result={result} patientId={patientId} restart={() => { setResult(null); setI(0); }} />}

        {step.kind !== "intro" && step.kind !== "result" && (
          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={back} className="min-h-tap px-2 text-base underline">
              ← Back
            </button>
            {step.kind === "choice" && a[step.field] != null && (
              <button type="button" onClick={next} className="min-h-tap px-2 text-base underline">
                Keep this answer →
              </button>
            )}
          </div>
        )}

        {step.kind === "result" && (
          <details className="rounded-2xl border border-line p-4 text-base">
            <summary className="cursor-pointer font-semibold">How these questions match our data</summary>
            <p className="mt-2 text-sm text-ink-muted">
              The 7 CHILL&rsquo;D-Out areas and the columns already in {files.questionnaire} that answer them:
            </p>
            <dl className="mt-2 space-y-1 text-sm">
              {MAPPING.map((m) => (
                <div key={m.area}>
                  <dt className="inline font-semibold">{m.area}: </dt>
                  <dd className="inline font-mono text-xs">{m.cols}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    </div>
  );
}

function Progress({ current, n, total }: { current: AreaKey | null; n: number; total: number }) {
  return (
    <div className="space-y-2" aria-label={`Question ${n} of ${total}`}>
      <div className="flex gap-1" aria-hidden>
        {AREAS.map((ar) => (
          <span
            key={ar.key}
            className={`flex-1 rounded-full py-0.5 text-center text-xs font-bold ${
              current === ar.key ? "bg-ink text-page" : "bg-surface text-ink-muted"
            }`}
          >
            {ar.key === "L2" ? "L" : ar.key}
          </span>
        ))}
      </div>
      <div className="flex items-baseline justify-between text-sm text-ink-muted">
        <span>{current === "Contact" ? "Your contact" : AREAS.find((x) => x.key === current)?.name}</span>
        <span>
          {n} of {total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(n / total) * 100}%` }} />
      </div>
    </div>
  );
}

function BigButton({
  children,
  onClick,
  selected,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={primary ? undefined : !!selected}
      className={`min-h-tap w-full rounded-2xl border-2 px-4 py-3 font-semibold transition-colors disabled:opacity-60 ${
        primary
          ? "border-ink bg-ink text-center text-page"
          : selected
            ? "border-ink bg-surface text-left"
            : "border-line text-left hover:border-line-strong"
      }`}
    >
      {selected && !primary && <span aria-hidden className="mr-2">✓</span>}
      {children}
    </button>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="block text-base font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 min-h-tap w-full rounded-xl border-2 border-line bg-page px-3 text-patient-base focus:border-ink focus:outline-none"
      />
    </label>
  );
}

function Result({ result, patientId, restart }: { result: IntakeResult | { error: string } | null; patientId: string; restart: () => void }) {
  if (!result) return null;
  if ("error" in result) return <p className="rounded-2xl border border-line p-4">{result.error}</p>;
  const r = RISK[result.group];
  return (
    <section className="flex flex-col gap-5">
      <div className={`rounded-2xl border-2 p-5 ${r.chip}`}>
        <p className="text-base font-semibold">Your heat risk group</p>
        <p className="mt-1 flex items-center gap-3">
          <span className={`rounded-full px-4 py-1 text-patient-xl font-bold ${r.solid}`}>{r.label}</span>
        </p>
        <p className="mt-3 text-ink">{result.why}</p>
      </div>
      {!result.sameAsRecord && result.recordGroup && (
        <p className="text-base text-ink-muted">
          Your clinic record (synthetic) had you in the {RISK[result.recordGroup].label} group. Your new answers changed that. The heat plan below still uses the clinic record, because this prototype does not save answers.
        </p>
      )}
      <p className="text-base">
        {result.group === "high"
          ? "On hot days we will text you a plan, check in with you, and call your contact if you don't answer."
          : result.group === "medium"
            ? "On hot days we will text you the nearest cool place and the safest hours to go out."
            : "On hot days we will send you a heads-up."}
      </p>
      <p className="font-bold">Talk to your doctor or pharmacist.</p>
      <Link href={`/phone/${patientId}`} className="min-h-tap flex items-center justify-center rounded-2xl border-2 border-ink bg-ink px-4 py-3 font-semibold text-page">
        See my heat plan
      </Link>
      <button type="button" onClick={restart} className="min-h-tap text-base underline">
        Start over
      </button>
      <p className="text-xs text-ink-muted">
        Group worked out with the same rules as the clinic&rsquo;s patient list (lib/patient: medicines + home → readiness level → Low / Medium / High). Prototype; not medical advice.
      </p>
    </section>
  );
}
