// Read-only access to Myra's precomputed panel scores (scripts/compute_panel.ts → lib/patient).
// Every value shown by the core loop comes from these files; nothing is invented here.
//   replay = 2025-06-24 heat wave (HeatRisk 4) — the demo day
//   today  = live NWS HeatRisk (all 0 in November, so no alerts)

import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@/lib/kb";

export type Scenario = "replay" | "today";

export interface EscalationStep { atMin: number; action: string; to: string }

export interface PanelMessage {
  kind: string;          // heat_card | safety_alert | cooling_place | checkin | contact_check
  language: string;
  audience: string;      // patient | caregiver | trusted_contact
  channel: string;
  text: string;
  needsTranslation?: boolean;
  rulesApplied?: string[];
  safetyIssues?: string[];
}

export interface PanelContact {
  contactId: string;
  name: string;
  relationship: string;
  travelMin: number | null;
  travelMode: string;
  allowedTravelMin: number;
  eligible: boolean;
}

export interface PanelPatient {
  patientId: string;
  synthetic: boolean;
  storyLabel?: string;
  displayName: string;
  age: number;
  zip: string;
  language: string;
  heatriskToday: number;
  rank?: number;
  tier?: { tier: string; reasons: string[]; autoSafetyAlert?: boolean; coolingText?: boolean };
  escalation?: {
    enrolled: boolean;
    tMaxMin: number;
    tWaitMin: number;
    contacts: PanelContact[];
    firstContactId: string | null;
    noQualifyingContact: boolean;
    fallback?: string;
    steps: EscalationStep[];
    assumptions?: string[];
  };
  cooling?: { best?: { name: string; address: string; leaveBy?: string; arriveBy?: string; travelMin?: number } | null };
  messages?: PanelMessage[];
}

export interface CallListRow {
  rank: number;
  patient_id: string;
  story?: string;
  age: number;
  zip: string;
  heatrisk_today: number;
  tier: string;
  tier_label: string;
  why: string[];
  readiness: string;
}

interface PanelFile {
  meta: { as_of: string; scenario: string; note?: string; forecast_source?: string };
  summary: unknown;
  call_list: CallListRow[];
  patients: PanelPatient[];
}

const cache = globalThis as unknown as { __panel?: Map<string, { mtime: number; data: PanelFile; byId: Map<string, PanelPatient> }> };

function file(s: Scenario) {
  return path.join(REPO_ROOT, "data", "processed", `panel_scores_${s}.json`);
}

/** Returns null when the file is missing (the UI then shows a placeholder). */
export function loadPanel(s: Scenario = "replay") {
  cache.__panel ??= new Map();
  const f = file(s);
  if (!fs.existsSync(f)) return null;
  const mtime = fs.statSync(f).mtimeMs;
  const hit = cache.__panel.get(s);
  if (hit && hit.mtime === mtime) return { ...hit, file: path.relative(REPO_ROOT, f) };
  const data = JSON.parse(fs.readFileSync(f, "utf8")) as PanelFile;
  const byId = new Map(data.patients.map((p) => [p.patientId, p]));
  const entry = { mtime, data, byId };
  cache.__panel.set(s, entry);
  return { ...entry, file: path.relative(REPO_ROOT, f) };
}

export function getPanelPatient(id: string, s: Scenario = "replay"): PanelPatient | null {
  return loadPanel(s)?.byId.get(id) ?? null;
}

/** The patient-facing message of a kind (caregiver version if that's who the patient app talks to). */
export function patientMessage(p: PanelPatient, kind: string): PanelMessage | null {
  const ms = p.messages ?? [];
  return ms.find((m) => m.kind === kind && m.audience === "patient")
    ?? ms.find((m) => m.kind === kind && m.audience === "caregiver")
    ?? null;
}

export function contactMessage(p: PanelPatient): PanelMessage | null {
  return (p.messages ?? []).find((m) => m.kind === "contact_check") ?? null;
}
