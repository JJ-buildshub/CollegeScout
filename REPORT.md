# College Scorecard Import — Report

Overnight task, started 2026-09-18. Goal: fill real data gaps (net price,
graduation rate, tuition) using the U.S. Department of Education's College
Scorecard API, without ever touching or overwriting hand-curated data.

## Result

- **112 / 125** schools matched to a College Scorecard/IPEDS record and
  imported.
- **13 / 125** left unmatched — see "Unmatched schools" below. Every one is
  logged in [QUESTIONS.md](QUESTIONS.md) with the exact candidate records
  found, so a human can resolve them with a real IPEDS id rather than a
  fuzzier matching rule.
- **14** admit-rate discrepancies over 10% between curated and Scorecard
  data, logged in [SCORECARD_DISCREPANCIES.md](SCORECARD_DISCREPANCIES.md).
  **The curated value was kept in every case** — Scorecard's number is
  stored under `college.scorecard` for reference only, never written over
  a curated field.
- No API key appears in any committed file, commit message, or log —
  checked explicitly before every commit.

## What changed, phase by phase

1. **Phase 1** ([SCORECARD_FEASIBILITY.md](SCORECARD_FEASIBILITY.md)) —
   confirmed the API is reachable and mapped its fields to our five known
   gaps (net price, net price by income band, graduation rate, undergrad
   enrollment, in/out-of-state tuition, admit rate as a cross-check). Also
   documented what Scorecard structurally cannot answer: a residency-split
   *full* cost of attendance (it only splits tuition), and an
   in-state/out-of-state admit-rate split.
2. **Phase 2** (`lib/types.ts`) — added `College.ipedsUnitId` and a
   `College.scorecard` namespace, structurally separate from every curated
   field so an import can never silently overwrite curated data. Each
   metric carries its own `{ value, provenance }` pair.
3. **Phase 3** (`scripts/import-scorecard.mjs`, `data/colleges.json`) — ran
   the import against the real API using the `SCORECARD_API_KEY` you
   supplied (confirmed working — 1,000 req/hour — before the full run).
   Fixed two matching bugs found live during the run (see below). Every
   imported value carries its own source + fetch-date provenance.
4. **Phase 4** (`components/CollegeProfileDashboard.tsx`) — surfaced Net
   Price and Graduation Rate on the at-a-glance strip (previously dropped
   entirely for lack of data), added Graduation Rate to Outcomes, and
   added a distinctly-labeled "Via College Scorecard" cost card next to
   (not merged into) the curated cost card. Deliberately did **not**
   surface Scorecard's admit rate on the page — the schema already scopes
   it to cross-check/reference only, and curated admit rate already covers
   every matched school. Verified in the browser (Stanford: all new
   elements render; Purdue, unmatched: no broken/empty boxes) and with
   `tsc --noEmit` + `next build`.

## Bugs found and fixed mid-run

Both confirmed live against the API, not assumed:

- **A literal comma in `school.name` 500s api.data.gov's gateway.** Every
  school with a comma in its curated name (UC/CSU campuses, "University of
  Maryland, College Park") failed with an HTML error body on the first
  pass. Scorecard also stores these with a hyphen, not a comma
  ("University of California-Berkeley"), so the fix strips the comma from
  the query and compares names after normalizing away commas/hyphens/
  parentheticals — an exact-match requirement is still enforced, so this
  can't produce a false match, only recognize a formatting difference.
- **A parenthetical annotation in our own curated name** (e.g. "New York
  University (NYU)", "Penn State University (University Park)") was sent
  literally in the search query, returning zero results for NYU. Same
  fix — stripped for search, and for the exact-match comparison. This
  resolved NYU; Penn State's University Park campus still isn't an exact
  match under any real name Scorecard uses for it, so it correctly stayed
  unmatched (see below).
- **Discrepancy check didn't guard against a null curated admit rate** —
  would have logged a fake 100% "discrepancy" for any future school
  missing that curated field. No current school hit this; fixed for
  re-runs.

The stale QUESTIONS.md entries these bugs produced on the first pass were
removed before the second pass ran, so QUESTIONS.md reflects only the
current, correct state.

## Unmatched schools (13) — genuinely ambiguous, not a bug

For each of these, the curated name doesn't identify a single Scorecard
record without guessing — either it names a public system with multiple
separately-IPEDS-reported campuses and no campus specified, or it's a real
naming collision. Full candidate lists are in QUESTIONS.md.

Columbia University · Purdue University · University of Washington ·
University of Michigan · University of Alabama · University of Pittsburgh
· University of Virginia · University of Florida · Ohio State University ·
Penn State University (University Park) · Arizona State University ·
Texas A&M University · Miami University

Three of these (Florida, Texas A&M, Penn State University Park) don't even
return their intended record in the API's own top-10 name+state search
results — so no purely mechanical matching rule would resolve all 13
without risking a wrong match elsewhere. Resolving any of them needs a
human to supply the exact Scorecard record name or IPEDS id.

## What Scorecard filled, and how completely

Of the 112 matched schools, every one got a value for all four gap
metrics: net price (overall + income-band breakdown), graduation rate,
tuition (in-state/out-of-state), and undergrad enrollment (already fully
curated, so not displayed — see Phase 4 notes above). Net price by income
band populated for all 112 as well.

## What Scorecard still can't fill (unchanged from Phase 1)

- A residency-split **full** cost of attendance (room/board included) —
  Scorecard only splits tuition by residency.
- An in-state/out-of-state **admit-rate** split — Scorecard reports one
  overall rate; the split we show is entirely hand-curated.
- Anything outside admissions/cost/completion/enrollment (flagship
  programs, career outcomes, campus vibe, application plans) — not in
  Scorecard's schema, untouched by this work.
