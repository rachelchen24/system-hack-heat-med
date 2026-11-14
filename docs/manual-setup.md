# Manual setup: what Rachel and Myra do by hand

Everything else is scripted. Put every key in `.env` (gitignored) and **never paste keys into chat**.

## What's actually required (trimmed 14 Nov)
- **Required:** only `SYSTEM_API_KEY` (have it). **The demo SMS is simulated** on screen (decided 14 Nov), so Twilio isn't needed.
- **Optional, skip unless you hit a limit:**
  - **openFDA:** works without a key, up to 1,000 requests a day. We need about 300.
  - **OpenRouteService:** routing can use the free, no-key OSM routing servers (routing.openstreetmap.de) for walking and driving.
  - **Supabase:** run the demo locally with a SQLite/JSON store, and have the clinic board refresh every few seconds.
  - **Vercel:** the demo runs from a laptop; Devpost can link the GitHub repo plus a video. Add Vercel only if we want a public URL.
  - **NYC Open Data token.**

## Accounts and keys (full list, including the optional ones)

| # | Service | Steps | `.env` name(s) |
|---|---|---|---|
| 1 | **openFDA** (FDA reports) | open.fda.gov → APIs → Authentication → enter email → key arrives instantly | `OPENFDA_API_KEY` |
| 2 | **OpenRouteService** (travel times) | openrouteservice.org → Sign up → Dashboard → create token (free Standard plan) | `ORS_API_KEY` |
| 3 | **Twilio** (SMS alert) | twilio.com/try-twilio → sign up, verify your phone → get a trial phone number → **Verified Caller IDs: add every phone that should receive demo texts** (trial only texts verified numbers) → copy Account SID + Auth Token | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| 4 | **Supabase** (database + live board) | supabase.com → sign up with GitHub → New project (region US East) → save the DB password → Project Settings → API → copy URL, anon key, service_role key | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| 5 | **Vercel** (hosting) | vercel.com → sign up with GitHub → give access to the `system-hack-heat-med` repo. Importing and deploying happens later. | — |
| 6 | **System API** | already in `.env` | `SYSTEM_API_KEY` |

**Not needed:** Anthropic/Claude API, NWS (no key), NOAA history (direct CSV download), System Dataverse (public download), CDS Hooks sandbox (no account), Web Push keys (Claude generates them).

**Optional:** NYC Open Data app token (higher rate limits): data.cityofnewyork.us → sign up → Developer Settings → create app token → `NYC_OPENDATA_APP_TOKEN`.

## Installs on Rachel's machine
- Node 24, npm, Git and Python 3.14 are already installed.
- **Java is too old** (1.8). Synthea needs Java 17. Run:

```bash
winget install EclipseAdoptium.Temurin.17.JDK
```

Then open a new terminal and check that `java -version` says 17.

## Decisions only you two can make
- Confirm the **15 drugs** (spec §8.7).
- Pick the **second demo city / health system** for the switcher (e.g. Phoenix or Houston).
- Choose **which phones** get the demo SMS and push, and verify them in Twilio.
- Pick **one real past NYC heat wave** to replay. Claude can suggest dates from NOAA data.

## Checklist
- [ ] openFDA key
- [ ] OpenRouteService key
- [ ] Twilio: account, number, verified demo phones
- [ ] Supabase project + 3 keys
- [ ] Vercel connected to GitHub
- [ ] Java 17 installed
- [ ] 15 drugs confirmed; second city picked; demo phones picked
