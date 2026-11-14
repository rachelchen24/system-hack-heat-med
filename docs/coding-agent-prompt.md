You're working on our hackathon app, "The Missing Label," in this repo. The Next.js app is in `web/` (it runs on port 3000 with `npm run dev`). The Devpost deadline is 3:00 PM today and the code freeze is 2:15 PM, so work fast, in priority order, and keep the app running after every step.

Read these first (10 minutes max): `docs/build-plan.md` (v2, the plan you're executing), `spec.md` §4.0a and §5.0 (focus and simplification), and the existing code in `web/src/app/board`, `web/src/app/phone`, `web/src/lib/loop.ts`, `web/src/lib/panel.ts` and `web/src/lib/kb.ts`.

THE PRODUCT IN ONE SENTENCE
On the morning a heat wave is forecast, a clinic nurse sees which patients are Low, Medium or High risk because of their medicines and their home, texts each group a simple plan, and each patient sees on a map where it's cooler, where help is, how to get there, and the safest time to go.

DESIGN RULES (non-negotiable)
1. Outcome first, evidence on click. Main screens show only who's at risk, what to do and where to go. All evidence (sources, System graph, FDA reports, badges, scores) goes behind a "Why?" / "See the evidence" button that opens a panel: a plain reason first, then the details.
2. Readable by anyone, including non-medical people. On main screens, no codes, scores or jargon: no FLAG/CHANGE, ROR, T1–T8, "jurisdictions," "negative-control band," "narrow therapeutic index," "HeatRisk 4 Magenta," and no raw scores like 0.605. Use plain words ("check on this person," "about 4 times as many heat reports"). Every chart title states the takeaway.
3. Few visuals, clean and pretty: light mode, calm colors, lots of white space, one main action per screen, at most 3 colors and one legend per chart. Large type on the patient side.
4. No invented data. Every number and sentence comes from a file in `data/`. If something isn't available, show a small labeled placeholder naming the file it would come from. Patients are synthetic; label them so.
5. No dose advice to patients. Patient messages end with "Talk to your doctor or pharmacist."

TASKS, IN ORDER (stop at the line if time runs out)

P0. Simplify the shell (~20 min)
- Top navigation becomes 4 tabs: Patients (`/board`), Map (`/map`), Medicines (`/medicines`), Patient app (`/phone`). Put a small "Methods" link to `/evidence` in the footer.
- Move the current evidence map from `/map` to `/medicines` (update links). Remove the 6-step journey bar and the Readiness page from navigation (keep the files).
- Home page: the one-sentence product plus two buttons, "I'm a clinician" → `/board` and "I'm a patient" → `/phone`.

P1. Heat + help map (~60 min), the centerpiece. Put the components in `web/src/components/map/`.
- deck.gl + MapLibre (already installed) with a light OpenFreeMap basemap. **2D by default, with a "3D" toggle** (pitch plus building extrusions).
- Heat layer first: neighborhoods shaded hotter → cooler from `data/processed/hvi_nta2020.geojson` (or the hyperlocal temperature sensors), with one legend: "Hotter / Cooler".
- Help layer: `data/processed/cooling_places_nyc.geojson` (1,868 places). Simple icons by type; tap → name, address, hours, phone.
- Clinician mode (`/map`): patient counts by neighborhood in Low/Medium/High colors, with no individual dots. Clicking an area lists its patients by group with a "Text this group" button (reuse the existing send API).
- Patient mode (a component reused in P3): home location, the nearest help place and a route line with walk minutes, from `data/processed/synthetic/cooling_match.csv`; nearest subway station from `subway_stations_nyc.geojson`. "Leave by X" uses the hourly heat in `replay_heatwave_hourly.csv`. Show "Ask for a delivery instead" when the walk is long, when the patient can't reach a cool place alone (`q5_can_reach_cool_place`), or during the hottest hours.

P2. Risk groups for the clinician (`/board`, ~40 min)
- Groups come from `data/processed/panel_scores_replay.json` → `patients[].readiness.level`: low → Low, medium → Medium, high + very_high → High.
- Layout: High / Medium / Low tabs or columns with counts. Each row shows the synthetic name, age, ZIP, ONE plain sentence of why (rewrite `readiness.drivers` into plain words), and status.
- A "Text this group" button sends each patient their group's message through the existing simulated SMS loop. Keep the escalation (contact notified when there's no reply) and the fast-forward buttons.
- "Why?" on a row opens a side panel: their medicines, what each one does in heat (from `data/kb/knowledge_base.json`), the System pathway, and source links.
- Patients with `alert_opt_in` false get "Call instead," not a text.

P3. Patient "my heat plan" (`/phone/[id]`, ~40 min). Large type, simple, phone-sized.
Order on the screen:
1. "Your heat risk today: High," plus one sentence of why.
2. Safest time to go out: an hourly strip, green = OK and red = stay in, from `replay_heatwave_hourly.csv`.
3. Where to go: the nearest cool place on the 2D map (3D toggle), with the route, walk time and "leave by X."
4. Or stay in: the delivery option.
5. What to watch for, then "Talk to your doctor or pharmacist."
6. The existing simulated text thread and the "I'm OK" / "I feel unwell" / "No AC" buttons.
Messages differ by group: Low = heads-up; Medium = + nearest help + safe hours; High = + route + check-ins + contact.

P4. Medicines, outcome first (~30 min)
- `/medicines`: replace the tile wall with a clean grouped list. Group headers in plain words, from the knowledge-base buckets (e.g. "Check on these patients," "The dose may need a look," "Store it cool"). One row per medicine: a plain one-line risk, evidence as "Strong / Some / Early signs," who prescribes it, ✓/✗ "Label warns about heat," ✓/✗ "Guidance says what to do."
- `/drug/[id]`: the top shows only the plain message and what to do. Move everything else (FLAG/CHANGE, Compass, claims, guidance quotes, combinations) behind a "See the evidence" toggle. Translate any French or German guidance quotes to English.

P5. "How heat and medicine add up" (~25 min)
- A simple 3-column picture: medicines → body effect (dehydration, low salt, kidney strain, can't sweat, drowsy) ← heat, from `data/processed/system_pathways.csv` and `system_drug_mediator_findings.csv`. Line thickness = number of studies in the System graph. Clicking a line opens "Why?" with System study counts. Put it on `/medicines` and a one-line version on the patient plan ("Your two medicines both make it harder to stay cool").

──── Everything above this line = complete demo ────

P6. Only if time remains
- Scrape the NYC Care community-based organizations (https://www.nyccare.nyc/community-based-organization/) into `data/processed/nyc_care_cbos.geojson` (name, address, services, languages, phone; geocode), and add it as a map layer.
- An intake questionnaire screen (`/phone/signup`): the core 5 questions from spec §4.5a plus heat habits plus a caregiver/emergency contact; it shows the resulting group.
- An "EHR side panel" view (`/ehr/[id]`): the patient's plan in a narrow layout, plus have `/api/cds-hooks` return a card that links to it. Label it "Prototype, designed to embed via SMART on FHIR / CDS Hooks."

WORKING RULES
- Don't rebuild what works: the send/escalation loop, SQLite, the APIs and the data files.
- Keep `npm run dev` working after every task. Fix TypeScript and lint errors as you go.
- After each P-step, check it in the browser at desktop width and at phone width (375 px), then commit with a short message. Don't push.
- Don't edit anything in `data/` except adding new files in P6. Don't touch `.env`.
- If two agents are running, the map agent owns `web/src/components/map/` and `/map`; the other agent owns everything else. Never edit the same file.
- When you finish or stop, report: what's done, what's not, and anything shown as a placeholder.
