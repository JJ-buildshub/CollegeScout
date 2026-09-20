# dataProvenance.sourcedFrom audit

Per-record audit of every `dataProvenance.sourcedFrom` value in
`data/colleges.json`, following the fabricated "College Scorecard"
attributions found and removed (see the commit "Remove fabricated
'College Scorecard' source claims from curated data").

## Finding 1 — fabricated "College Scorecard" claims (fixed)

11 records claimed `"College Scorecard"` as a source for their curated
fields. This codebase had no College Scorecard integration at all until
Phase 1 of the Scorecard work; all 11 claims trace unchanged to the
initial commit. **Removed** — see the commit above for the full list
(Pomona College, Williams College, and 9 CSU campuses) and reasoning.

## Finding 2 — "IPEDS" as sole source, but the record carries a GPA value

**2 records** list `sourcedFrom: ["IPEDS"]` (IPEDS and nothing else) while
also reporting a mid-50% GPA range:

| School | Claimed source | Mid-50% Unweighted GPA | UC-Capped GPA | Mid-50% SAT |
|---|---|---|---|---|
| University of California, Davis | `["IPEDS"]` | 3.80 – 4.00 | 4.03 – 4.27 | N/A (Test-Free) |
| Columbia University | `["IPEDS"]` | 3.92 – 4.00 | N/A (Private) | 1500 – 1570 |

IPEDS's Admissions survey component does not collect high school GPA
distributions at all — that's a Common Data Set item (CDS section C11/C12),
not an IPEDS one. So for these two records, "IPEDS" alone cannot actually
be the source of the GPA figure shown, whatever it might be a legitimate
source for elsewhere in the same record (e.g. IPEDS does collect SAT/ACT
percentile ranges, so Columbia's SAT figure isn't necessarily implicated
by this same problem — only the GPA figure is).

This is a *structural* implausibility (the claimed source doesn't collect
the kind of data being attributed to it), not a provable-by-timeline
fabrication like Finding 1 — flagged for your review rather than
auto-removed.

## Finding 3 — CDS claimed as source, but no GPA/SAT data present (informational)

1 record — **Arizona State University** — lists
`sourcedFrom: ["Common Data Set (Institutional)", ...]` but has no GPA or
SAT data at all (`"N/A (Not reported)"` for both). Not a false-attribution
problem the way Findings 1–2 are (a CDS source not yielding a field isn't
implausible — many CDS forms have gaps), but noted since it's the one case
where the claimed source and the actual data diverge in the other
direction. Arizona State is also one of the 13 still-unmatched Scorecard
schools.

## Everything else checked, no problem found

- Checked every record with `"Institutional Website"` in `sourcedFrom`
  against whether the record actually has a `website` URL populated — **0
  mismatches** (every record claiming an institutional website as a source
  has a website on file).
- No other `sourcedFrom` combination showed a similar structural mismatch
  between the claimed source and the fields it would need to explain.

This audit did not attempt to verify that "IPEDS", "Common Data Set
(Institutional)", "CDS", or "Institutional Website" claims are *actually*
correct (i.e. that someone really did check that source) — only that
they aren't structurally impossible the way "College Scorecard" and the
two IPEDS/GPA cases were. Per the Tier 1 finding from the earlier source
investigation, 104 of 125 records still have no real evidence beyond a
generic label and a creation-date timestamp — see the prior discussion
for that breakdown.
