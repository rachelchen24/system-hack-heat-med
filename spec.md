# The Missing Label: project spec

**Event:** System Public Challenge, NYC, 13–14 Nov 2026. Visualize Challenge 3.
**Team:** Rachel and Myra
**Status:** draft spec. The build plan comes later. Strategy and rationale are in `docs/winning-plan.md`.

---

## 1. Problem

Many common prescriptions make heat more dangerous. They block sweating, deepen dehydration, push drug levels into toxic ranges, absorb faster, or degrade in storage. Yet:

- **Patients are almost never warned.** Drug labels warn about alcohol and sunlight, rarely about heat waves.
- **Guidance is uneven.** The 8 heat-health guidance sources we reviewed rely mostly on drug lists dating from the 2003 French heat wave. None grades its evidence. None mentions fentanyl patches or SGLT2 inhibitors.
- **The evidence is scattered,** and the System Public Graph holds almost none of it directly:
  - about 15 direct drug × heat findings
  - landmark papers are indexed but filed under vague labels, or have no findings extracted

## 1a. How we meet the challenge brief

The judged deliverable is: *"A visual evidence map of heat-sensitive medications grouped by type of action, showing evidence strength, the prescribers involved and gaps in current guidance, which a clinician, pharmacist or public health official could use to plan heat-wave counseling and outreach."* (Challenge owner: Chethan Sarabu, MD, Cornell Tech.)

| Brief asks for | Our answer | Status |
|---|---|---|
| Use the System graph to map the drug-to-heat evidence | Paper-level receipts, two-hop pathways (3.3), graph audit | Planned |
| Action buckets (dose, hold/substitute, monitor, storage) | Master list is tagged by bucket | Data done |
| Evidence strength per bucket | Evidence tiers + FLAG/CHANGE meters | Data done; meters planned |
| Prescribers involved | Prescriber column in the master list | Data done |
| What a prescriber might reasonably change before or during a heat wave | Label action lines + Heat Dose Compass (3.4) | Planned |
| Compare with guidance worldwide; show where it's missing or out of step | 8 guidance sources compared + quadrant (3.2) | Data done; visual planned |
| *Optional:* wearables, and where the evidence runs out | Wearables panel (3.5c) | Research done |
| *Optional:* NYC overlap of heat exposure and prescriptions | Playbook (3.5) + 3D NYC map (3.5d) | Planned |

**Category criterion (Visualize):** "compelling and accurate visual stories for a non-specialist audience." The **public visual story** (§2) answers this, and it's weighted equally with the clinician tool.

**Rule:** the evidence map is the core content, shown two ways: as the story for non-specialists and as the tool for clinicians. Every other feature has to connect back to it:
- the Compass answers "what to change"
- Heat-Safe Delivery covers the storage bucket
- the schizophrenia/SBH case is the worked example

## 2. Who it's for

| User | What they need |
|---|---|
| **Prescribers / clinicians** (primary care, **pediatrics**, psychiatry, cardiology, endocrinology, nephrology, neurology), **the primary user** | Which of my patients to contact before a heat wave, what, if anything, to change, and an alert inside the EHR at the moment of prescribing |
| **Pharmacists** (secondary) | A counseling line per drug, plus storage and delivery advice |
| **Health department / emergency planners** (secondary) | Where in NYC to focus outreach, and which prescribers to alert first |
| **Patients, caregivers and the public** (non-specialist; co-equal with clinicians for judging) | A story they can follow about why heat and medicine collide, plus a plain-language heat card for their own medicines and questions to ask their care team |
| **System's team** (judges) | Evidence that their graph can power this, plus a precise account of where it falls short |

**Two things are being judged, and they pull in different directions:**
- **The Visualize category:** "Design and communication, turning relationships in the graph into compelling and accurate visual stories for a **non-specialist audience**."
- **The Challenge 3 deliverable:** a visual evidence map "which a **clinician, pharmacist or public health official** could use."

**Audience decision (revised): one product, two equally weighted front doors that share one knowledge base.**
1. **Public visual story (non-specialist front door, co-equal):** a scrolling, illustrated story, *"The Missing Label,"* that anyone can follow without medical training. It's the first thing judges see.
   - **Open on a person:** a 78-year-old in the Bronx, on a diuretic and a bladder pill, with no AC.
   - **The four ways heat and medicine collide,** each shown as a simple body diagram:
     - sweat blocked
     - water and salt lost
     - drug builds up or absorbs faster
     - drug spoiled before it's taken
   - **The graph made visible:** drug → kidney / salt / water ← heat pathways, animated from real graph findings, with the gap shown openly ("the graph knows the pieces, but no one has connected them").
   - **The guidance gap:** which rules exist, which are missing, which are out of step.
   - **The place:** the Bronx / SBH neighborhood, and who is most exposed.
   - **The doorstep:** a package of medicine heating up on a porch.
   - **The ending:** the missing label, revealed, and a hand-off: "Clinicians: open the tool."
   - **Rule:** accuracy is part of "compelling and accurate." Every number in the story has a receipt, and uncertainty is shown plainly (e.g. "we don't know yet").
2. **"Check my medicines" (patient-facing feature inside the public story):** pick your medicines from a list and get a plain-language heat card for each.
   - Each card says why heat matters for that drug, what to watch for, how to store it, and **questions to ask your doctor or pharmacist**.
   - No dose advice, ever.
   - Framed as "talk to your care team." Ties to the doorstep delivery text and the printed bottles.
3. **Clinician tool (professional front door, meets the challenge deliverable):** clinician-first (see 2a). Pharmacists and public-health officials use the same views with their own filters.
   - Contains: the evidence map, quadrant, pathways, Compass, playbook, delivery dashboard, EHR alert, Methods & receipts.
   - Researchers are served by the Methods & receipts page.

**Shared foundation:** one knowledge base feeds both front doors, so the patient card, the public story and the clinician card always say the same thing at different reading levels.

**At judging:** start with the public story (non-specialist), then step through to the clinician tool (the challenge deliverable). The story wins the category; the tool wins the challenge.

### 2a. Clinician-first design (our judge is a pediatrician and clinical informatician who works with SBH)
- **Fit the workflow.**
  - The core interaction is a clinician's own question: "I'm prescribing X, and a heat wave is coming. What do I need to know?"
  - Answer in one card: bucket, FLAG/CHANGE, what to monitor, the Compass arrow, evidence strength, receipts.
- **Show it inside the EHR (informatics).**
  - Promote the **CDS Hooks card** from stretch to should-have.
  - It's a working alert in the public CDS Hooks sandbox that fires when a flagged drug is ordered while the NWS forecast is high.
  - Use real standards: RxNorm codes for drugs, FHIR MedicationRequest, and a SMART-on-FHIR-style patient context.
  - A "heat-risk patient list" (all of a clinician's patients on flagged drugs) is the panel-management version.
- **Include a pediatrics slice:**
  - topiramate/zonisamide reduced sweating in children (all US zonisamide cases were age 18 or under)
  - ADHD stimulants and exertional heat illness in teen athletes
  - epinephrine auto-injectors and inhalers degrading in heat
  - asthma
  - Pediatric drug-heat evidence is thin, so show that as a gap rather than hide it.
- **Stay credible:** wording is "considerations for clinicians," not orders. Every claim has a receipt, and evidence tier and confounding are labeled. An informatician will check whether alerts would cause alert fatigue, so fire the card only when **drug is flagged AND forecast is high**, never year-round.

## 3. Product

**One heat-risk knowledge base, shown through several outputs.**

### 3.1 The Missing Label (centerpiece)
A redesigned drug label with a heat warning, for each drug or class (about 8 polished labels, about 25 in the database). Each label shows:
- **Action bucket:** Adjust dose / Hold or substitute / Monitor closely / Store cool
- **Two meters:**
  - **FLAG:** how strongly this prescription identifies a person to contact
  - **CHANGE:** how strongly the evidence supports changing the drug itself
- **Evidence by layer, each marked:** ① graph pathway, ② published literature not in the graph, ③ FDA adverse-event signal
- **Prescribers involved**
- **One plain-language line,** e.g. "During a heat wave, check lithium levels: dehydration can push them into the toxic range."
- **Receipts:** every claim links to its finding and paper
- **Disclaimer:** "Prototype. Considerations for clinicians, not instructions."

### 3.2 Evidence vs. guidance quadrant
- **x-axis:** evidence strength
- **y-axis:** guidance coverage (how many of the 8 sources give a specific action)
- **Marker size:** severity
- **Hollow markers:** null findings

The story it tells: guidance overstates the risk of common drug classes and is silent on rare, severe harms.

### 3.3 Heat-risk pathways (the graph as a graph)
A Sankey or network view:

```
drug → (dehydration / low sodium / kidney injury / blood pressure) ← heat
```

It's built from graph findings on both sides. Pathway scores are validated against drugs already known to be heat risks. Drugs with strong pathways that appear on no guidance list are flagged as **hidden heat drugs**, then checked against FDA adverse-event reports.

### 3.4 Heat Dose Compass (from the judge's input)
For each drug, which way heat pushes the dose's effect:
- **↑ stronger:** insulin absorption, patches, lithium/digoxin buildup, added blood-pressure drop
- **↓ weaker:** degraded epinephrine/insulin, patches peeling off, unreliable inhalers
- **↕ depends**

Each entry also shows the mechanism, the trigger (forecast heat, fever, exertion, heat on a patch), what to monitor, and evidence strength. An optional body-temperature slider shows how risk grows; it's illustrative only, and **never gives a dose number**. A numeric "safe dose at this temperature" algorithm isn't feasible: there's no validated calibration data, and wearable core-temperature estimates aren't validated in medicated patients. See `docs/schizophrenia-sbh-focus.md` §3.

### 3.5 NYC heat-wave playbook (demo focus: SBH Health System catchment, Bronx)
Input: a heat wave, either a replay of a real past NYC heat wave or a live National Weather Service forecast. Output: a 72-hour plan.
- **Where:** neighborhoods ranked by the NYC Heat Vulnerability Index × CDC PLACES prevalence of the conditions these drugs treat, with cooling centers and pharmacies overlaid
- **Who:** prescriber specialties and areas with the most heat-risk prescriptions (CMS Part D), shown in aggregate only
- **What:** the label messages, split into "contact these patients" (FLAG) and "consider changing" (CHANGE)
- **Power outages:** reminders for people who rely on powered home medical equipment
- **Demo scope:** the zip codes around St. Barnabas Hospital and SBH Behavioral Health (10453, 10457, 10458, 10460 and nearby; confirm against SBH's 2025–27 Community Service Plan). Our judge works with SBH.

### 3.5a Featured case: schizophrenia
The deep-dive label and playbook path. Shows how illness and medication each contribute to risk:
- BC 2021 heat dome: any antipsychotic OR 2.43; 2+ antipsychotics OR 4.05
- Japan within-person study: no added drug effect
- Bark 1998, Bronx Psychiatric Center: excess deaths, and prevention worked

Label: **FLAG high, CHANGE moderate.** Review combination therapy before summer; set up check-in calls and cooling access during heat waves; never stop abruptly. See `docs/schizophrenia-sbh-focus.md` §1.

### 3.5b Heat-Safe Delivery (supply chain, from the judge's input)
A software layer over the pharmacy → carrier → patient chain. Details in `docs/supply-chain.md`.
- **Before shipping:** a risk check using the drug's heat profile, the NWS forecast for the destination, and shipping speed. Recommends ship as-is, upgrade to next-day, add insulation, reroute to pickup, or hold.
- **At delivery:** a text to the patient ("bring it inside within 30 min"), escalating to a caregiver if not confirmed.
- **After delivery:** an exposure estimate (mean kinetic temperature from hourly weather) → use / check with pharmacist / replace.
- **Dashboard:** heat-risk shipments across the SBH catchment.
- **Hardware demo (optional):** an ESP32 temperature logger in a package that streams to the dashboard.

**Talking point:** we quantify the drug in the box (mean kinetic temperature, an industry standard) but not the drug in the body (the Compass shows direction only), because only one of the two has validated data.

### 3.5c Wearables panel (optional part of the brief)
What research exists on using heart rate or skin temperature to personalize heat guidance, and where it runs out:
- Heart-rate-based core-temperature estimators (e.g. ECTemp) are validated only in healthy soldiers, athletes and firefighters.
- They miss many readings above 39°C.
- They've never been validated in people on beta blockers (which blunt heart rate), stimulants or anticholinergics (which raise it), or in older, dialysis, MS or pregnant users.

Shown as a "where the evidence runs out" panel, linked from the Compass.

### 3.5d 3D NYC map (team-owned, later)
An open-source 3D map of NYC for the heat × prescriptions overlap and the SBH catchment. **Rachel and Myra will build this themselves later.** Details to be added.

### 3.6 Methods & receipts page
- Data sources with versions and access dates
- Graph coverage counts and the graph audit
- Hand-check accuracy, agreement between the two guidance coders (kappa), citation verification rate
- The evidence-scoring formula
- Known limitations

### 3.7 Stretch outputs (scalability)
- **Heat Label API:** RxNorm code in → label JSON out
- **EHR alert prototype** (CDS Hooks): fires when a flagged drug is prescribed during a high-heat forecast. **Promoted to should-have; see 2a.**
- **City toggle:** e.g. Phoenix, to show it works outside NYC
- **Physical props:**
  - printed pill bottles with thermochromic heat-warning labels
  - optional package temperature logger (see 3.5b)

## 4. Data

### 4.1 Source tiers

| Tier | Sources | How it's used |
|---|---|---|
| **A. Scholarly evidence** | System Public Graph (API + Dataverse v2.1); our master list of 86 drug-risk rows and the research report (PMIDs/DOIs, verified through PubMed and Crossref) | Evidence meters and claims |
| **B. Official, non-scholarly, verifiable** | FDA adverse-event reports (openFDA FAERS); FDA label text (openFDA / DailyMed); heat-health guidance documents (CDC, NYC DOHMH, UKHSA, Health Canada, ANSM, WHO Europe, Victoria, Germany); RxNorm; CMS Part D; CDC PLACES; NYC Heat Vulnerability Index; NYC Open Data (cooling centers, pharmacies); NOAA/NWS weather | Signals, label audit, guidance comparison, mapping, normalization |
| **C. Unverifiable** (news reports of heat deaths, patient forums, social media) | **Optional; context only** | Only for the pitch hook or a "what patients are asking" panel. **Never counted as evidence.** Always labeled. No identifiable individuals quoted. |

**Rule:** a source earns its place only if it changes a label, a ranking or a headline number. Otherwise it's noise and is cut.

### 4.2 Data quality requirements
- Drug names normalized to RxNorm ingredients and classes
- Graph findings deduplicated to distinct papers, with effect direction tagged
- Only findings that appear in both the API and the Dataverse CSV are kept (System says about 20% of findings are extracted inaccurately)
- About 40 graph findings hand-checked against their abstracts, with accuracy reported
- Guidance documents coded independently by both team members, with Cohen's kappa reported
- Every public citation verified, or else marked as unverified
- Versions and access dates pinned in `data/SOURCES.md`

### 4.2a Current quality of our research data (as of 13 Nov 2026)
**A good map, not yet verified data.**
- The master list and report came from web searches and abstracts, mostly not full texts.
- **Citation status of the 86 rows:**
  - 40 have verified identifiers
  - 16 are partly verified
  - 5 are unverified
  - 25 have no citation yet (basics drawn from guidance or general pharmacology)
- **Severity ratings** are the compiler's judgment.
- **Some figures** come from secondary or news sources (e.g. Nordon 2009, mail-order percentages).
- **Checked against the System graph** (`data/master_list_graph_status.csv`):
  - 38 of the 86 rows cite at least one PMID, 51 distinct PMIDs in all
  - **50 of the 51 are indexed in the graph**, which confirms those PMIDs exist
  - **Only 8 have extracted findings.** 42 are indexed with no findings.
  - **PMID 42710533 (Harley 2026) isn't indexed.** Recheck that ID.
  - Of the 8 with findings, Martin-Latry 2007 is mislabeled ("psychotropic drugs").
- **Before anything goes public:**
  1. Run the citation-verification script (PubMed/Crossref title match).
  2. Read the abstract behind every number that appears on a label or slide.
  3. Drop or mark anything that can't be confirmed.

### 4.3 Already in the repo
- `data/Drug heat risk master list.xlsx` / `.csv`: 86 drug-risk rows, plus the guidance comparison
- `data/graph_coverage.csv`, `data/graph_heat_relationships.csv`, `data/graph_heat_variable_hits.csv`: graph check output
- `report/Prescribed drug heat risks.md`: cited research report
- `docs/graph-check-results.md`: graph coverage results and how the landmark papers were filed
- `data/master_list_graph_status.csv`: every master-list PMID looked up in the graph (indexed? findings?)
- `docs/schizophrenia-sbh-focus.md`, `docs/supply-chain.md`: focus notes

## 5. Evidence model

- **Evidence tiers (strongest to weakest):** RCT/meta-analysis → population study → small clinical study → case series → case report → lab/bench → label/guidance only → mechanism only
- **Score inputs:** design weight × number of independent studies × consistency × how well the study population matches the people at risk. Graph pathway and FDA adverse-event signals are shown separately, never blended into the literature score.
- **FLAG vs. CHANGE:** if the strongest within-person studies show no added risk from the drug, it scores high on FLAG and low on CHANGE.
- **Null findings and conflicts are shown,** not hidden.

## 6. Non-goals

- No patient-specific medical advice, and no dosing instructions
- No recreational or illicit drugs
- No naming individual prescribers or patients
- No brand names or pharmacy logos on the props
- Not a replacement for clinical guidance

## 7. Success criteria

**Judging:**
- Every rubric area visibly covered: meaningful graph use, insight and usefulness, technical execution, communication
- A clean, rehearsed 3-minute demo with a recorded backup

**Accuracy:**
- No unverified claim appears on a public label
- Every headline number traces to a file in the repo

**Headline numbers, ready to state:**
- Graph coverage: findings and correctly filed papers
- Label audit: X of Y labels carry no heat warning
- Hidden heat drugs found, and how many FDA reports confirm
- Pathway validation: share of known heat drugs rediscovered

**Usefulness:** the playbook runs end to end for at least one real past NYC heat wave.

## 8. Constraints

- **Time:** about 24 build hours, two people
- **API:** System API is a closed beta, 10,000 requests/day. Key stays in `.env` (gitignored). Field names may change.
- **Licenses:** System Public Graph is CC BY-NC 4.0 (non-commercial, credit required). Check terms for each other source.
- **Season:** November, so there's no live heat. The playbook uses a replay.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Thin graph coverage hurts the "meaningful graph use" score | Two-hop pathways + paper-level receipts + graph audit put the graph at the center |
| Overclaiming from adverse-event reports or case reports | Label the evidence type everywhere; show confounding |
| Labels mistaken for medical advice | Disclaimer on every label and prop; "considerations for clinicians" wording |
| Live demo breaks | Recorded backup; replay mode by default |
| Scope creep | Cut stretch outputs first; never cut the Methods page |

## 10. Maybe (only if time allows)

- **FDA label audit:** scan official FDA label text (openFDA drug labels / DailyMed) for every heat-risk drug and check whether it mentions heat, hyperthermia, sweating or dehydration. Headline: "X of Y heat-risk drugs carry no heat warning on their official label."

## 11. Open questions

- Which ~8 drugs get polished labels? (Suggested: lithium, loop diuretics, topiramate, oxybutynin, fentanyl patch, insulin/pump, SGLT2 inhibitors, an antipsychotic)
- Tech stack for the site and maps
- Can thermochromic labels arrive in time?
- Are we including the optional sensor?
- Do we include any tier C (unverifiable) sources, and if so, only in the pitch?
