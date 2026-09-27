# Verification batch 7 — proposal (quotes checked, not applied)

Checked 2026-09-23 against each school's own official pages for the 2026-27 cycle
(fall 2027 entry). Nothing has been written to `data/` — these live in
`batch-7-proposed-deadlines.json` and `batch-7-proposed-test-policies.json`, ready
to merge into the `schools` object of the matching `data/reviewed-*.json` file
once you approve.

**Coverage: 30 schools' testing policies, 5 schools' application plans.**

Quote check via `scripts/page-check.mjs`: **11 of 11** deadline lines and **46 of
46** testing lines matched their live page word for word. Only Dartmouth and
Caltech carry `manual: true` (site refuses automated requests / JS-rendered) —
everything else is machine-verifiable.

---

## 1. The big one: 10 CSU campuses are labelled Test-Optional and shouldn't be

CSU's own system-wide page says:

> "The California State University (CSU) no longer uses ACT or SAT examinations in
> determining admission eligibility for all CSU campuses."

We currently tell students these ten campuses are **Test-Optional**, which implies
a good score could help them get in. It can't — CSU doesn't look at scores for
admission at all.

Fullerton · Sacramento · Northridge · Cal State LA · San Francisco State · Sonoma ·
East Bay · Fresno · Chico · Cal Poly Humboldt

This is the correction in this batch that actually changes what a student would do:
someone could sit an SAT, or hold back an application, believing it matters at a CSU.

**One nuance, quoted on the same page:** scores are still used *after* acceptance —
"ACT or SAT test scores can be used as one of the measures to place students in the
proper mathematics and written communication courses." So a student may still have
a reason to send scores; it just has nothing to do with getting in. Worth surfacing
in the UI rather than flattening to "blind".

## 2. Terminology: Test-Free vs Test-Blind across UC and CSU (your call)

The other 14 UC/CSU campuses are stored as **Test-Free**; I've proposed
**Test-Blind** for consistency with the evidence.

Per `README-for-chatgpt.md`, `Test-Free` means *the school calls itself
"test-free"*, while `Test-Blind` means *scores are not viewed or considered at all*.
Neither UC's nor CSU's page uses the phrase "test-free" — both say scores aren't
considered. So the quotes support Test-Blind by our own definitions.

This is terminological, not substantive: identical outcome for a student. If you
have a page where UC or CSU self-describes as test-free, flip it back — the quotes
stand either way. **Applying this as-is changes the label shown on 24 school
profiles**, so it deserves a deliberate yes rather than a silent merge.

UC's system-wide statement:

> "UC will not consider SAT or ACT test scores when making admissions decisions or
> awarding scholarships."

## 3. Scripps College: three wrong dates

| | Stored | Scripps' own page |
|---|---|---|
| Early Decision I | November 15 | **November 16** |
| Early Decision II | January 8 | **January 14** |
| Regular Decision | January 8 | **January 14** |

ED II and Regular Decision are off by six days. The stored values look carried over
from Pomona, which really does use January 8 for both — an easy slip between two
Claremont colleges sitting next to each other in the data.

## 4. Confirmed as already correct

| School | Plans | Testing |
|---|---|---|
| USC | ED Nov 1 (binding), EA Nov 1, RD Jan 10 | Test-Optional |
| Dartmouth | ED Nov 1 (binding), RD Jan 1 | Test-Required |
| Caltech | REA Nov 1, RD Jan 4 | Test-Required |
| Pomona | ED Nov 8 (binding), ED2 Jan 8 (binding), RD Jan 8 | Test-Optional |
| Northeastern | *(not verified)* | Test-Optional |

Not a null result — these move from carried-forward-but-unsourced to confirmed
against a dated, quoted official page.

### Details worth keeping

- **USC** runs ED and EA on the same November 1 date, and its page says
  "November 1, 2026", confirming the cycle outright. Performing-arts majors have a
  single December 1 Regular Decision deadline rather than January 10; that sits in
  the plan's `note` rather than as a separate plan.
- **Caltech** has no Early Decision round — REA and RD only. Its testing page is
  headed "Caltech Testing Deadlines for Fall 2027 Entry", so the cycle is explicit.
  Scores go into bands ("Bucket A/B") rather than always being shown to the committee.
- **Caltech page typo:** its Regular Decision paragraph says admitted students have
  "until May 1, 2026"; the REA paragraph says May 1, 2027. Caltech's own error for
  this cycle. It doesn't touch either application deadline, so nothing changed here.
- **Pomona and Scripps** each share one date between ED II and Regular Decision; the
  difference is that ED II binds. Neither offers Early Action.
- **Dartmouth** reactivated its testing requirement starting with the Class of 2029,
  so it is in force this cycle.
- **UC** notes SAT/ACT scores may only be reported in the application
  post-submission.

## 5. Not verified — do not guess these

| School | Why |
|---|---|
| Northeastern (deadlines) | Its first-year page states the testing policy but no application deadlines. |
| Purdue | `admissions.purdue.edu/become-student/deadlines/` renders no dates into the DOM at all, in a real browser, after scrolling. Nothing quotable. |
| Santa Clara | `scu.edu/admission/undergraduate/apply/dates-and-deadlines/` returns the site's error page. |
| Georgia Tech | `admission.gatech.edu/first-year/deadlines-requirements/` 404s; real path not located. |
| Chapman | Says "Chapman is test optional for most applicants" — left out rather than guess the exception. |
| Harvey Mudd, Claremont McKenna, Tufts, RPI, LMU, Pepperdine, Pacific, USF | Pages refuse automated requests; not yet retried in a browser. |

## To apply

1. Decide the Test-Free vs Test-Blind question in §2 before merging.
2. Merge each file's `schools` entries into the matching `data/reviewed-*.json`.
3. Re-run `node scripts/check-reviewed-deadlines.mjs` and
   `node scripts/check-reviewed-test-policies.mjs`.
4. `python scripts/apply-reviewed-deadlines.py` (dry run), then `--apply`; same for
   `apply-reviewed-test-policies.py`.
