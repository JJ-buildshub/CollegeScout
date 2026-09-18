# Phase 1 — College Scorecard Feasibility

## Reachability

Confirmed live against the real API, not from memory:

```
curl "https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=DEMO_KEY&school.name=Harvard+University&fields=id,school.name,school.state"
-> HTTP 200, {"metadata":{"page":0,"total":1,"per_page":20},"results":[{"school.name":"Harvard University","school.state":"MA","id":166027}]}
```

Network access to `api.data.gov` is not blocked. Proceeding with Phases 2-4.

## Critical constraint: no real API key available

No `SCORECARD_API_KEY` (or similar) was found in the environment or in any
`.env` file in this repo. The only key available is the public `DEMO_KEY`,
which is real-world rate-limited to **10 requests/hour** (confirmed via the
`X-Ratelimit-Limit`/`X-Ratelimit-Remaining` response headers on a live call —
not a documented number taken on faith).

At 1 request per school (see "Matching strategy" below), importing all 125
schools needs ~125 requests, which is roughly 12+ hours at DEMO_KEY's rate,
before accounting for retries. I can't register a real key on your behalf —
`api.data.gov/signup` requires submitting an email address as a real-world
action, which is outside what I'll do autonomously. **This is logged to
QUESTIONS.md.** A free key from https://api.data.gov/signup/ is instant (no
approval wait) and raises the limit to 1,000/hour; dropping it in as
`SCORECARD_API_KEY` before re-running `scripts/import-scorecard.mjs` would
finish the remaining schools in minutes instead of hours.

Given the overnight window, `scripts/import-scorecard.mjs` is written to
pace itself under the DEMO_KEY limit (with a safety margin) and run
unattended for as many hours as it takes, saving progress after every school
so a partial run is never lost. It was started in the background at the end
of Phase 3 and will keep matching/importing schools using whichever key is
available for as long as it runs.

## Field mapping

| Our gap | Scorecard field(s) | Notes |
|---|---|---|
| Net price (overall) | `latest.cost.avg_net_price.overall` (falls back to `.public`/`.private` depending on control type) | Average net price after grant/scholarship aid, all students, most recent reporting year available. |
| Net price by income band | `latest.cost.net_price.public.by_income_level.*` / `.private.by_income_level.*` | Scorecard has two overlapping banding schemes in the data dictionary (a 5-band `0-30000`/`30001-48000`/`48001-75000`/`75001-110000`/`110001-plus` scheme, and an older 3-band scheme). The import stores whichever bands actually have non-null values for that school/year, keyed by Scorecard's own band strings, and records which scheme populated. |
| Graduation rate | `latest.completion.completion_rate_4yr_150nt` (4-year institutions) or `latest.completion.completion_rate_less_than_4yr_150nt` (schools predominantly awarding sub-bachelor's credentials) | The standard 150%-of-normal-time ("6-year") completion rate IPEDS/Scorecard use as *the* graduation rate figure. |
| Undergrad enrollment | `latest.student.size` | Degree/certificate-seeking undergraduate headcount. |
| In-state / out-of-state cost | `latest.cost.tuition.in_state` / `latest.cost.tuition.out_of_state` | **Tuition only.** Scorecard's full cost-of-attendance field (`latest.cost.attendance.academic_year`) is a single blended figure — it is not split by residency anywhere in the schema. We cannot fill a residency-split *full COA* gap from this source; only a residency-split *tuition* gap. Displayed and stored as tuition, never conflated with `financials.coaInState`/`coaOutOfState`. |
| Admit rate | `latest.admissions.admission_rate.overall`, falling back to `latest.admissions.admission_rate.by_ope_id` when `.overall` is null (seen on at least one real school this session) | Used only as a cross-check against our curated `admitRateOverall`/`inStateAdmitRate`/`outOfStateAdmitRate` — never fed into Matcher fit logic, per your instruction not to touch that code. Scorecard does not report an in-state/out-of-state admit-rate split at all, so it can't fill that specific gap (we already have it hand-curated for 101/125 schools). |

## Gaps Scorecard cannot fill

- **Residency-split full cost of attendance** (room/board included) — only tuition is split by residency; see above.
- **In-state/out-of-state admit rate** — Scorecard only reports one overall admit rate per school; the residency split we already have is entirely hand-curated.
- Anything outside admissions/cost/completion/enrollment (flagship programs, career outcomes/top recruiters, campus vibe, ideal-student archetype, application plans) — not in Scorecard's schema at all; stays hand-curated, untouched by this work.
