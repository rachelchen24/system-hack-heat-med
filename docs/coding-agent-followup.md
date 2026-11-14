Follow-up for the running agent (Sat 14 Nov, ~1:00 PM). First `git pull`: Rachel's session added new pages in new files only. Don't rewrite them; just link to them.

NEW PAGES ALREADY BUILT (don't edit these files)
- `/messages`: the clinician inbox, with every patient conversation, search, a risk-group filter, and "Needs a call" at the top.
- `/messages/[id]`: the clinician's conversation with one patient. It shows who they are (risk group, plain why, contact, "Call instead" if not opted in), the full thread (alerts, clinician texts, texts to their contact, the patient's "I'm OK / unwell / No AC" taps, call-list events), quick-reply templates, "Send heat safety alert," and a box to type a text. Texts are simulated and also appear on the patient's demo phone.
  Files: `web/src/app/messages/`, `web/src/app/api/messages/`, `web/src/components/messages/`, `web/src/lib/conversation.ts`.
- `/replay`: the heat-day time-lapse (pitch opener). Files: `web/src/app/replay/`, `web/src/components/replay/`, `web/src/lib/replay.ts`.

IMPORTANT MAP BUG FIX (do this first if your map shows a blank gray background)
MapLibre's web worker doesn't load under Turbopack ("Worker failed to load" in the console), so no map tiles render. The fix, already used in `web/src/components/replay/TimelapseMap.tsx`:
- `web/public/maplibre-gl-worker.mjs` is a copy of `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs` (already in the repo)
- in your map component: `import { setWorkerUrl } from "maplibre-gl"; setWorkerUrl("/maplibre-gl-worker.mjs");`
- To put a heat layer UNDER streets and labels, use a react-map-gl `<Source type="image">` + `<Layer type="raster" beforeId=...>` inside `<Map>` (see TimelapseMap.tsx) instead of a deck.gl layer on top.

WHAT TO ADD (small edits in files you own)
1. A **"Messages"** button (speech-bubble icon + the word "Messages") that links to `/messages/<patientId>`, everywhere a patient appears for the clinician:
   - each patient row on `/board` (next to "Text" / "Why?")
   - the patient card when a dot is clicked on `/map`
   - the "Why?" side panel
   - any EHR side-panel view (`/ehr/[id]`), if built
   After "Text this group" sends, show a small "Sent. Open messages →" link to `/messages`.
2. Add **Messages** (`/messages`) to the top navigation, next to Patients. Put **Heat-day replay** (`/replay`) in the footer, or as a small link on the home page.
3. Use the same risk-group chip style as `web/src/components/messages/groups.tsx` (High = orange, Medium = yellow, Low = blue), or import `GroupChip` from it.

Keep the existing rules: commit after each step, don't push, don't touch `data/` or `.env`.
