# CollegeScout

A free college research site for US high school students, built with Next.js
(App Router), TypeScript, Tailwind CSS and Lucide icons. Live at
[collegescout.app](https://collegescout.app).

It covers **336 colleges** across 50 states and DC — 173 out-of-state public,
138 private, 16 CSU and 9 UC campuses — chosen from federal IPEDS data by size
and programmes offered.

## Pages

1. **Explore Colleges** (`/directory`) — search and filter all 336 schools by
   state, system, testing policy and admit rate. Each profile covers
   preparation, admissions, applying, academics, cost, financial aid and
   campus.
2. **My Fit** (`/matcher`) — enter unweighted GPA plus honors/AP/IB coursework
   to calculate the UC-capped weighted GPA (bonus points capped at 8
   semesters), then see every school sorted into Reach / Target / Likely, based
   on GPA position within the school's mid-50% band and its admit rate.
3. **My Plan** (`/checklist`) — a grade-specific action plan across academics,
   testing, extracurriculars, college research and financial planning.

Everything a student enters stays in their own browser. There are no accounts
and nothing is uploaded.

## Getting started

Requires Node.js 18.18+ (LTS recommended).

```bash
npm install
npm run dev
```

Then open http://localhost:3100.

Note: `next build` and `next dev` share the `.next` directory, so stop the dev
server before building or the running server will die mid-build.

## Data

School data lives in `data/colleges.json`, from Common Data Sets, IPEDS, the
US Department of Education's College Scorecard and schools' own admissions
pages.

Fields carry their own provenance rather than the record being trusted as a
whole, so the site can say which figures have been checked against a school's
own page and which haven't. Anything unverified renders as "Not confirmed yet"
instead of being presented as fact.

Current coverage, out of 336:

| Field | Sourced |
| --- | --- |
| Application plans and deadlines | 331 |
| Testing policy | 332 |
| Admissions | 336 |
| Cost | 208 |
| GPA / SAT | 158 |
| Career outcomes | 0 |

Career outcomes are **not displayed**. Every figure the site held was
unsourced, so the section was removed rather than shipped unverified; the nine
College Scorecard earnings figures that do carry a source are retained in
`careerOutcomes.earnings` for when the section returns. Note that those measure
median earnings 10 years after entry, not a first-job starting salary.

Verification runs in batches. `data/reviewed-*.json` holds, for each school, a
quote from its own page and the URL that quote sits on;
`scripts/check-reviewed-*.mjs` re-fetches every page and confirms the quote is
still there, word for word; `scripts/apply-reviewed-*.py --apply` writes the
result into `colleges.json`. Entries on pages that block automated reading are
marked `manual` and are skipped by the checker.

The check proves a sentence exists on a page. It cannot prove the sentence means
what we took it to mean, and that is where the real errors live. Every one of
these was a real, verbatim, on-page sentence that would have produced a wrong
record: a deadline that governed international applicants, a "regular decision"
date that was a scholarship deadline, a testing requirement that applied only to
home-schooled applicants, a page still showing the previous cycle, a policy
stated only on a Spanish-language page. A quote that passes the checker still
needs a person to read what it governs.

Where a school contradicts itself, the admissions site wins over the catalog —
catalogs routinely carry pre-2020 text. Where a school publishes nothing, the
record says so rather than inheriting a plausible date from elsewhere.
