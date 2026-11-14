# Data sources

Started Sat 14 Nov 2026. Add a line for every dataset that reaches the app.

## Community resources (`data/processed/community_resources_nyc.geojson`, built by `scripts/community_resources.py`, accessed 2026-11-14)
4,484 places after removing duplicates. Raw downloads are in `data/raw/community/`.

| Source | What | Link |
|---|---|---|
| NYC Facilities Database (NYC Planning) | Public libraries, senior services, soup kitchens and food pantries, community centers, homeless services, immigrant services, financial/social services, disability programs | https://data.cityofnewyork.us/d/ji82-xba5 |
| NYC Aging: providers with sites open to the public | Older adult centers and other NYC Aging sites | https://data.cityofnewyork.us/d/u7wp-np5k |
| NYCHA community facilities | Community centers in public housing (vacant sites excluded) | https://data.cityofnewyork.us/d/crns-fw6u |
| DHS drop-in centers | Homeless drop-in centers | https://data.cityofnewyork.us/d/bmxf-3rd4 |
| NYC Community Based Organizations (NYC Service, 2019) | Nonprofits / community-based organizations | https://data.cityofnewyork.us/d/i4kb-6ab6 |
| NYC Care community-based organizations | 23 enrollment partners; only 6 list a street address and are on the map. All 23 are in `data/processed/nyccare_cbos.csv`. Page saved from a normal page load; the site serves a CAPTCHA to scripts, so it isn't re-scraped | https://www.nyccare.nyc/community-based-organization/ |
| NYC Planning GeoSearch | Geocoding of NYC Care addresses | https://geosearch.planninglabs.nyc |
| `cooling_places_nyc.geojson` (already in repo) | NYC Emergency Management Cool Options (cooling centers, spray showers, pools), OSM indoor places, libraries, Parks rec centers | see the script that built it |

**Limits:** directories change; hours are mostly missing; the NYC Service list is from 2019. The map card says "Hours and services can change. Call ahead."
