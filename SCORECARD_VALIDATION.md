# College Scorecard validation — UC 2024 cross-check

## The cross-check

UC publishes its own admit rates by campus and year. For 2024, UC's own
figures (as relayed by the user from UC's official release — not yet
independently confirmed against the primary dashboard table by us; see
"On sourcing" below) line up almost exactly with College Scorecard's 2024
figures already in `data/colleges.json`:

| Campus | UC's own 2024 rate | College Scorecard 2024 | Difference |
|---|---|---|---|
| University of California, San Diego | 26.8% | 26.7% | 0.1 pts |
| University of California, Santa Barbara | 32.9% | 33.0% | 0.1 pts |
| University of California, Irvine | 28.8% | 28.6% | 0.2 pts |
| University of California, Davis | 42.1% | 41.8% | 0.3 pts |
| University of California, Riverside | 77.2% | 76.4% | 0.8 pts |
| University of California, Santa Cruz | 65.0% | 65.8% | 0.8 pts |

Six for six, all within 1 point — two independent sources (a federal
dataset built from IPEDS reporting, and UC's own direct release) agreeing
this closely is strong evidence Scorecard's 2024 admit rates are accurate
for these campuses, not just recent.

## What this settles

This is the evidence for treating College Scorecard as the trustworthy
default in `SOURCE_HIERARCHY_PLAN.md`. It also reframes the gap already
documented in `SCORECARD_DISCREPANCIES.md` and `ROUND_NUMBER_AUDIT.md`:
for these six schools, the curated figure isn't just older or rounded —
it's wrong. Curated Santa Cruz (47.0%) sits **18 points** below both
Scorecard (65.8%) and UC's own figure (65.0%); curated Riverside (68.0%)
sits 8-9 points below both. Two sources landing within a point of each
other and a third sitting 8-18 points away is a real discrepancy in the
third source, not sampling noise or a stale-but-reasonable estimate.

## On sourcing

The UC 2024 figures above were relayed by the user from UC's official
release; we have not yet independently pulled them from UC's primary
Information Center dashboard table (that pull is still pending — see
QUESTIONS.md and the ongoing UC residency-split sourcing effort). Treat
this cross-check as strong corroborating evidence, not yet a Tier 1
citation in its own right — it will be superseded once the primary
dashboard pull happens and the real citation (URL + retrieval date) can
be recorded properly.
