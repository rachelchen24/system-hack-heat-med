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

## 2. Who it's for

| User | What they need |
|---|---|
| **Prescribers** (primary care, psychiatry, cardiology, endocrinology, nephrology, neurology, pediatrics) | Which of my patients to contact before a heat wave, and what, if anything, to change |
| **Pharmacists** | A counseling line per drug, plus storage advice |
| **Health department / emergency planners** | Where in NYC to focus outreach, and which prescribers to alert first |
| **Patients** (secondary) | A plain-language warning that should have been on the label |
| **System's team** (judges) | Evidence that their graph can power this, plus a precise account of where it falls short |

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

### 3.4 Label audit
A scan of official FDA label text (openFDA drug labels / DailyMed) for every heat-risk drug: does the label mention heat, hyperthermia, sweating or dehydration? This puts a number on the project's title: "X of Y heat-risk drugs carry no heat warning on their official label."

### 3.5 NYC heat-wave playbook
Input: a heat wave, either a replay of a real past NYC heat wave or a live National Weather Service forecast. Output: a 72-hour plan.
- **Where:** neighborhoods ranked by the NYC Heat Vulnerability Index × CDC PLACES prevalence of the conditions these drugs treat, with cooling centers and pharmacies overlaid
- **Who:** prescriber specialties and areas with the most heat-risk prescriptions (CMS Part D), shown in aggregate only
- **What:** the label messages, split into "contact these patients" (FLAG) and "consider changing" (CHANGE)
- **Power outages:** reminders for people who rely on powered home medical equipment

### 3.6 Methods & receipts page
- Data sources with versions and access dates
- Graph coverage counts and the graph audit
- Hand-check accuracy, agreement between the two guidance coders (kappa), citation verification rate
- The evidence-scoring formula
- Known limitations

### 3.7 Stretch outputs (scalability)
- **Heat Label API:** RxNorm code in → label JSON out
- **EHR alert prototype** (CDS Hooks): fires when a flagged drug is prescribed during a high-heat forecast
- **City toggle:** e.g. Phoenix, to show it works outside NYC
- **Physical props:**
  - printed pill bottles with thermochromic heat-warning labels
  - optional evidence-calibrated storage sensor

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

### 4.3 Already in the repo
- `data/Drug heat risk master list.xlsx` / `.csv`: 86 drug-risk rows, plus the guidance comparison
- `data/graph_coverage.csv`, `data/graph_heat_relationships.csv`, `data/graph_heat_variable_hits.csv`: graph check output
- `report/Prescribed drug heat risks.md`: cited research report
- `docs/graph-check-results.md`: graph coverage results and how the landmark papers were filed

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

## 10. Open questions

- Which ~8 drugs get polished labels? (Suggested: lithium, loop diuretics, topiramate, oxybutynin, fentanyl patch, insulin/pump, SGLT2 inhibitors, an antipsychotic)
- Tech stack for the site and maps
- Can thermochromic labels arrive in time?
- Are we including the optional sensor?
- Do we include any tier C (unverifiable) sources, and if so, only in the pitch?
