"use client";
// Client view for the patient "where to go" map. Pass `data` (from getPatientPlanMapData, server side)
// or just `patientId` (it then fetches /api/map/plan?id=...).
import { useEffect, useMemo, useState } from "react";
import { LineLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { HELP_HEX, HELP_RGB } from "./colors";
import { boundsOf, clock, directionsUrl, hourLabel } from "./format";
import MapCanvas from "./MapCanvas";
import type { PatientPlanMapData } from "./patientPlanData";
import { ThreeDToggle } from "./ThreeDToggle";

const INK: [number, number, number] = [20, 20, 20];

function cleanName(n: string) {
  return n.replace(/\s*-\s*OLDER ADULTS ONLY/i, "").replace(/\s*\(OAC\)/i, "").trim();
}
function shortName(n: string) {
  const s = cleanName(n);
  return s.length > 28 ? `${s.slice(0, 26)}…` : s;
}
function titleCase(s: string) {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

export function PatientPlanMapView({ data: initial, patientId, height = 320 }: { data?: PatientPlanMapData; patientId?: string; height?: number }) {
  const [data, setData] = useState<PatientPlanMapData | null>(initial ?? null);
  const [err, setErr] = useState<string | null>(null);
  const [threeD, setThreeD] = useState(false);

  useEffect(() => {
    if (initial || !patientId) return;
    let live = true;
    fetch(`/api/map/plan?id=${encodeURIComponent(patientId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: PatientPlanMapData) => { if (live) setData(d); })
      .catch(() => { if (live) setErr("Could not load the map."); });
    return () => { live = false; };
  }, [initial, patientId]);

  const layers = useMemo(() => {
    if (!data?.home) return [];
    const home = data.home, place = data.place, sub = data.subway;
    const labels: { pos: [number, number]; text: string; color: [number, number, number] }[] = [
      { pos: [home.lon, home.lat], text: "Home", color: INK },
    ];
    if (place) labels.push({ pos: [place.lon, place.lat], text: shortName(titleCase(place.name)), color: [0, 105, 76] });
    if (sub) labels.push({ pos: [sub.lon, sub.lat], text: `Subway: ${sub.name}`, color: INK });
    return [
      place && new LineLayer({
        id: "route", data: [{ from: [home.lon, home.lat], to: [place.lon, place.lat] }],
        getSourcePosition: (d: { from: [number, number] }) => d.from, getTargetPosition: (d: { to: [number, number] }) => d.to,
        getColor: [20, 20, 20, 200], getWidth: 4, widthUnits: "pixels",
      }),
      sub && new ScatterplotLayer({
        id: "subway", data: [sub], getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getRadius: 7, radiusUnits: "pixels", getFillColor: [255, 255, 255], stroked: true, getLineColor: INK, lineWidthUnits: "pixels", getLineWidth: 3,
      }),
      place && new ScatterplotLayer({
        id: "place", data: [place], getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getRadius: 11, radiusUnits: "pixels", getFillColor: HELP_RGB, stroked: true, getLineColor: [255, 255, 255], lineWidthUnits: "pixels", getLineWidth: 3,
      }),
      new ScatterplotLayer({
        id: "home", data: [home], getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getRadius: 11, radiusUnits: "pixels", getFillColor: INK, stroked: true, getLineColor: [255, 255, 255], lineWidthUnits: "pixels", getLineWidth: 3,
      }),
      new TextLayer({
        id: "labels", data: labels, getPosition: (d) => d.pos, getText: (d) => d.text, getColor: (d) => d.color,
        getSize: 15, sizeUnits: "pixels", getPixelOffset: [0, -24], fontWeight: 700, fontFamily: "system-ui, sans-serif",
        background: true, getBackgroundColor: [255, 255, 255, 230], backgroundPadding: [4, 2],
        characterSet: "auto",
      }),
    ].filter(Boolean);
  }, [data]);

  const fit = useMemo(() => {
    if (!data?.home) return null;
    return boundsOf([data.home, ...(data.place ? [data.place] : []), ...(data.subway ? [data.subway] : [])]);
  }, [data]);

  if (err) return <p className="rounded-xl bg-[var(--ui-surface,#f7f7f5)] p-4 text-base">{err}</p>;
  if (!data) return <div style={{ height }} className="rounded-xl bg-[var(--ui-surface,#f7f7f5)] p-4 text-base">Loading map…</div>;
  if (!data.home) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm">
        No home location for this patient. Data would come from data/processed/synthetic/patients.csv (home_lat, home_lon).
      </p>
    );
  }

  const place = data.place;
  const leave = clock(place?.leaveBy);
  const walk = place?.walkMin != null ? Math.round(place.walkMin) : null;

  return (
    <section className="space-y-4 text-[var(--ui-ink,#141414)]" aria-label="Where to go to cool off">
      {place ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ui-ink-muted,#4b5563)]">Nearest cool place</p>
          <p className="text-2xl font-bold leading-tight">{titleCase(cleanName(place.name))}</p>
          <p className="text-lg">{titleCase(place.address)}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {walk !== null && (
              <span className="rounded-full border-2 px-3 py-1 text-lg font-semibold" style={{ borderColor: HELP_HEX }}>
                🚶 About {walk} min walk
              </span>
            )}
            {leave && (
              <span className="rounded-full bg-[var(--ui-ink,#141414)] px-3 py-1 text-lg font-bold text-white">Leave by {leave}</span>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-3 text-sm">No cool place matched. Data would come from data/processed/synthetic/cooling_match.csv.</p>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-[var(--ui-line,#d4d4d0)]">
        <MapCanvas
          layers={layers}
          initialView={{ longitude: data.home.lon, latitude: data.home.lat, zoom: 15 }}
          fitBounds={fit}
          threeD={threeD}
          height={height}
          ariaLabel="Map from your home to the nearest cool place"
        />
        <div className="absolute left-3 top-3"><ThreeDToggle on={threeD} onChange={setThreeD} large /></div>
      </div>

      <ul className="space-y-2 text-lg">
        {data.hottest && (
          <li>
            <strong>Hottest hours today:</strong> {hourLabel(data.hottest.startHour)} to {hourLabel(data.hottest.endHour)}. Try to be inside somewhere cool by then.
          </li>
        )}
        {data.subway && (
          <li>
            <strong>Nearest subway:</strong> {data.subway.name} ({data.subway.routes.split(/[\s,]+/).join(", ")}), about {data.subway.meters >= 1000 ? `${(data.subway.meters / 1000).toFixed(1)} km` : `${Math.round(data.subway.meters / 10) * 10} m`} from home.
          </li>
        )}
        {place?.phone && (
          <li><strong>Call ahead:</strong> <a className="underline" href={`tel:${place.phone}`}>{place.phone}</a>. Hours and services can change.</li>
        )}
        {place?.notes.some((n) => /older adults only/i.test(n)) && <li>This place is for adults 60 and older.</li>}
        {place?.notes.some((n) => /activated heat days/i.test(n)) && <li>It opens as a cooling center only on official heat days. Check that it is open today.</li>}
      </ul>

      {place && (
        <a
          href={directionsUrl(data.home, place)}
          target="_blank"
          rel="noreferrer"
          className="block rounded-full px-5 py-3 text-center text-lg font-bold text-white"
          style={{ background: "#00694c" }}
        >
          Directions
        </a>
      )}

      {data.delivery.show ? (
        <div className="rounded-2xl border-2 p-4" style={{ borderColor: "var(--risk-high, #d55e00)", background: "var(--risk-high-tint, #fbe3d6)" }}>
          <p className="text-xl font-bold">Ask for a delivery instead</p>
          <ul className="mt-1 list-disc pl-5 text-lg">
            {data.delivery.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="mt-2 text-lg">Stay in your coolest room. Ask your pharmacy, a family member or a neighbor to bring what you need.</p>
        </div>
      ) : (
        data.hottest && (
          <p className="text-lg">
            If you can&apos;t leave by {leave ?? "then"}, stay in from {hourLabel(data.hottest.startHour)} to {hourLabel(data.hottest.endHour)} and ask for a delivery instead.
          </p>
        )
      )}
      <p className="text-xs text-[var(--ui-ink-muted,#4b5563)]">
        Synthetic patient. Line shows the trip, not the exact street route; walk time is from a routed walk at the patient&apos;s pace. Sources: {data.sources.join(", ")}.
      </p>
    </section>
  );
}
