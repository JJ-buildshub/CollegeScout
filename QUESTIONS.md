# Questions / decisions I couldn't make safely

Autonomous overnight run started 2026-09-18. Anything below needs your
input; everything not blocked by it kept moving.

## 1. No real College Scorecard API key available

Only `DEMO_KEY` is available (nothing found in the environment or any
`.env` file). It is rate-limited to 10 requests/hour (confirmed live via
response headers), so a full 125-school import takes roughly half a day
even with the import script pacing itself correctly and running unattended
overnight.

Registering for a real key means submitting an email address to
`api.data.gov/signup` — a real-world action on an external service, which
I won't do on your behalf without asking. The signup is free and instant
(no approval wait, no confirmation email needed to get the key).

**What I need from you:** if you want the remaining schools imported
quickly rather than over many hours, grab a free key at
https://api.data.gov/signup/ and set it as `SCORECARD_API_KEY` in your
shell environment, then re-run:

```
node scripts/import-scorecard.mjs
```

It's idempotent — already-imported schools are skipped (matched via the
stored `ipedsUnitId`), so re-running only fetches what's still missing.

<!-- Import-time entries (unmatched schools, ambiguous name/state matches)
     are appended below by scripts/import-scorecard.mjs as it runs. -->
