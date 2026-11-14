# Build plan: The Missing Label

**Written 14 Nov 2026.** Covers everything in `spec.md` (the source of truth).
**Deadline:** Devpost submission **3:00 PM Saturday**. Pitches 3–4 PM.

The steps are in dependency order: each one needs the steps above it. Rachel and Myra divide the work.

**Parallel work:** once Step 1 fixes the knowledge-base format, Steps 5–7 can start on **mock data** while Steps 2–4 fill in the real data. Swap the real data in when it's ready.

---

## Step 1. Foundations: decisions, keys, data format (first, ~45 min)
Everything else depends on this.
- **Pick the tech stack:**
  - site framework
  - charting library
  - node-graph library (e.g. force-directed)
  - 3D map library
  - backend for SMS and push
- **Get keys and accounts:**
  - System API (have)
  - openFDA (free key)
  - OpenRouteService (routing)
  - an SMS provider (e.g. Twilio)
  - push notifications
  - map tiles if needed
  - Store them all in `.env`.
- **Define the knowledge-base format:** one row per drug. Fields: buckets, 3-step meter + 8-step tier, FLAG/CHANGE, Compass arrow, mechanisms, prescribers, guidance coverage (8 sources), evidence claims with badges, FAERS signal, substitutes, combination partners, patient message blocks.
- **Define the patient record format:** synthetic FHIR patient + medications + questionnaire answers + trusted contacts.
- **Define the health-system config format** (for scalability): catchment ZIPs, clinics, languages, cooling-place source, alert rules.
- **Design tokens:** light mode, 4 bucket colors (colorblind-safe), badge styles, type scale (large for the patient app).
- **Confirm the 15 drugs** (spec §8.7).
- **Output:** schemas in the repo, keys working, a mock knowledge base with 2–3 drugs so UI work can start.

## Step 2. Data collection: scrapers, all in parallel (~1–2 hrs of scripting; can run overnight)
Needs: Step 1 formats and keys.
- **Literature:** PubMed + Europe PMC searches (15 drugs × heat terms); citation chasing from the key reviews (OpenAlex); abstracts saved.
- **System graph:**
  - drug → mediator and heat → mediator relationships and findings
  - lookups for every paper we cite
  - full scan of the Dataverse CSV (drug + heat/temperature variable names)
  - neighborhoods around the heat concepts
  - implied-but-untested links
- **FDA reports (openFDA FAERS):** report counts for each drug × heat reactions (heat stroke, hyperthermia, heat exhaustion, dehydration, hyponatremia, anhidrosis/hypohidrosis) and background counts for the signal math.
- **Guidance:** text of the 8 guidance documents, for automated coding.
- **Climate:**
  - NWS/HeatRisk access
  - NOAA CPC outlooks
  - NOAA GHCN-Daily history (Central Park, LaGuardia; about 30 years)
  - one past NYC heat wave chosen for the replay
- **Place data:**
  - NYC Heat Vulnerability Index
  - NYC Hyperlocal Temperature Monitoring
  - CDC PLACES
  - CDC/ATSDR Social Vulnerability Index (national)
  - CMS Part D (NY and the second demo city)
  - cooling centers
  - NYPL/BPL/Queens libraries and hours
  - NYC Parks rec centers
  - OpenStreetMap cooling places (national)
  - MTA GTFS
- **Synthetic patients:** Synthea panel tuned to the SBH catchment, plus a second city for the switcher.
- **Output:** raw data files in `data/raw/` with sources and access dates in `data/SOURCES.md`.

## Step 3. Verification and the knowledge base (~1.5–2 hrs)
Needs: Step 2 data.
- **LLM screening and extraction** of the literature (no human review), with counts recorded for the funnel.
- **Automated verification** (spec §8.2a): citation exists, number appears in the abstract, System agreement, Dataverse cross-check, relationship corroboration, direction check → badges.
- **Scoring:**
  - 8-step tiers → 3-step meter
  - FLAG / CHANGE
  - Compass arrows
  - mechanisms
  - combination rules (stacking, danger pairs, the anticholinergic burden scale)
- **Guidance coding** (LLM, 8 sources × 15 drugs) → guidance coverage and gap badges.
- **Pathways and hidden heat drugs:** chain System links, **validate on known heat drugs first**, flag candidates, check against FAERS signals.
- **FAERS signal:** reporting ratios per drug × reaction, labeled "warning signal, not proof."
- **Graph audit:** papers in System / extracted / correct / mislabeled; fix list; "10 questions research must answer next."
- **Substitutes:** 2–3 per drug where prescribing sources support them.
- **Output:** the real knowledge base, the audit outputs, and the numbers for nerd stats.

## Step 4. Patient-side logic (~1–1.5 hrs; can run alongside Step 3)
Needs: Step 1 formats, Step 2 place, climate and Synthea data.
- **Questionnaire:** core 5 + action-item fields; synthetic answers for the panel.
- **Personal heat readiness level:** documented points from answers + medication stack + neighborhood heat.
- **Escalation algorithm** (spec §4.4a): time budget by risk/HeatRisk; travel time by routing; response-time defaults; contact eligibility; check-in schedule.
- **Cooling-place matching:** nearest open, step-free if needed, "arrive before 11 AM."
- **Message customization rules:** knowledge-base blocks + patient needs (fluid limits, child/caregiver, language).
- **Heat-wave probability:** HeatRisk → CPC outlook → historical odds blend.
- **Output:** functions or APIs the apps call; scores computed for the synthetic panel.

## Step 5. Clinician app, evidence side: journey structure, evidence map, Drug Card, nerd stats (~1.5–2 hrs)
Needs: Step 1 (start on mock data), then Step 3's knowledge base.
- Site shell organized by the **6-stage journey**, with **map / graph / patient view** switches.
- **Periodic table** evidence map (3-step meter, bucket colors, prescriber icons, gap rings, lenses incl. pediatrics).
- **Drug Card:** label, FLAG/CHANGE, Compass (arrows only), forest plot, badges, guidance, combinations, substitutes, patient-wording preview, EHR alert preview.
- **Evidence-vs-guidance quadrant.**
- **Nerd stats:** 8-step tiers, evidence funnel, verification badge counts, graph audit and fix list, formulas, sources, limitations, escalation assumptions.

## Step 6. Clinician app, heat and place side + all other visuals (~2 hrs)
Needs: Step 4 logic, Step 2 data (start on mock data).
- **Heat-wave probability bar + context strip.**
- **Call-first scatter** + ranked list + tiers + lasso-to-send.
- **Simulator** and **playbook** (replayed NYC heat wave).
- **3D NYC map:** heat, prescriptions (hexagons), cooling places, deliveries layer.
- **Node graph** (evidence X-ray / risk constellation / combination web / gap constellation).
- Remaining catalogue visuals (spec §5): Sankeys, neighborhood × drug heatmap, treemap, body diagram, heat ladder, prescriber swimlanes, calendar heatmap, evidence timeline, "who was studied," audit funnel, combination matrix, heat-day timeline.
- **Team review:** cut visuals that aren't working.

## Step 7. Patient app, alerts and scalability (~1.5–2 hrs)
Needs: Step 4 logic, Step 5/6 shell.
- **Medicine Cabinet app:** cabinet, glowing bottles, personal flow, questionnaire, large-type light UI, English + Spanish.
- **Mandatory safety alert:** push (DND-breaking where possible) **and SMS**, really delivered.
- **Trusted-contact escalation** with the computed wait; contact page with the "what to look for / what to do" checklist.
- **Morning cooling-place text; "I'm OK" check-ins; "I feel unwell / no AC" buttons** → clinic call list.
- **Clinic board:** who hasn't checked in; outcome funnel.
- **EHR alert:** CDS Hooks card in the public sandbox (drug and combination triggers).
- **Scalability:** health-system switcher (SBH → second city), "add your health system" setup screen, national view, architecture slide.

## Step 8. Integrate, test, pitch, submit (last ~1 hr; finish by 2:45 PM)
Needs: everything above.
- **End-to-end run** on the replayed heat day: forecast → scatter → send alert → push + SMS arrive → escalation → board updates → post-heat-wave follow-up list.
- **Test on real phones:** DND breakthrough, SMS delivery, the second-city switch.
- **Check every headline number** traces to a file; unverified claims are hidden from labels.
- **Pitch:** 3-minute walkthrough of the real software (no staged scenario), organized by the journey. Graph audit + "10 questions" slides. Headline line.
- **Record a backup video.**
- **Devpost:** description, screenshots, repo link, data sources, limitations. **Submit before 3:00 PM.**
