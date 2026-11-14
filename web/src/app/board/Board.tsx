"use client";

import { useCallback, useEffect, useState } from "react";
import type { CallListRow } from "@/lib/panel";

type Alert = {
  id: number; patient_id: string; status: string; steps_done: number; total_steps: number;
  elapsed_min: number; sent_at: string; next_step: { atMin: number; action: string; to: string } | null;
};
type Message = { id: number; patient_id: string | null; recipient: string; channel: string; body: string; note: string | null; created_at: string };
type State = { demo_time: string; alerts: Alert[]; messages: Message[] };

const POLL_MS = 2500;

const STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: "Waiting for reply", cls: "bg-adjust-tint text-adjust-ink" },
  acknowledged: { label: "Replied OK", cls: "bg-verify-double-bg text-verify-double-fg" },
  escalated_contact: { label: "Contact asked to check", cls: "bg-monitor-tint text-monitor-ink" },
  escalated_clinic: { label: "On clinic call list", cls: "bg-hold-tint text-hold-ink" },
  resolved: { label: "Resolved", cls: "bg-surface text-ink-muted" },
};

const t = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

async function post(url: string, body: unknown) {
  await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function Board({ rows, source, asOf }: { rows: CallListRow[]; source: string; asOf: string }) {
  const [state, setState] = useState<State | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

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
    // Initial load + 2.5 s polling (spec §4.8); setState runs after the fetch resolves.
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, POLL_MS);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [refresh]);

  const latestByPatient = new Map<string, Alert>();
  for (const a of state?.alerts ?? []) if (!latestByPatient.has(a.patient_id)) latestByPatient.set(a.patient_id, a);

  const send = async (ids: string[]) => {
    if (!ids.length) return;
    await post("/api/loop/alerts", { patientIds: ids, scenario: "replay" });
    setPicked(new Set());
    refresh();
  };
  const ff = async (minutes: number) => { await post("/api/loop/clock", { minutes }); refresh(); };
  const reset = async () => { await post("/api/loop/clock", { reset: true }); refresh(); };

  const toggle = (id: string) =>
    setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clinic board</h1>
          <p className="text-sm text-ink-muted">
            Replayed heat day {asOf} · call list from <code>{source}</code> · synthetic patients · push and SMS are simulated
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded border border-line-strong px-2 py-1 font-mono">
            Demo time {state ? t(state.demo_time) : "—"}
          </span>
          {[5, 15, 45].map((m) => (
            <button key={m} onClick={() => ff(m)} className="rounded border border-line-strong px-2.5 py-1 hover:bg-surface">
              +{m} min
            </button>
          ))}
          <button onClick={reset} className="rounded border border-line-strong px-2.5 py-1 hover:bg-surface">Reset demo</button>
        </div>
      </header>
      {error && <p className="rounded bg-hold-tint px-3 py-2 text-hold-ink">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-label="Call list" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Call list ({rows.length})</h2>
            <button
              onClick={() => send([...picked])}
              disabled={!picked.size}
              className="rounded bg-ink px-3 py-1.5 text-sm font-semibold text-page disabled:opacity-40"
            >
              Send safety alert to {picked.size || "selected"}
            </button>
          </div>
          <div className="max-h-[70vh] overflow-auto rounded-tile border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-left">
                <tr>
                  <th className="p-2"><span className="sr-only">Select</span></th>
                  <th className="p-2">#</th>
                  <th className="p-2">Patient</th>
                  <th className="p-2">Why</th>
                  <th className="p-2">Status</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const a = latestByPatient.get(r.patient_id);
                  const st = a ? STATUS[a.status] : null;
                  return (
                    <tr key={r.patient_id} className="border-t border-line align-top">
                      <td className="p-2">
                        <input type="checkbox" aria-label={`Select ${r.patient_id}`} checked={picked.has(r.patient_id)} onChange={() => toggle(r.patient_id)} />
                      </td>
                      <td className="p-2 text-ink-muted">{r.rank}</td>
                      <td className="p-2">
                        <div className="font-semibold">{r.patient_id} · {r.age} · {r.zip}</div>
                        {r.story && <div className="text-xs text-ink-muted">{r.story}</div>}
                      </td>
                      <td className="p-2 text-xs">{r.why.slice(0, 3).join(" · ")}{r.why.length > 3 && ` · +${r.why.length - 3}`}</td>
                      <td className="p-2">
                        {st ? (
                          <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                        {a?.next_step && (
                          <div className="mt-1 text-xs text-ink-muted">next at {a.next_step.atMin} min (now {Math.floor(a.elapsed_min)})</div>
                        )}
                      </td>
                      <td className="p-2">
                        <button onClick={() => send([r.patient_id])} className="whitespace-nowrap rounded border border-line-strong px-2 py-1 text-xs hover:bg-surface">
                          Send
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-label="Message log" className="space-y-2">
          <h2 className="text-lg font-semibold">Message log <span className="text-xs font-normal text-ink-muted">(simulated push / SMS)</span></h2>
          <ol className="max-h-[70vh] space-y-2 overflow-auto">
            {!state?.messages.length && <li className="text-sm text-ink-muted">No messages yet. Send an alert from the call list.</li>}
            {state?.messages.map((m) => (
              <li key={m.id} className="rounded-tile border border-line p-2 text-sm">
                <div className="flex justify-between gap-2 text-xs text-ink-muted">
                  <span><b className="text-ink">{m.patient_id}</b> → {m.recipient} · {m.channel}</span>
                  <span className="font-mono">{t(m.created_at)}</span>
                </div>
                {m.note && m.note !== m.body && <div className="mt-1 text-xs italic text-ink-muted">{m.note}</div>}
                <p className="mt-1 line-clamp-3">{m.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
