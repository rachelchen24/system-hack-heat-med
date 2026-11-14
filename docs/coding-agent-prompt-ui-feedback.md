UI feedback from Rachel (Sat 14 Nov, ~1:45 PM). Full notes are in `spec.md` under "Rachel's UI feedback". We're at code freeze, so keep each change small, and check every page loads after each step.

FIRST: FINISH THE MERGE
- This folder may be mid-merge (`git status` shows `UU` files). Resolve every conflict, keeping BOTH Myra's redesign (calm header, map as the home page, shadcn components) AND the changes below. Run `npm install` in `web/` (Myra added `tw-animate-css`), confirm every page returns 200 (`/`, `/board`, `/map`, `/medicines`, `/phone`, `/phone/S01`, `/messages`, `/replay`), then commit the merge. Don't push.
- Some of the changes below are already written in the conflicted files or in new files. Use them; don't rebuild:
  - `web/src/components/cabinet/MedicineCabinet.tsx` (new, finished): the patient medicine cabinet
  - `web/src/components/medicines/MedicineList.tsx`: "ours" side has the dropdowns and colored chips
  - `web/src/components/medicines/HeatMedicinePicture.tsx`: "ours" side has a color per body effect and pill-shaped medicine labels

1. RENAME: "The Missing Label" → "Cool-Aid" (with a C). Use it in the header, page titles (`· Cool-Aid`), home page and CDS Hooks card labels. Write the header name in our palette blue: `style={{ color: "var(--bucket-store-solid, #0072b2)" }}`, bold.

2. MEDICINES TAB (clinician): simpler, fewer words, more color.
   - The "how heat and medicine add up" diagram (medicines → body effect ← heat, hover to highlight) is the main thing: put it at the top, full width, prettier. Give each body effect its own palette color (dehydration #56b4e9, low salt #009e73, kidney strain #cc79a7, can't sweat #e69f00, body overheats #d55e00, low blood pressure #0072b2), color each medicine's line by its effect, and put medicine names in pill chips. One short line of help text at most.
   - Below it, the medicine list grouped by what to do, with each group as a **dropdown** (`<details>`, first one open).
   - Colored indicators instead of plain text: evidence = 3 dots filled in orange (`hold` colors), "Label warns?" and "Guidance says what to do?" as chips: ✓ Yes = blue chip (`store` tint/ink), ✗ No = orange chip (`hold` tint/ink). Short column headers.
   - Sources go in a collapsed "Sources" dropdown at the bottom.
   - This diagram is for the clinician only. Don't show it on the patient side.

3. PATIENT VIEW / PATIENT APP (`/phone/[id]`): visual, not words.
   - Add the medicine cabinet (`MedicineCabinet`) to the patient plan. Build its data from `panel_scores_replay.json` → `patients[].stacking.mechanisms`. Each item has a `defense` (id), a `label` like "Blood pressure (dizziness, fainting)" (split it into title "Blood pressure" + signs "dizziness, fainting"), and `drugs`. Pass `effects=[{ id, title, signs, drugs }]`. Spanish title/hint if the patient's language is "es".
   - The cabinet shows the patient's own bottles on a shelf, with colored stems from each bottle to what it can do in the heat. Hovering or tapping a bottle lights up its effects, and several can be selected at once; effects hit by 2+ chosen medicines show "Adds up ×N".
   - Cut words everywhere on the patient page: one-line headings, a short risk line, and everything else in **dropdowns** (`<details>`). Keep: risk today, safest hours strip, where to go (map), the cabinet, and "Talk to your doctor or pharmacist."
   - Remove any network/graph diagram from the patient side.

RULES: no invented data (every label comes from the data files); no dose advice; keep the palette (Okabe–Ito: High = orange #d55e00, Medium = yellow #f0c419, Low = blue #0072b2); light mode. Commit after each step; don't push. When done, report what changed and anything left undone.
