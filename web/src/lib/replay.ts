// Data for the heat-day time-lapse (/replay). Server-only (reads files).
// Everything shown comes from these files; nothing is invented:
//   data/processed/replay_heatwave_hourly.csv   hourly temperature + heat index (LaGuardia, NOAA ISD)
//   data/processed/heatrisk_zip_replay.csv      NWS/WPC HeatRisk by ZIP and day
//   data/processed/hvi_modzcta.geojson          NYC Heat Vulnerability Index by ZIP area
//   data/processed/synthetic/patients.csv       synthetic patients' home locations
//   data/processed/panel_scores_replay.json     risk level, texts, check-in times, cooling-place trip (2025-06-24)
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@/lib/kb";
import { parseCsv } from "@lib/patient/csv.ts";

const P = (...p: string[]) => path.join(REPO_ROOT, "data", "processed", ...p);

export type RiskGroup = "High" | "Medium" | "Low";

export interface ReplayHour {
  t: number; // index
  date: string; // YYYY-MM-DD
  hour: number; // 0-23 local
  tempF: number | null;
  heatIndexF: number | null;
}

export interface ReplayPatient {
  id: string;
  name: string;
  group: RiskGroup;
  lon: number;
  lat: number;
  texted: boolean; // morning text (safety alert and/or cooling-place text) per tier flags
  checkins: number[]; // hours of day (local) with a check-in request
  trip: { lon: number; lat: number; leaveHour: number; arriveHour: number; place: string } | null;
}

export interface ReplayData {
  hours: ReplayHour[];
  eventDate: string; // the scored day (panel as_of)
  textHour: number; // hour the morning texts go out in this replay (a clinic setting, labeled on screen)
  heatriskByDate: Record<string, number>; // Bronx ZIP 10457, NWS HeatRisk 0-4
  heatriskZip: string;
  zips: GeoJSON.FeatureCollection;
  patients: ReplayPatient[];
  sources: string[];
}

const START = "2025-06-22";
const END = "2025-06-26"; // through 12:00
const TEXT_HOUR = 7;

function hm(s?: string): number | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
}

function round(geom: GeoJSON.Geometry): GeoJSON.Geometry {
  const r = (c: unknown): unknown =>
    Array.isArray(c) && typeof c[0] === "number" ? [Math.round(c[0] * 1e4) / 1e4, Math.round((c[1] as number) * 1e4) / 1e4] : (c as unknown[]).map(r);
  if (geom.type === "Polygon" || geom.type === "MultiPolygon") return { ...geom, coordinates: r(geom.coordinates) } as GeoJSON.Geometry;
  return geom;
}

export function loadReplay(): ReplayData | null {
  try {
    const hourly = parseCsv(fs.readFileSync(P("replay_heatwave_hourly.csv"), "utf8")).filter((r) => r.icao === "KLGA");
    const seen = new Set<string>();
    const hours: ReplayHour[] = [];
    for (const r of hourly) {
      const date = r.date_local;
      const hour = Number(r.hour_local);
      if (date < START || date > END || (date === END && hour > 12)) continue;
      const key = `${date} ${hour}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const num = (v: string) => (v === "" || v == null ? null : Number(v));
      hours.push({ t: 0, date, hour, tempF: num(r.temp_f), heatIndexF: num(r.heat_index_f) ?? num(r.temp_f) });
    }
    hours.sort((a, b) => (a.date + String(a.hour).padStart(2, "0")).localeCompare(b.date + String(b.hour).padStart(2, "0")));
    hours.forEach((h, i) => (h.t = i));

    const heatriskZip = "10457";
    const heatriskByDate: Record<string, number> = {};
    for (const r of parseCsv(fs.readFileSync(P("heatrisk_zip_replay.csv"), "utf8"))) {
      if (r.zip === heatriskZip) heatriskByDate[r.date] = Number(r.heatrisk_day1);
    }

    const zipsRaw = JSON.parse(fs.readFileSync(P("hvi_modzcta.geojson"), "utf8")) as GeoJSON.FeatureCollection;
    const zips: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: zipsRaw.features.map((f) => ({
        type: "Feature",
        geometry: round(f.geometry),
        properties: { zip: f.properties?.modzcta, hvi: Number(f.properties?.hvi) || null },
      })),
    };

    const homes = new Map<string, { lat: number; lon: number }>();
    for (const r of parseCsv(fs.readFileSync(P("synthetic", "patients.csv"), "utf8"))) {
      const lat = Number(r.home_lat), lon = Number(r.home_lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) homes.set(r.patient_id, { lat, lon });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const panel = JSON.parse(fs.readFileSync(P("panel_scores_replay.json"), "utf8")) as any;
    const groupOf = (lvl: string): RiskGroup => (lvl === "high" || lvl === "very_high" ? "High" : lvl === "medium" ? "Medium" : "Low");
    const patients: ReplayPatient[] = [];
    for (const p of panel.patients) {
      const home = homes.get(p.patientId);
      if (!home) continue;
      const best = p.cooling?.best;
      const leave = hm(best?.leaveBy), arrive = hm(best?.arriveBy);
      patients.push({
        id: p.patientId,
        name: p.displayName,
        group: groupOf(p.readiness?.level),
        lon: home.lon,
        lat: home.lat,
        texted: Boolean(p.tier?.autoSafetyAlert || p.tier?.coolingText),
        checkins: ((p.escalation?.checkinTimes as string[]) ?? []).map(hm).filter((x): x is number => x != null),
        trip:
          best && Number.isFinite(best.lat) && leave != null
            ? { lon: best.lon, lat: best.lat, leaveHour: leave, arriveHour: arrive ?? leave + (best.travelMin ?? 15) / 60, place: best.name }
            : null,
      });
    }

    return {
      hours,
      eventDate: panel.meta?.as_of ?? "2025-06-24",
      textHour: TEXT_HOUR,
      heatriskByDate,
      heatriskZip,
      zips,
      patients,
      sources: [
        "data/processed/replay_heatwave_hourly.csv (NOAA, LaGuardia)",
        "data/processed/heatrisk_zip_replay.csv (NWS/WPC HeatRisk archive)",
        "data/processed/hvi_modzcta.geojson (NYC Heat Vulnerability Index)",
        "data/processed/synthetic/patients.csv + panel_scores_replay.json (synthetic patients)",
      ],
    };
  } catch {
    return null;
  }
}
