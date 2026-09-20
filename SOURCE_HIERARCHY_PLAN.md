# Source hierarchy plan

Planning only — nothing in this document is implemented yet. Decision
context: curated data stays (not removed), but gets labeled honestly.
Three open decision points are called out explicitly where this plan
can't responsibly choose for you.

## 1. The hierarchy

**Tier 1 — University-reported (hand-sourced).** Highest trust. A field
is Tier 1 only when its corresponding `*Provenance` object (see §2) holds
a real citation you entered yourself — a specific document, page, and
date. Starts empty (0/125 today) and grows one field at a time as you
verify schools.

**Tier 2 — College Scorecard.** Displayed default for every field it
covers, once no Tier 1 override exists for that field on that school. A
federal source, systematically fetched, every value dated to a real
confirmed award year (currently 2024 for all 125 schools — see the
"Capture Scorecard's real award year" commit).

**Tier 3 — Curated, unverified.** Displayed only for fields Scorecard
structurally cannot cover, and only when no Tier 1 override exists.
Carries the unverified label from §3.

### Field-by-field mapping

| Field | Tier 2 (Scorecard) available? | Notes |
|---|---|---|
| Admit rate (overall) | Yes — `scorecard.admitRateOverall` | All 125 schools matched; becomes the displayed default. |
| Graduation rate | Yes — `scorecard.graduationRate` | 6-yr completion rate. |
| Undergrad enrollment | Yes — `scorecard.undergradEnrollment` | **Behavior change flagged below** — curated enrollment is already 100% populated (125/125) and currently displayed; this hierarchy would switch the displayed number to Scorecard's even where curated already has a value. |
| Net price (overall + by income band) | Yes — `scorecard.netPriceOverall` / `netPriceByIncomeBand` | Already Tier 2 in practice since Phase 4. |
| Tuition (in-state / out-of-state) | Yes, but **tuition only** — `scorecard.tuitionInState/OutOfState` | **"Cost of attendance" precision issue** — see below. |
| **Cost of attendance (full, incl. room/board)** | **No** | Scorecard has no residency-split full-COA field at all (confirmed in Phase 1). The curated `financials.coaInState/coaOutOfState` figures are the only source of a full COA number and stay Tier 3 (unverified) unless hand-sourced. Listing "cost of attendance" as Scorecard-covered overstates what Scorecard can do — what it actually covers is tuition (a component of COA) and net price (a different, arguably more useful, post-aid figure). Recommend treating "net price" and "tuition" as the two Tier 2 cost fields, and full COA as a separate Tier 3 field, rather than implying Scorecard replaces curated COA. |
| **Median earnings** | **Not yet imported** | Scorecard does publish post-graduation earnings (`latest.earnings.*`), but `scripts/import-scorecard.mjs` never fetches it — `ScorecardData` has no earnings field today. Treating this as Tier 2 now would be describing data we don't have. Needs a new field mapping + re-run before it can join the hierarchy; until then `careerOutcomes.medianStartingSalary` stays Tier 3. |
| GPA (unweighted, UC-capped) | No | Not an IPEDS/Scorecard data element at all (confirmed in the sourcedFrom audit). Tier 3 only, or Tier 1 once hand-sourced. |
| SAT range | No | Same — Tier 3 or Tier 1. |
| In-state / out-of-state admit rate | No | Scorecard reports one overall rate only, no residency split. Tier 3 or Tier 1. |
| Programs (flagship programs, impacted majors, career/major tags) | No | Outside Scorecard's schema entirely. |
| Career outcomes — placement rate | No | Not a Scorecard field. |
| Campus details (setting, Greek life %, % living on campus) | No | Not Scorecard fields. |
| Test policy | No | Not a Scorecard field; categorical, not numeric — see the open question in §4. |

## 2. What promoting a field to Tier 1 looks like

The schema already has exactly the mechanism needed — it's just unused.
`College` has `admissionsProvenance`, `gpaSatProvenance`, `costProvenance`,
and `outcomesProvenance` (each `{ source?: string; year?: string }`),
currently populated on **0 of 125** records. Promoting a field to Tier 1
is nothing more than actually filling one of these in with a real
citation — no new schema needed.

**Example — hand-sourcing UC Davis's GPA/SAT figures**, one of the two
records flagged in SOURCE_AUDIT_FINDINGS.md as claiming an IPEDS source
that structurally can't back a GPA number:

```diff
  {
    "id": "uc-davis",
    "mid50_GPA_Unweighted": "3.80 - 4.00",
    "mid50_GPA_UCCapped": "4.03 - 4.27",
+   "gpaSatProvenance": {
+     "source": "UC Davis Common Data Set 2024-2025, Section C11/C12 (read directly)",
+     "year": "2024-25"
+   },
    ...
  }
```

Display logic then becomes a simple three-way check per field group:
`gpaSatProvenance` populated → Tier 1 (trusted, no unverified label, show
the real citation as the source line, same as Phase 4 already does for
Scorecard fields). Not populated, but Scorecard covers this field →
Tier 2. Neither → Tier 3, unverified label shown.

The same pattern applies to `admissionsProvenance` (in/out-of-state admit
rate split), `costProvenance` (full COA), and `outcomesProvenance`
(placement rate, median salary once Scorecard earnings aren't covering
it). One field group promoted at a time, independently, exactly matching
how you said you'd hand-source school by school.

## 3. Labeling unverified values

Goal restated: visible, not alarming, not shouted on every number, and
readable to both a 16-year-old and a parent without the word
"directional."

**Three wording options:**

1. **"Approximate — not yet confirmed"** — closest to your literal
   description ("approximate, source not confirmed"). Slightly longer,
   but unambiguous about *why* it's flagged.
2. **"Unconfirmed estimate"** — shorter, same meaning, reads a little more
   like a label/badge than a sentence.
3. **"Best available estimate"** — softer tone, frames it as "this is our
   best number, not a lie" rather than "we don't trust this" — trades a
   little precision for being less likely to read as a warning.

Recommend (1) or (2) over (3): (3) is friendlier but doesn't actually
tell the reader that the *source* is the problem, and could read as
false reassurance ("best available" sounds pretty confident). (1) and (2)
both name the real issue in plain words.

**Display mechanics (reusing what's already on the page):**
`CollegeProfileDashboard.tsx` already has a muted, small (`text-[11px]
text-slate-400`) `SourceLine` component that shows real source/year text
only when it exists, and shows nothing when there's genuinely nothing to
say. Recommend reusing that exact visual treatment for the unverified
label — same size, same muted gray, same "only render when relevant"
rule — rather than a new badge, icon, or color. It already satisfies
"visible but not alarming": it's real text a reader can notice if they
look, not a warning icon or red flag, and it doesn't compete visually
with the number itself.

## 4. Direct answers

**Which fields on a typical (not-yet-hand-sourced) profile carry the
label?** Under this hierarchy, only 5 fields flip to Tier 2 automatically
(admit rate, net price, graduation rate, enrollment, tuition) — every
other field on the page is either Tier 3 today. That's most of a profile:
GPA range, SAT range, in-state/out-of-state admit rate split, full cost
of attendance, flagship programs, career outcomes (placement rate,
median salary), campus details, and test policy would all carry the
unverified label until you hand-source them. Worth being upfront about:
this makes the *majority* of a typical profile page show the label on
day one, not a handful of edge cases. That's an honest reflection of
where the data actually stands, but it's a real UX weight to plan for —
happy to talk through pacing (e.g. hand-source your top N schools first
so at least the most-viewed profiles look mostly Tier 1/2) if that's a
concern once you see it rendered.

**What would the 9 schools >10% off display, and what changes in the
Matcher?**

*Display:* all 9 would show Scorecard's higher, less-selective number
instead of the curated round figure — e.g. UC Santa Cruz would show
65.8% instead of 47.0%, Cal Poly Pomona 75.2% instead of 55.0%. All 9 of
the >10%-gap schools move in the *same direction* (Scorecard's rate is
higher in all 9), so switching the display makes every one of them look
more accessible than the current page suggests.

*Matcher — open decision, not resolved here:* the Matcher's fit
classification (`lib/gpa.ts`) currently uses curated
`admitRateOverall`/`inStateAdmitRate`/`outOfStateAdmitRate` and was
deliberately kept that way when Scorecard was added in Phase 4 (Scorecard
was "cross-check only, never fed into Matcher fit logic," per
SCORECARD_FEASIBILITY.md). This plan's hierarchy pulls in the opposite
direction for the *overall* rate — Scorecard becomes the trusted display
default — so there's now a real tension:
  - **Leave the Matcher as-is (curated-driven):** consistent with today's
    residency-aware fit logic (Scorecard has no in/out-of-state split at
    all, so it can't replace curated for that half of the Matcher's job
    regardless). Downside: for these 9 schools, a student could see one
    number on the school's own profile (Scorecard's) and a different one
    driving their Safety/Target/Reach placement (curated) — a visible
    inconsistency, worse than either number being wrong alone.
  - **Switch the Matcher's *overall* classification to Scorecard, keep
    curated for the in/out-of-state split:** consistent display, but
    means the tool's actual guidance changes for these 9 schools — all 9
    would look more reachable than they do today, which is a real change
    to the advice given to a student, not just a cosmetic one.
  This is a judgment call about what the Matcher is *for* (a
  best-available-data planning tool vs. matching the profile page
  number-for-number), not something to default on your behalf. Flagging
  for your call before any implementation.

**Should the Matcher say something when a fit estimate rests on an
unverified GPA range?** Recommend yes, using the same §3 label — but
flagging the scale problem plainly: **0 of 125 schools currently have
`gpaSatProvenance` populated**, so today this note would appear on
essentially *every* Matcher result, not a handful. That's accurate (none
have been hand-verified yet) but is in real tension with "shouldn't
shout on every number." Two ways to handle the rollout, your call:
  - Show it everywhere now — fully honest, but the Matcher's dominant
    visual experience for a while is "here's an estimate we haven't
    checked."
  - Hold it back until some real share of schools are hand-verified
    (e.g. only start showing it once fewer than half the results would
    carry it), so it reads as a meaningful flag on the *remaining*
    unverified schools rather than blanket noise. Downside: schools you
    haven't gotten to yet would silently look no different from ones you
    have, until the threshold trips.
