# Data methodology notes

Standing decisions about what our fields mean, so they're applied the
same way for every school rather than decided ad hoc per record. Add to
this file — don't just decide something once and move on — whenever a
genuinely ambiguous definition comes up while sourcing data.

## "Out-of-state admit rate" means domestic non-resident, not blended with international

`College.outOfStateAdmitRate` (and the "Out-of-State" figure shown on
profiles and used by the Matcher) means **domestic non-resident** —
a U.S. student who is not a resident of the school's home state.
It does **not** include international applicants, even when a school's
own reporting bundles "non-resident" into a single domestic+international
figure.

**Why:** CollegeScout's users are U.S. high school students (or their
parents) planning where to apply. A domestic out-of-state applicant
should see the admit rate for applicants like them — not a figure diluted
or skewed by a separate international applicant pool that follows a
different admissions process (different application requirements,
financial aid treatment, and often a materially different admit rate).

**How to apply:** Whenever a source reports admissions broken out by more
than two residency categories — the College Board and most institutional
sources use exactly this 3-way split: **resident / domestic non-resident
/ international** (UC's own systemwide reporting is a direct example —
see the UC sourcing pass below) — use the domestic non-resident figure
for `outOfStateAdmitRate`, and discard or ignore the international figure
entirely for this field. If a source only publishes a single blended
non-resident number with no way to separate international from domestic,
that source cannot back `outOfStateAdmitRate` under this definition —
leave the field `null` (or keep it as an unverified estimate, clearly
labeled) rather than substitute the blended figure, since a blended
number silently violates this definition rather than just being
imprecise.

This applies to every school being hand-sourced, not just UC — if a
private school's Common Data Set or admissions office reports resident/
non-resident/international separately, the same rule applies.

## Precedent for this file

Established while hand-sourcing the 9 UC campuses' residency splits
(2026-09-18) — see `admissionsProvenance` on each UC record for the
citation this definition was first applied to.
