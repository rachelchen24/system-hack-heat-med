# Go/no-go result: medication × heat in the System Public Graph

Run on 13 Nov 2026 against the API (v1, closed beta), using about 2,100 of the 10,000 daily requests.

Raw output:
- `data/graph_coverage.csv`
- `data/graph_heat_relationships.csv`
- `data/graph_heat_variable_hits.csv`

## Bottom line

**The graph holds almost no direct drug × heat evidence**, but it does hold the middle links of a two-step chain.

| What we checked | Result |
|---|---|
| Concept-level links: 18 drug groups × heat stroke, heat illness, hyperthermia, body temperature, sweating, heat wave, extreme heat | **7 findings in total.** All zero for lithium, diuretics, anticholinergics, antipsychotics, topiramate, SGLT2 inhibitors and stimulants. |
| Variable-level scan: every finding attached to 9 heat concepts (about 2,000 variables) that also names a drug | **15 findings, about 14 studies.** Most aren't relevant (e.g., insulin-tolerance tests). The relevant ones include fentanyl concentration rising with local heat, and antipsychotics and body temperature. |
| Drug → mediator links (dehydration, hyponatremia, acute kidney injury) | **About 300 findings.** Largest: ACEi/ARB 74, diuretics 55, NSAIDs 44, antipsychotics 22, loop diuretics 21, SGLT2 19 |
| Heat → mediator/outcome links | Present: heat → mortality (about 70 studies across heat concepts), cardiovascular disease, acute kidney injury, blood pressure, heart failure |

**Not found:** the landmark heat-wave medication studies (the French 2003 heat-wave studies, Layton 2020 Medicare, Kalisch Ellett 2016) don't show up as drug × heat findings. They are either not extracted, or their variables are filed under general concepts like "hospitalization."

## Caveats

- This route may **undercount**. A heat-wave study whose variables are filed under "temperature" or "hospitalization" won't appear.
- The definitive check is a full-text scan of the 442 MB associations CSV for any finding that pairs a drug term with a heat term. `scripts/graph_check.py csv <file>` does this.
- Drug matching uses names, so some hits are false matches. Check the CSV files by hand.

## What this means for the plan

Thin direct coverage would sink "an evidence meter per drug, from the graph." It makes three other things stronger:

1. **Use the graph as a graph (the two-hop bridge).** Heat → AKI / hyponatremia / dehydration / mortality is in the graph, and so is drug → AKI / hyponatremia / dehydration. Chaining the two gives a **graph-derived heat-risk pathway** for each drug, even where no paper studied drug × heat directly. This is the "Hidden Heat Drugs" idea, built from evidence that actually exists.
2. **The gap becomes the headline.** "The graph holds 15 findings on drug × heat. We found 60+ published studies that should be there." That's the graph audit (winning-plan §4D), now with real numbers.
3. **Label evidence comes from three clearly marked layers:**
   - graph two-hop pathway
   - direct literature from our master list (citations verified, marked "not in graph")
   - FDA adverse-event signal

   That matches the brief's request to "show clearly which links rest on graph findings and which don't."
