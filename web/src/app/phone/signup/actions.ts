"use server";

// Scores the sign-up answers with the SAME rules the panel uses (lib/patient):
//   medRiskStack → personalExposure → readinessLevel (+ lifestyleSusceptibility),
// then maps readiness.level → Low / Medium / High with web/src/lib/risk.ts.
// The patient's record (conditions, ZIP, age) comes from data/processed/synthetic/patients_fhir.json;
// only the questionnaire answers and the medicine list are replaced by what was entered.

import fs from "node:fs";
import path from "node:path";
// Imported file by file (not via lib/patient/index.ts or load-node.ts) so the web type-check
// does not pull in lib/patient/stacking.ts, which has a strict-mode error outside this task.
import { parseCsv } from "@lib/patient/csv.ts";
import { overlayKnowledgeBase, provisionalIndex } from "@lib/patient/drug-profiles.ts";
import type { DrugProfileIndex } from "@lib/patient/drug-profiles.ts";
import { personalExposure, readinessLevel } from "@lib/patient/exposure.ts";
import type { NeighborhoodData } from "@lib/patient/exposure.ts";
import { patientsFromFhirBundle } from "@lib/patient/fhir.ts";
import { lifestyleSusceptibility } from "@lib/patient/lifestyle.ts";
import { medRiskStack } from "@lib/patient/med-risk.ts";
import type { HealthSystemConfig } from "@lib/types/health-system.ts";
import type { PatientRecord } from "@lib/types/patient.ts";
import type { QuestionnaireAnswers } from "@lib/types/patient.ts";
import type { IntakeAnswers, IntakeResult } from "@/components/intake/types";
import { REPO_ROOT } from "@/lib/kb";
import { getPanelPatient } from "@/lib/panel";
import { patientWhy, riskGroup } from "@/lib/risk";

// Second-person wording for readiness.drivers (lower-cased EXPOSURE_POINTS labels + age modifiers).
const YOU: Record<string, string> = {
  "no working ac at home": "You have no working AC at home.",
  "has ac but cost limits use": "Running your AC costs a lot.",
  "spends the day outdoors or doing physical work": "You spend the day outdoors or doing physical work.",
  "outdoor work or sports": "You work or play sports outdoors.",
  "home all day without reliable ac": "You are home all day without reliable AC.",
  "lives alone": "You live alone.",
  "lives alone and no one checks on them": "You live alone and no one checks on you.",
  "cannot get to a cool place": "You can't get to a cool place.",
  "can reach a cool place only with help": "You need help to get to a cool place.",
  "lives on floor 7 or higher": "You live on a high floor.",
  "floor 4+ with no elevator": "You live up several flights of stairs.",
  "home often gets hot": "Your home often gets hot.",
  "uses power-dependent equipment": "You use medical equipment that needs power.",
  "neighborhood heat vulnerability index 5 (highest)": "You live in one of the most heat-exposed neighborhoods.",
  "neighborhood heat vulnerability index 4": "You live in a heat-exposed neighborhood.",
  "age 75+": "You are 75 or older.",
  "child under 5": "Young children get sick from heat faster.",
};

type Ctx = { drugIndex: DrugProfileIndex; neighborhood: NeighborhoodData; patients: PatientRecord[] };

const g = globalThis as unknown as { __intakeCtx?: Ctx };
const read = (rel: string) => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(REPO_ROOT, rel));

// Same steps as lib/patient/load-node.ts (loadDrugIndex, loadNeighborhood, loadPatients).
function ctx(): Ctx {
  if (g.__intakeCtx) return g.__intakeCtx;
  const cfg = JSON.parse(read("config/health-systems/sbh.json")) as HealthSystemConfig;
  const ds = cfg.data_sources;

  let idx = provisionalIndex();
  const acbPath = ds.knowledge_base.find((p) => /anticholinergic/i.test(p));
  const acbRows = acbPath && exists(acbPath) ? parseCsv(read(acbPath)) : [];
  let matchedKb = false;
  for (const p of ds.knowledge_base.filter((x) => x.endsWith(".json"))) {
    if (!exists(p)) continue;
    try {
      const { index, matched } = overlayKnowledgeBase(idx, JSON.parse(read(p)), /mock/.test(p) ? "mock_knowledge_base" : "knowledge_base", acbRows);
      if (matched > 0) {
        idx = index;
        matchedKb = true;
        break;
      }
    } catch {
      /* keep provisional mapping, as load-node.ts does */
    }
  }
  if (!matchedKb && acbRows.length) idx = overlayKnowledgeBase(idx, [], "knowledge_base", acbRows).index;

  const hviByZip = new Map<string, number>();
  for (const r of parseCsv(read(ds.hvi_by_zip))) {
    const z = r.zcta20 ?? r.modzcta ?? r.zip;
    const v = Number(r.hvi);
    if (z && Number.isFinite(v)) hviByZip.set(z, v);
  }
  const ac = parseCsv(read(ds.ac_households));
  const pctNoAcByZip: NeighborhoodData["pctNoAcByZip"] = new Map();
  for (const [zip, area] of Object.entries(ds.zip_to_ac_area)) {
    const row = ac.find((r) => r.geotype === area.geotype && r.geoid === area.geoid && Number(r.year) === ds.ac_year && r.measure === "pct_households_with_ac");
    if (row) pctNoAcByZip.set(zip, { pct: +(100 - Number(row.value)).toFixed(1), area: `${area.name} (${area.geotype} ${ds.ac_year})`, approximate: area.approximate });
  }

  g.__intakeCtx = {
    drugIndex: idx,
    neighborhood: { hviByZip, pctNoAcByZip },
    patients: patientsFromFhirBundle(JSON.parse(read("data/processed/synthetic/patients_fhir.json"))),
  };
  return g.__intakeCtx;
}

export async function scoreIntake(patientId: string, a: IntakeAnswers, takingMedIds: string[]): Promise<IntakeResult | { error: string }> {
  const c = ctx();
  const rec = c.patients.find((p) => p.id === patientId);
  const panel = getPanelPatient(patientId, "replay");
  if (!rec || !panel) return { error: `Patient ${patientId} not found in patients_fhir.json / panel_scores_replay.json` };

  const base = rec.questionnaire ?? ({} as QuestionnaireAnswers);
  const q: QuestionnaireAnswers = {
    ...base,
    workingAc: a.workingAc,
    homeGetsHot: a.homeGetsHot,
    stableHousing: a.stableHousing,
    floor: a.floor,
    hasElevator: a.hasElevator,
    livesAlone: a.livesAlone,
    someoneChecksOn: a.someoneChecksOn,
    canReachCoolPlace: a.canReachCoolPlace,
    // Yes/no on the phone; keep the record's list when it already says yes.
    powerDependentEquipment: a.powerEquipment ? (base.powerDependentEquipment?.length ? base.powerDependentEquipment : ["reported at sign-up"]) : [],
    fridgeMedicines: a.fridgeMedicines ? (base.fridgeMedicines?.length ? base.fridgeMedicines : ["reported at sign-up"]) : [],
    knowsHeatIllnessSigns: a.knowsHeatIllnessSigns,
    dayLocation: a.dayLocation,
    outdoorWorkOrSports: a.outdoorWorkOrSports,
    alertOptIn: a.alertOptIn,
  };
  const keep = new Set(takingMedIds);
  const meds = rec.medications.filter((m) => keep.has(m.id));

  const med = medRiskStack(meds, c.drugIndex);
  const exp = personalExposure(q, rec.zip, c.neighborhood);
  // Age as shown in the panel file (computed by scripts/compute_panel.ts).
  const readiness = readinessLevel(med, exp, panel.age, rec.conditions.map((x) => x.key));
  const lifestyle = lifestyleSusceptibility(q);
  // Same "stacked" rule as lib/patient/stacking.ts (2+ medicines weaken the same body defense).
  const stacking = {
    mechanisms: med.defenses
      .filter((d) => d.defense !== "medicine_storage")
      .map((d) => ({ defense: d.defense, label: d.label, drugs: d.drugs, stacked: d.drugs.length >= 2 })),
  };

  const group = riskGroup(readiness.level);
  let why = patientWhy({ readiness, stacking, lifestyle });
  if (why === "Today is very hot.") {
    // No medicine or AC reason: say which home answers drove the group (readiness.drivers).
    const home = readiness.drivers.map((d) => YOU[d]).filter(Boolean).slice(0, 2);
    if (home.length) why = `${home.join(" ")} Today is very hot.`;
  }
  const recordGroup = panel.readiness ? riskGroup(panel.readiness.level) : null;
  return {
    group,
    why,
    sameAsRecord: recordGroup === group,
    recordGroup,
    method: "lib/patient: medRiskStack + personalExposure → readinessLevel (same rules as panel_scores_replay.json)",
  };
}
