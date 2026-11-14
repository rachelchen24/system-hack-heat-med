"use client";
// Client view for the patient "where to go" map. Pass `data` (from getPatientPlanMapData, server side)
// or just `patientId` (it then fetches /api/map/plan?id=...).
import { useEffect, useMemo, useState } from "react";
import { LineLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { HELP_HEX, HELP_RGB } from "./colors";
import { boundsOf, clock, directionsUrl } from "./format";
import MapCanvas from "./MapCanvas";
import type { PatientPlanMapData } from "./patientPlanData";
import { PLAN_MAP_STRINGS, type PlanMapLang } from "./planMapStrings";
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

export function PatientPlanMapView({ data: initial, patientId, height = 320, lang = "en" }: { data?: PatientPlanMapData; patientId?: string; height?: number; lang?: PlanMapLang }) {
  const t = PLAN_MAP_STRINGS[lang];
  const [data, setData] = useState<PatientPlanMapData | null>(initial ?? null);
  const [err, setErr] = useState(false);
  const [threeD, setThreeD] = useState(false);

  useEffect(() => {
    if (initial || !patientId) return;
    let live = true;
    fetch(`/api/map/plan?id=${encodeURIComponent(patientId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: PatientPlanMapData) => { if (live) setData(d); })
      .catch(() => { if (live) setErr(true); });
    return () => { live = false; };
  }, [initial, patientId]);

  const layers = useMemo(() => {
    if (!data?.home) return [];
    const home = data.home, place = data.place, sub = data.subway;
    const labels: { pos: [number, number]; text: string; color: [number, number, number] }[] = [
      { pos: [home.lon, home.lat], text: t.home, color: INK },
    ];
    if (place) labels.push({ pos: [place.lon, place.lat], text: shortName(titleCase(place.name)), color: [0, 105, 76] });
    if (sub) labels.push({ pos: [sub.lon, sub.lat], text: t.subwayLabel(sub.name), color: INK });
    return [
      place && new LineLayer({
        id: "route", data: [{ from: [home.lon, home.lat], to: [place.lon, place.lat] }], parameters: { depthCompare: "always" as const, depthWriteEnabled: false },
        getSourcePosition: (d: { from: [number, number] }) => d.from, getTargetPosition: (d: { to: [number, number] }) => d.to,
        getColor: [20, 20, 20, 200], getWidth: 4, widthUnits: "pixels",
      }),
      sub && new ScatterplotLayer({
        id: "subway", data: [sub], billboard: true, parameters: { depthCompare: "always" as const, depthWriteEnabled: false }, getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getRadius: 7, radiusUnits: "pixels", getFillColor: [255, 255, 255], stroked: true, getLineColor: INK, lineWidthUnits: "pixels", getLineWidth: 3,
      }),
      place && new ScatterplotLayer({
        id: "place", data: [place], billboard: true, parameters: { depthCompare: "always" as const, depthWriteEnabled: false }, getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getRadius: 11, radiusUnits: "pixels", getFillColor: HELP_RGB, stroked: true, getLineColor: [255, 255, 255], lineWidthUnits: "pixels", getLineWidth: 3,
      }),
      new ScatterplotLayer({
        id: "home", data: [home], billboard: true, parameters: { depthCompare: "always" as const, depthWriteEnabled: false }, getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getRadius: 11, radiusUnits: "pixels", getFillColor: INK, stroked: true, getLineColor: [255, 255, 255], lineWidthUnits: "pixels", getLineWidth: 3,
      }),
      new TextLayer({
        id: "labels", data: labels, parameters: { depthCompare: "always" as const, depthWriteEnabled: false }, getPosition: (d) => d.pos, getText: (d) => d.text, getColor: (d) => d.color,
        getSize: 15, sizeUnits: "pixels", getPixelOffset: [0, -24], fontWeight: 700, fontFamily: "system-ui, sans-serif",
        background: true, getBackgroundColor: [255, 255, 255, 230], backgroundPadding: [4, 2],
        characterSet: "auto",
      }),
    ].filter(Boolean);
  }, [data, t]);

  const fit = useMemo(() => {
    if (!data?.home) return null;
    return boundsOf([data.home, ...(data.place ? [data.place] : []), ...(data.subway ? [data.subway] : [])]);
  }, [data]);

  if (err) return <p className="rounded-xl bg-[var(--ui-surface,#f7f7f5)] p-4 text-base">{t.loadError}</p>;
  if (!data) return <div style={{ height }} className="rounded-xl bg-[var(--ui-surface,#f7f7f5)] p-4 text-base">{t.loading}</div>;
  if (!data.home) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm">
        {t.noHome}
      </p>
    );
  }

  const place = data.place;
  const leave = clock(place?.leaveBy);
  const walk = place?.walkMin != null ? Math.round(place.walkMin) : null;

  return (
    <section className="space-y-4 text-[var(--ui-ink,#141414)]" aria-label={t.sectionLabel}>
      {t.note && <p className="text-xs italic text-[var(--ui-ink-muted,#4b5563)]">{t.note}</p>}
      {place ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ui-ink-muted,#4b5563)]">{t.nearest}</p>
          <p className="text-2xl font-bold leading-tight">{titleCase(cleanName(place.name))}</p>
          <p className="text-lg">{titleCase(place.address)}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {walk !== null && (
              <span className="rounded-full border-2 px-3 py-1 text-lg font-semibold" style={{ borderColor: HELP_HEX }}>
                🚶 {t.walk(walk)}
              </span>
            )}
            {leave && (
              <span className="rounded-full bg-[var(--ui-ink,#141414)] px-3 py-1 text-lg font-bold text-white">{t.leaveBy(leave)}</span>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-3 text-sm">{t.noPlace}</p>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-[var(--ui-line,#d4d4d0)]">
        <MapCanvas
          layers={layers}
          initialView={{ longitude: data.home.lon, latitude: data.home.lat, zoom: 15 }}
          fitBounds={fit}
          threeD={threeD}
          height={height}
          ariaLabel={t.mapAria}
        />
        <div className="absolute left-3 top-3 z-10"><ThreeDToggle on={threeD} onChange={setThreeD} large /></div>
      </div>

      <ul className="space-y-2 text-lg">
        {data.hottest && (
          <li>
            <strong>{t.hottestLabel}</strong> {t.hottest(data.hottest.startHour, data.hottest.endHour)}
          </li>
        )}
        {data.subway && (
          <li>
            <strong>{t.subwayTitle}</strong> {data.subway.name} ({data.subway.routes.split(/[\s,]+/).join(", ")}), {t.subwayAbout(data.subway.meters >= 1000 ? `${(data.subway.meters / 1000).toFixed(1)} km` : `${Math.round(data.subway.meters / 10) * 10} m`)}
          </li>
        )}
        {place?.phone && (
          <li><strong>{t.callAhead}</strong> <a className="underline" href={`tel:${place.phone}`}>{place.phone}</a>. {t.callAheadTail}</li>
        )}
        {place?.notes.some((n) => /older adults only/i.test(n)) && <li>{t.olderAdults}</li>}
        {place?.notes.some((n) => /activated heat days/i.test(n)) && <li>{t.coolingCenter}</li>}
      </ul>

      {place && (
        <a
          href={directionsUrl(data.home, place)}
          target="_blank"
          rel="noreferrer"
          className="block rounded-full px-5 py-3 text-center text-lg font-bold text-white"
          style={{ background: "#00694c" }}
        >
          {t.directions}
        </a>
      )}

      {data.delivery.show ? (
        <div className="rounded-2xl border-2 p-4" style={{ borderColor: "var(--risk-high, #d55e00)", background: "var(--risk-high-tint, #fbe3d6)" }}>
          <p className="text-xl font-bold">{t.deliveryTitle}</p>
          <ul className="mt-1 list-disc pl-5 text-lg">
            {data.delivery.reasons.map((r) => <li key={r}>{t.reason(r)}</li>)}
          </ul>
          <p className="mt-2 text-lg">{t.deliveryText}</p>
        </div>
      ) : (
        data.hottest && (
          <p className="text-lg">{t.ifCantLeave(leave, data.hottest.startHour, data.hottest.endHour)}</p>
        )
      )}
      <p className="text-xs text-[var(--ui-ink-muted,#4b5563)]">
        {t.footnote} {t.sources} {data.sources.join(", ")}.
      </p>
    </section>
  );
}
