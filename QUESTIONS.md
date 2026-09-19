# Questions / decisions I couldn't make safely

Autonomous overnight run started 2026-09-18. Anything below needs your
input; everything not blocked by it kept moving.

## 1. No real College Scorecard API key available — resolved

You supplied a real `SCORECARD_API_KEY` in the environment (1,000
req/hour, confirmed live), so the full import ran to completion instead of
being DEMO_KEY-rate-limited. Original note preserved for context: only
`DEMO_KEY` was available at the time Phase 1 ran, and registering for a
real key requires submitting an email to a third party — a real-world
action I wouldn't take on your behalf without asking.

## 2. 13 schools left unmatched — resolved, all confirmed by hand

These were genuinely ambiguous by name+state alone: either the curated
name names a public system with multiple separately IPEDS-reported
campuses (no campus specified), or a real naming collision. Left
unmatched rather than guessing which campus/record was meant — you then
reviewed the candidate lists (with city + enrollment) and confirmed the
exact IPEDS id for each, which were wired in directly (bypassing
name-matching entirely) and imported:

- **Columbia University** → Columbia University in the City of New York, id 190150 (of 2 candidates — the other was Teachers College, a separate affiliated graduate school).
- **Purdue University** → Purdue University-Main Campus, id 243780.
- **University of Washington** → University of Washington-Seattle Campus, id 236948.
- **University of Michigan** → University of Michigan-Ann Arbor, id 170976.
- **University of Alabama** → The University of Alabama, id 100751.
- **University of Pittsburgh** → University of Pittsburgh-Pittsburgh Campus, id 215293.
- **University of Virginia** → University of Virginia-Main Campus, id 234076.
- **University of Florida** → University of Florida, id 134130.
- **Ohio State University** → Ohio State University-Main Campus, id 204796.
- **Penn State University (University Park)** → Pennsylvania State University-Main Campus, id 214777.
- **Arizona State University** → Arizona State University Campus Immersion, id 104151 (the physical Tempe campus, as opposed to the separately-reported "Digital Immersion"/ASU Online record).
- **Texas A&M University** → Texas A&M University-College Station, id 228723. This one never appeared in the name+state search at any page size tried (up to 30 results) — confirmed separately that a literal "&" in the query wrecks Scorecard's own search relevance (querying "Texas A&M University" returns ten unrelated Texas schools; querying "Texas AM University" surfaces the correct record at position 6). Fixed in the script for future imports; this record itself was wired in directly by id since even the fixed query wouldn't auto-resolve it (the true record name, "...-College Station", still isn't an exact match to our bare curated name, same as every other school on this list).
- **Miami University** → Miami University-Oxford, id 204024.

None of the 13 differ from curated by more than the 10% discrepancy
threshold (largest: University of Michigan and Virginia, both ~7-8%) —
see SCORECARD_DISCREPANCIES.md, which was not updated since nothing
crossed the threshold.
