# Copy review notes

Findings and options for copy that reads as off — collected here rather
than fixed unilaterally, since wording is a judgment call. Add to this
file as more come up.

## Find My Fit subtitle (app/matcher/page.tsx)

Current: *"Compare admissions selectivity and calculate your weighted
profile. Includes specialized tools for California (UC Capped GPA)
alongside national admissions data."*

Reads as generated rather than written — "Compare admissions
selectivity," "specialized tools," "national admissions data" are the
kind of filler phrasing that doesn't actually tell a student what the
page does. Left in place for now per instruction; only the factual error
was fixed (it said "UC/CSU Capped GPA" — CSU isn't UC-capped in this
app; `usesUcCappedMetric` in lib/gpa.ts only ever returns true for
`system === "UC"`, and CSU is deliberately treated like Private/
Out-of-State Public for GPA purposes, per the commit that fixed this
same conflation on the profile pages).

**Three plain alternatives**, in the spirit of "Enter your GPA and see
where you stand at each school: likely, target, or reach":

1. "Enter your GPA and course rigor, then see which schools are a
   likely, target, or reach fit for you."
2. "Calculate your weighted GPA and compare it to each school's
   admitted range — includes a UC-Capped GPA calculator for California
   applicants."
3. "See where your GPA stands at each school: Likely, Target, or Reach
   — plus a UC-Capped GPA calculator if you're applying to a UC."

## Sticky-header title check

Checked whether "Find My Fit" (the page's `<h1>`) renders hidden under
the sticky nav header on first load. It doesn't, and there's no bug to
fix: the nav (`components/NavBar.tsx`) uses `position: sticky`, which
occupies real space in normal document flow and only "sticks" once
scrolled past — it never overlays unscrolled content. Confirmed live
against the running dev server: the only other sticky element on the
page is the GPA calculator's desktop sidebar (`lg:sticky lg:top-20`),
which is below the `<h1>` in the DOM and only activates on scroll at
`lg` breakpoints and up. No negative margins, `fixed`/`absolute`
positioning, or global scroll-padding hacks exist anywhere near the
title. Recorded here rather than silently left unaddressed, since
"checked, not broken" is a different outcome than "not checked."
