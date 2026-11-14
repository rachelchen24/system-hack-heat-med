"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RISK, RISK_ORDER, type RiskGroup } from "@/lib/risk";

export interface BoardRow {
  id: string;
  name: string;
  age: number;
  zip: string;
  group: RiskGroup;
  why: string;
  callInstead: boolean;
  detail: {
    bullets: string[];
    meds: { name: string; kbId: string | null; kbName: string | null; line: string | null; sources: { label: string; url: string }[] }[];
    pathways: {
      label: string;
      drugs: string[];
      stacked: boolean;
      system: { mediator: string; heatStudies: number | null; drugLegs: { drug: string; systemGroup: string | null; studies: number | null }[] }[];
      note: string;
    }[];
    systemSource: string | null;
    caveat: string | null;
  };
}

type Alert = {
  id: number; patient_id: string; status: string; channel: string; steps_done: number; total_steps: number;
  elapsed_min: number; sent_at: string; next_step: { atMin: number; action: string; to: string } | null;
};
type Message = { id: number; patient_id: string | null; recipient: string; channel: string; body: string; note: string | null; created_at: string };
type State = { demo_time: string; alerts: Alert[]; messages: Message[] };

const POLL_MS = 2500;

const STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: "Waiting for reply", cls: "bg-adjust-tint text-adjust-ink" },
  sent_done: { label: "Text sent", cls: "bg-surface text-ink-muted" },
  acknowledged: { label: "Replied OK", cls: "bg-verify-double-bg text-verify-double-fg" },
  escalated_contact: { label: "Contact asked to check", cls: "bg-monitor-tint text-monitor-ink" },
  escalated_clinic: { label: "Call this patient", cls: "bg-hold-tint text-hold-ink" },
  resolved: { label: "Resolved", cls: "bg-surface text-ink-muted" },
};

const t = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

async function post(url: string, body: unknown) {
  await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function Board({ rows, source, questionnaireFile, asOf }: { rows: BoardRow[]; source: string; questionnaireFile: string; asOf: string }) {
  const [state, setState] = useState<State | null>(null);
  const [group, setGroup] = useState<RiskGroup>("high");
  const [open, setOpen] = useState<BoardRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const names = useMemo(() => new Map(rows.map((r) => [r.id, r.name])), [rows]);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/loop/board", { cache: "no-store" });
      setState(await r.json());
      setError(null);
    } catch {
      setError("Can't reach the server");
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, POLL_MS);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [refresh]);

  const latest = new Map<string, Alert>();
  for (const a of state?.alerts ?? []) if (!latest.has(a.patient_id)) latest.set(a.patient_id, a);

  const counts = Object.fromEntries(RISK_ORDER.map((g) => [g, rows.filter((r) => r.group === g).length])) as Record<RiskGroup, number>;
  const shown = rows.filter((r) => r.group === group);
  const texts = shown.filter((r) => !r.callInstead);
  const calls = shown.filter((r) => r.callInstead);

  const send = async (ids: string[], mode: "text" | "call" = "text") => {
    if (!ids.length) return;
    setBusy(true);
    await post("/api/loop/alerts", { patientIds: ids, scenario: "replay", mode });
    setBusy(false);
    refresh();
  };
  const ff = async (minutes: number) => { await post("/api/loop/clock", { minutes }); refresh(); };
  const reset = async () => { await post("/api/loop/clock", { reset: true }); refresh(); };

  const statusOf = (id: string) => {
    const a = latest.get(id);
    if (!a) return null;
    const key = a.status === "sent" && !a.next_step ? "sent_done" : a.status;
    return { ...(STATUS[key] ?? STATUS.sent), a };
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Who needs help today</h1>
          <p className="text-sm text-ink-muted">
            Heat wave day {asOf} · {rows.length} synthetic patients, grouped by their medicines and their home · texts are simulated
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-line-strong px-3 py-1 font-mono">Clock {state ? t(state.demo_time) : "—"}</span>
          {[5, 15, 45].map((m) => (
            <button key={m} onClick={() => ff(m)} className="rounded-full border border-line-strong px-3 py-1 hover:bg-surface">
              +{m} min
            </button>
          ))}
          <button onClick={reset} className="rounded-full border border-line-strong px-3 py-1 hover:bg-surface">Reset</button>
        </div>
      </header>
      {error && <p className="rounded bg-hold-tint px-3 py-2 text-hold-ink">{error}</p>}

      <div role="tablist" aria-label="Risk group" className="grid grid-cols-3 gap-2 sm:max-w-xl">
        {RISK_ORDER.map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={group === g}
            onClick={() => setGroup(g)}
            className={`rounded-2xl border-2 px-3 py-2 text-left transition ${
              group === g ? `${RISK[g].chip}` : "border-line bg-page text-ink hover:bg-surface"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden className={`inline-block h-3 w-3 rounded-full ${RISK[g].dot}`} />
              {RISK[g].label}
            </span>
            <span className="block text-2xl font-bold">{counts[g]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-label={`${RISK[group].label} risk patients`} className="space-y-3">
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${RISK[group].tint}`}>
            <div>
              <h2 className={`text-lg font-bold ${RISK[group].ink}`}>{RISK[group].label} risk: {RISK[group].action.toLowerCase()}</h2>
              <p className="text-sm text-ink">
                {group === "high" && "Text: heat warning, where to go and how to get there, then check-ins. No reply → their contact, then the clinic."}
                {group === "medium" && "Text: the nearest cool place and the safest hours to go."}
                {group === "low" && "Text: a short heat heads-up about their medicines."}
                {calls.length > 0 && ` ${calls.length} asked not to get texts: call them instead.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => send(texts.map((r) => r.id))}
                disabled={busy || !texts.length}
                className="rounded-full bg-ink px-4 py-2 font-semibold text-page disabled:opacity-40"
              >
                Text this group ({texts.length})
              </button>
              {calls.length > 0 && (
                <button
                  onClick={() => send(calls.map((r) => r.id), "call")}
                  disabled={busy}
                  className="rounded-full border-2 border-ink bg-page px-4 py-2 font-semibold disabled:opacity-40"
                >
                  Add {calls.length} to call list
                </button>
              )}
            </div>
          </div>

          <ul className="max-h-[70vh] divide-y divide-line overflow-auto rounded-2xl border border-line">
            {shown.map((r) => {
              const st = statusOf(r.id);
              return (
                <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-sm text-ink-muted">{r.age} · {r.zip}</span>
                      {r.callInstead && (
                        <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs font-semibold">Call instead</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm">{r.why}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {st ? (
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    ) : null}
                    <button onClick={() => setOpen(r)} className="rounded-full border border-line-strong px-3 py-1 text-sm hover:bg-surface">
                      Why?
                    </button>
                    <button
                      onClick={() => send([r.id], r.callInstead ? "call" : "text")}
                      className="rounded-full border border-line-strong px-3 py-1 text-sm hover:bg-surface"
                    >
                      {r.callInstead ? "Call" : "Text"}
                    </button>
                    <Link href={`/phone/${r.id}`} className="rounded-full px-2 py-1 text-sm underline">
                      Plan
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-ink-muted">
            Groups from <code>{source}</code>. &ldquo;Call instead&rdquo; = alert_opt_in false in <code>{questionnaireFile}</code>.
          </p>
        </section>

        <section aria-label="Messages" className="space-y-2">
          <h2 className="text-lg font-semibold">Messages <span className="text-xs font-normal text-ink-muted">(simulated)</span></h2>
          <ol className="max-h-[70vh] space-y-2 overflow-auto">
            {!state?.messages.length && <li className="text-sm text-ink-muted">Nothing sent yet. Pick a group and press &ldquo;Text this group.&rdquo;</li>}
            {state?.messages.map((m) => (
              <li key={m.id} className="rounded-2xl border border-line p-3 text-sm">
                <div className="flex justify-between gap-2 text-xs text-ink-muted">
                  <span>
                    <b className="text-ink">{(m.patient_id && names.get(m.patient_id)) ?? m.patient_id}</b> →{" "}
                    {m.recipient.startsWith("contact") ? "their contact" : m.recipient === "clinic" ? "clinic call list" : "patient"}
                  </span>
                  <span className="font-mono">{t(m.created_at)}</span>
                </div>
                <p className="mt-1 line-clamp-3">{m.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {open && <WhyPanel row={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function WhyPanel({ row, onClose }: { row: BoardRow; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const d = row.detail;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-label={`Why ${row.name} is ${RISK[row.group].label} risk`}
        className="h-full w-full max-w-md overflow-auto bg-page p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK[row.group].chip}`}>{RISK[row.group].label} risk</span>
            <h2 className="mt-2 text-2xl font-bold">{row.name}</h2>
            <p className="text-sm text-ink-muted">{row.age} · {row.zip} · synthetic patient</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-line-strong px-3 py-1 text-sm">Close</button>
        </div>

        <h3 className="mt-5 font-semibold">In plain words</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {d.bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>

        <h3 className="mt-5 font-semibold">Their medicines in heat</h3>
        <ul className="mt-1 space-y-2 text-sm">
          {d.meds.length === 0 && <li className="text-ink-muted">No heat-relevant medicines on file.</li>}
          {d.meds.map((m) => (
            <li key={m.name} className="rounded-xl bg-surface p-3">
              <div className="font-semibold capitalize">{m.name}</div>
              {m.line ? <p>{m.line}</p> : <p className="text-ink-muted">Not in data/kb/knowledge_base.json yet.</p>}
              {m.kbId && (
                <Link href={`/drug/${m.kbId}`} className="text-xs underline">
                  {m.kbName} evidence card
                </Link>
              )}
              {m.sources.length > 0 && (
                <ul className="mt-1 text-xs">
                  {m.sources.map((s) => (
                    <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.label}</a></li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {d.pathways.length > 0 && (
          <>
            <h3 className="mt-5 font-semibold">How it adds up (System graph)</h3>
            <ul className="mt-1 space-y-2 text-sm">
              {d.pathways.map((p) => (
                <li key={p.label} className="rounded-xl border border-line p-3">
                  <div className="font-semibold">{p.label}</div>
                  {p.system.map((s) => (
                    <p key={s.mediator} className="text-xs">
                      Heat → {s.mediator.toLowerCase()}: {s.heatStudies ?? "no"} studies.{" "}
                      {s.drugLegs.map((l) => `${l.drug} → ${s.mediator.toLowerCase()}: ${l.studies ?? "no"} studies`).join("; ")}.
                    </p>
                  ))}
                  <p className="mt-1 text-xs text-ink-muted">{p.note}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        {d.caveat && <p className="mt-4 text-xs text-ink-muted">{d.caveat}</p>}
        {d.systemSource && <p className="mt-1 text-xs text-ink-muted">Source: {d.systemSource}</p>}
      </aside>
    </div>
  );
}
