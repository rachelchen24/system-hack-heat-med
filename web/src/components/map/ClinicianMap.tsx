"use client";
// Clinician heat + help map (/map): neighborhoods shaded by heat, help places, synthetic patients
// colored by risk group. Click a dot, a place or a neighborhood for a card.
import { useEffect, useMemo, useState } from "react";
import { GeoJsonLayer, IconLayer, ScatterplotLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import { HEAT_HEX, HEAT_RGB, RISK_CSS, RISK_GROUPS, RISK_RGB, type RiskGroup } from "./colors";
import type { HeatArea, HelpPlace, HelpPoint, MapPatient } from "./data";
import { boundsOf, directionsUrl } from "./format";
import { DEFAULT_HELP_TYPES, HELP_TYPES, helpIconUrl } from "./helpTypes";
import MapCanvas from "./MapCanvas";
import { ThreeDToggle } from "./ThreeDToggle";

type Selection =
  | { kind: "patient"; id: string }
  | { kind: "place"; id: string }
  | { kind: "area"; nta: string }
  | null;

interface Layers {
  heat: { type: "FeatureCollection"; features: HeatArea[] } | null;
  help: HelpPoint[] | null;
  files: { heat: string; help: string };
}

const HEAT_WORDS = ["Among the coolest neighborhoods", "Cooler than most", "In the middle", "Hotter than most", "Among the hottest neighborhoods"];

function GroupChip({ g, children }: { g: RiskGroup; children?: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold"
      style={{ background: RISK_CSS[g].tint, color: RISK_CSS[g].ink, borderColor: RISK_CSS[g].ink }}
    >
      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: RISK_CSS[g].solid, outline: g === "Medium" ? `1px solid ${RISK_CSS.Medium.ink}` : undefined }} />
      {children ?? g}
    </span>
  );
}

type SendState = { status: "idle" } | { status: "sending" } | { status: "done"; texted: number; calls: number } | { status: "error"; msg: string };

async function send(ps: MapPatient[]): Promise<{ texted: number; calls: number }> {
  const text = ps.filter((p) => p.textOk).map((p) => p.id);
  const call = ps.filter((p) => !p.textOk).map((p) => p.id);
  const post = async (ids: string[], mode: "text" | "call") => {
    if (!ids.length) return 0;
    const r = await fetch("/api/loop/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ patientIds: ids, mode }) });
    if (!r.ok) throw new Error(`send failed (${r.status})`);
    const j = (await r.json()) as { results?: { ok: boolean }[] };
    return (j.results ?? []).filter((x) => x.ok).length;
  };
  return { texted: await post(text, "text"), calls: await post(call, "call") };
}

function SendButton({ patients, label }: { patients: MapPatient[]; label: string }) {
  const [st, setSt] = useState<SendState>({ status: "idle" });
  const allCall = patients.every((p) => !p.textOk);
  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={st.status === "sending" || !patients.length}
        onClick={async () => {
          setSt({ status: "sending" });
          try { setSt({ status: "done", ...(await send(patients)) }); } catch (e) { setSt({ status: "error", msg: (e as Error).message }); }
        }}
        className="w-full rounded-full bg-[var(--ui-ink,#141414)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {st.status === "sending" ? "Sending…" : allCall && patients.length === 1 ? "Call instead (add to call list)" : label}
      </button>
      {st.status === "done" && (
        <p className="text-sm text-[var(--ui-ink-muted,#4b5563)]" role="status">
          {st.texted > 0 && `Text sent to ${st.texted}. `}
          {st.calls > 0 && `${st.calls} asked not to get texts: added to the call list. `}
          <a className="underline" href="/board">See replies on Patients</a>
        </p>
      )}
      {st.status === "error" && <p className="text-sm text-[var(--risk-high-ink,#a0410a)]">{st.msg}</p>}
    </div>
  );
}

function Card({ title, onClose, children }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--ui-line,#d4d4d0)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="text-lg font-bold leading-snug">{title}</div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full px-2 text-xl leading-none text-[var(--ui-ink-muted,#4b5563)]">×</button>
      </div>
      {children}
    </div>
  );
}

function PatientCard({ p, onClose }: { p: MapPatient; onClose: () => void }) {
  const [why, setWhy] = useState(false);
  return (
    <Card title={<>{p.name} <span className="text-sm font-normal text-[var(--ui-ink-muted,#4b5563)]">(synthetic)</span></>} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <GroupChip g={p.group}>{p.group} risk</GroupChip>
        <span>Age {p.age}</span>
        <span>· ZIP {p.zip}</span>
      </div>
      <p className="text-base">{p.why}</p>
      {!p.textOk && <p className="text-sm text-[var(--ui-ink-muted,#4b5563)]">Asked not to get texts: call instead.</p>}
      <div className="grid grid-cols-2 gap-2">
        <SendButton patients={[p]} label="Text" />
        <button type="button" aria-expanded={why} onClick={() => setWhy((v) => !v)} className="h-fit rounded-full border border-[var(--ui-line-strong,#6b6b66)] px-4 py-2 text-sm font-semibold">
          Why?
        </button>
      </div>
      {why && (
        <div className="space-y-2 rounded-xl bg-[var(--ui-surface,#f7f7f5)] p-3 text-sm">
          <p className="font-semibold">Everything that adds to their heat risk:</p>
          <ul className="list-disc space-y-0.5 pl-5">{p.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          <p className="text-[var(--ui-ink-muted,#4b5563)]">
            From data/processed/panel_scores_replay.json (readiness drivers). Medicines and sources: <a className="underline" href="/board">Patients</a>. Their plan: <a className="underline" href={`/phone/${p.id}`}>Patient app</a>.
          </p>
        </div>
      )}
    </Card>
  );
}

function PlaceCard({ id, onClose }: { id: string; onClose: () => void }) {
  const [place, setPlace] = useState<HelpPlace | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(`/api/map/place?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d: HelpPlace) => { if (live) { setPlace(d); setErr(false); } })
      .catch(() => { if (live) setErr(true); });
    return () => { live = false; };
  }, [id]);
  if (err) return <Card title="Place" onClose={onClose}><p className="text-sm">Could not load this place.</p></Card>;
  if (!place || place.id !== id) return <Card title="Loading…" onClose={onClose}><span /></Card>;
  const rows: [string, React.ReactNode][] = [];
  const addr = [place.address, place.borough, place.zip].filter(Boolean).join(", ");
  if (addr) rows.push(["Address", addr]);
  if (place.hours) rows.push(["Hours", place.hours]);
  if (place.phone) rows.push(["Phone", <a key="ph" className="underline" href={`tel:${place.phone}`}>{place.phone}</a>]);
  if (place.website) rows.push(["Website", <a key="w" className="break-all underline" href={place.website} target="_blank" rel="noreferrer">{place.website.replace(/^https?:\/\//, "")}</a>]);
  if (place.services) rows.push(["Services", place.services]);
  if (place.languages) rows.push(["Languages", place.languages]);
  return (
    <Card title={place.name} onClose={onClose}>
      <p className="flex items-center gap-2 text-sm font-semibold text-[#00694c]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={helpIconUrl(place.type)} alt="" width={20} height={20} /> {place.type}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents"><dt className="font-semibold">{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <p className="text-sm text-[var(--ui-ink-muted,#4b5563)]">Hours and services can change. Call ahead.</p>
      <a href={directionsUrl(null, place)} target="_blank" rel="noreferrer" className="block rounded-full bg-[#00694c] px-4 py-2 text-center text-sm font-semibold text-white">
        Directions
      </a>
      {place.source && <p className="text-xs text-[var(--ui-ink-muted,#4b5563)]">Source: {place.source}{place.accessed ? `, accessed ${place.accessed}` : ""}.</p>}
    </Card>
  );
}

function AreaCard({ area, patients, onPick, onClose }: { area: HeatArea; patients: MapPatient[]; onPick: (id: string) => void; onClose: () => void }) {
  const by = (g: RiskGroup) => patients.filter((p) => p.group === g);
  return (
    <Card title={<>{area.properties.name}<span className="block text-sm font-normal text-[var(--ui-ink-muted,#4b5563)]">{area.properties.borough} · {HEAT_WORDS[area.properties.hvi - 1] ?? ""} for heat</span></>} onClose={onClose}>
      {patients.length === 0 ? (
        <p className="text-sm">No synthetic patients live here.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">{patients.length} synthetic patient{patients.length === 1 ? "" : "s"} live here.</p>
          {RISK_GROUPS.map((g) => {
            const ps = by(g);
            if (!ps.length) return null;
            return (
              <div key={g} className="space-y-2 rounded-xl border p-3" style={{ borderColor: RISK_CSS[g].tint, background: "white" }}>
                <div className="flex items-center justify-between"><GroupChip g={g}>{g} · {ps.length}</GroupChip></div>
                <ul className="max-h-32 space-y-0.5 overflow-auto text-sm">
                  {ps.map((p) => (
                    <li key={p.id}><button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => onPick(p.id)}>{p.name}, {p.age}</button></li>
                  ))}
                </ul>
                <SendButton patients={ps} label={`Text this group (${ps.length})`} />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function ClinicianMap({ patients, files }: { patients: MapPatient[]; files: { panel: string; patients: string } }) {
  const [layers, setLayers] = useState<Layers | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [groups, setGroups] = useState<Set<RiskGroup>>(new Set(RISK_GROUPS));
  const [showHeat, setShowHeat] = useState(true);
  const [showHelp, setShowHelp] = useState(true);
  const [helpTypes, setHelpTypes] = useState<Set<string>>(new Set(DEFAULT_HELP_TYPES));
  const [threeD, setThreeD] = useState(false);
  const [sel, setSel] = useState<Selection>(null);
  const [zoom, setZoom] = useState(11);

  useEffect(() => {
    fetch("/api/map/layers").then((r) => r.json()).then(setLayers).catch(() => setLoadErr(true));
  }, []);

  const counts = useMemo(() => Object.fromEntries(RISK_GROUPS.map((g) => [g, patients.filter((p) => p.group === g).length])) as Record<RiskGroup, number>, [patients]);
  const visiblePatients = useMemo(() => patients.filter((p) => groups.has(p.group)), [patients, groups]);
  const helpVisible = useMemo(() => (layers?.help ?? []).filter((h) => helpTypes.has(h.type)), [layers, helpTypes]);
  const fit = useMemo(() => boundsOf(patients), [patients]);
  const selArea = sel?.kind === "area" ? layers?.heat?.features.find((f) => f.properties.nta === sel.nta) ?? null : null;
  const selPatient = sel?.kind === "patient" ? patients.find((p) => p.id === sel.id) ?? null : null;

  const deckLayers = useMemo(() => {
    const out = [];
    if (layers?.heat && showHeat) {
      out.push(new GeoJsonLayer<HeatArea["properties"]>({
        id: "heat", data: layers.heat as never, pickable: true, stroked: true, filled: true,
        getFillColor: (f) => [...HEAT_RGB[Math.min(4, Math.max(0, f.properties.hvi - 1))], 150] as [number, number, number, number],
        getLineColor: [255, 255, 255, 200], lineWidthUnits: "pixels", getLineWidth: 0.6,
        onClick: (info: PickingInfo) => { const f = info.object as HeatArea | undefined; if (f) setSel({ kind: "area", nta: f.properties.nta }); },
      }));
    }
    if (selArea) {
      out.push(new GeoJsonLayer({
        id: "heat-selected", data: { type: "FeatureCollection", features: [selArea] } as never, filled: false, stroked: true,
        getLineColor: [20, 20, 20, 255], lineWidthUnits: "pixels", getLineWidth: 3,
      }));
    }
    if (layers?.help && showHelp) {
      const big = zoom >= 13;
      out.push(new IconLayer<HelpPoint>({
        id: "help", data: helpVisible, pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => ({ url: helpIconUrl(d.type), id: d.type, width: 32, height: 32 }),
        getSize: big ? 24 : zoom >= 12 ? 14 : 9, sizeUnits: "pixels",
        updateTriggers: { getSize: [big, zoom >= 12] },
        onClick: (info: PickingInfo) => { const d = info.object as HelpPoint | undefined; if (d) setSel({ kind: "place", id: d.id }); },
      }));
    }
    out.push(new ScatterplotLayer<MapPatient>({
      id: "patients", data: visiblePatients, pickable: true,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => (selPatient?.id === d.id ? 10 : 6), radiusUnits: "pixels",
      getFillColor: (d) => RISK_RGB[d.group].solid,
      stroked: true, lineWidthUnits: "pixels",
      getLineColor: (d) => (selPatient?.id === d.id ? [20, 20, 20] : d.group === "Medium" ? RISK_RGB.Medium.ink : [255, 255, 255]),
      getLineWidth: (d) => (selPatient?.id === d.id ? 3 : d.group === "Medium" ? 1.2 : 1.5),
      updateTriggers: { getRadius: selPatient?.id, getLineColor: selPatient?.id, getLineWidth: selPatient?.id },
      onClick: (info: PickingInfo) => { const d = info.object as MapPatient | undefined; if (d) setSel({ kind: "patient", id: d.id }); },
    }));
    return out;
  }, [layers, showHeat, showHelp, helpVisible, visiblePatients, selArea, selPatient, zoom]);

  const getTooltip = ({ object, layer }: PickingInfo) => {
    if (!object || !layer) return null;
    if (layer.id === "patients") { const p = object as MapPatient; return { text: `${p.name} (${p.group})` }; }
    if (layer.id === "help") { const h = object as HelpPoint; return { text: `${h.name}\n${h.type}` }; }
    if (layer.id === "heat") { const f = object as HeatArea; return { text: `${f.properties.name}\nClick to see patients here` }; }
    return null;
  };

  const toggle = <T,>(set: Set<T>, v: T) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); return n; };
  const areaPatients = selArea ? patients.filter((p) => p.nta === selArea.properties.nta && groups.has(p.group)) : [];

  const panel = (
    <div className="space-y-5">
      {sel?.kind === "patient" && selPatient && <PatientCard key={selPatient.id} p={selPatient} onClose={() => setSel(null)} />}
      {sel?.kind === "place" && <PlaceCard id={sel.id} onClose={() => setSel(null)} />}
      {selArea && <AreaCard area={selArea} patients={areaPatients} onPick={(id) => setSel({ kind: "patient", id })} onClose={() => setSel(null)} />}
      {!sel && (
        <p className="rounded-2xl bg-[var(--ui-surface,#f7f7f5)] p-4 text-sm">
          Click a dot to see a patient. Click a neighborhood to see everyone who lives there and text a group.
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold">Synthetic patients, by heat risk</legend>
        <div className="flex flex-wrap gap-2">
          {RISK_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={groups.has(g)}
              onClick={() => setGroups((s) => toggle(s, g))}
              className="rounded-full border px-3 py-1 text-sm font-semibold transition-opacity"
              style={{ background: groups.has(g) ? RISK_CSS[g].tint : "white", color: RISK_CSS[g].ink, borderColor: RISK_CSS[g].ink, opacity: groups.has(g) ? 1 : 0.55 }}
            >
              <span aria-hidden className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: RISK_CSS[g].solid, outline: g === "Medium" ? `1px solid ${RISK_CSS.Medium.ink}` : undefined }} />
              {g} {counts[g]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} /> Neighborhood heat
        </label>
        <div className="flex items-center gap-2 text-xs text-[var(--ui-ink-muted,#4b5563)]">
          <span>Cooler</span>
          <span className="h-3 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${HEAT_HEX.join(",")})` }} />
          <span>Hotter</span>
        </div>
      </div>

      <fieldset className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={showHelp} onChange={(e) => setShowHelp(e.target.checked)} /> Places that help in a heat wave
        </label>
        <div className="grid gap-1 pl-1 text-sm">
          {HELP_TYPES.map((t) => (
            <label key={t.type} className="flex items-center gap-2">
              <input type="checkbox" disabled={!showHelp} checked={helpTypes.has(t.type)} onChange={() => setHelpTypes((s) => toggle(s, t.type))} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={helpIconUrl(t.type)} alt="" width={18} height={18} />
              <span>{t.label}</span>
              {t.type === "Outdoor spray shower / pool" && <span className="text-xs text-[var(--ui-ink-muted,#4b5563)]">(outdoors)</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="text-xs text-[var(--ui-ink-muted,#4b5563)]">
        Patients are synthetic (no real people): {files.panel}, {files.patients}. Heat: {layers?.files.heat ?? "data/processed/hvi_nta2020.geojson"} (NYC heat vulnerability index). Places: {layers?.files.help ?? "data/processed/community_resources_nyc.geojson"}. Basemap © OpenFreeMap, OpenMapTiles, OpenStreetMap contributors.
      </p>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--ui-line,#d4d4d0)]">
        <MapCanvas
          layers={deckLayers}
          initialView={{ longitude: -73.89, latitude: 40.85, zoom: 11.5 }}
          fitBounds={fit}
          threeD={threeD}
          getTooltip={getTooltip}
          onZoom={setZoom}
          height="min(72vh, 760px)"
          ariaLabel="Map of synthetic patients, neighborhood heat and help places"
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <ThreeDToggle on={threeD} onChange={setThreeD} />
          {!layers && !loadErr && <span className="rounded-full bg-white px-3 py-1 text-xs shadow-sm">Loading heat and places…</span>}
          {loadErr && <span className="rounded-full bg-white px-3 py-1 text-xs shadow-sm">Could not load heat and places.</span>}
        </div>
      </div>
      <aside aria-label="Map details and filters">{panel}</aside>
    </div>
  );
}
