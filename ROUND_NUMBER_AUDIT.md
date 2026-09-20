# Round-number admit rate audit

64 of 125 curated `admitRateOverall` values are exact whole percentages
(11.0%, 24.0%, 68.0%, etc.). A real admit rate — admits ÷ applicants —
essentially never lands on a round number; this is the signature of an
estimated or rounded figure rather than one read off a primary source.
Per instruction, every round-number admit rate is treated as **unverified
until sourced**, regardless of how close it happens to land to Scorecard's
figure below.

All 64 now have a matched Scorecard 2024 admit rate to compare against —
the 13 schools that were unmatched when this audit was first written have
since been hand-confirmed and imported (see QUESTIONS.md). Sorted by
percent difference, largest first.

| School | Curated (round) | Scorecard 2024 | % difference |
|---|---|---|---|
| University of California, Santa Cruz | 47.0% | 65.8% | 40.0% |
| California State Polytechnic University, Pomona | 55.0% | 75.2% | 36.7% |
| University of California, Irvine | 21.0% | 28.6% | 36.0% |
| University of California, Santa Barbara | 26.0% | 33.0% | 26.8% |
| California State University, Long Beach | 40.0% | 46.3% | 15.7% |
| University of California, Davis | 37.0% | 41.8% | 13.1% |
| San Jose State University | 75.0% | 84.6% | 12.8% |
| University of California, Riverside | 68.0% | 76.4% | 12.3% |
| University of California, San Diego | 24.0% | 26.7% | 11.3% |
| Georgia Institute of Technology | 13.0% | 14.1% | 8.2% |
| University of Texas at Austin | 29.0% | 26.6% | 8.1% |
| California Polytechnic State University, San Luis Obispo | 29.0% | 31.3% | 8.0% |
| University of Michigan | 17.0% | 15.6% | 8.0% |
| Santa Clara University | 52.0% | 48.0% | 7.7% |
| Syracuse University | 43.0% | 45.9% | 6.8% |
| University of Washington | 42.0% | 39.1% | 6.8% |
| San Diego State University | 34.0% | 36.2% | 6.4% |
| Carnegie Mellon University | 11.0% | 11.7% | 6.0% |
| Claremont McKenna College | 10.0% | 9.6% | 4.1% |
| University of California, Merced | 88.0% | 90.5% | 2.9% |
| Harvey Mudd College | 13.0% | 12.7% | 2.6% |
| Texas Christian University | 44.0% | 44.5% | 1.1% |
| Clemson University | 38.0% | 38.3% | 0.9% |
| University of Illinois Urbana-Champaign | 42.0% | 42.4% | 0.9% |
| Rensselaer Polytechnic Institute | 64.0% | 63.5% | 0.8% |
| Scripps College | 38.0% | 38.3% | 0.8% |
| Texas A&M University | 57.0% | 57.4% | 0.8% |
| University of Connecticut | 52.0% | 52.4% | 0.8% |
| University of San Diego | 52.0% | 52.4% | 0.7% |
| Penn State University (University Park) | 61.0% | 60.6% | 0.7% |
| Ohio State University | 61.0% | 60.6% | 0.7% |
| Chapman University | 65.0% | 65.4% | 0.7% |
| University of Delaware | 71.0% | 70.6% | 0.6% |
| Drexel University | 79.0% | 79.4% | 0.6% |
| Southern Methodist University | 63.0% | 63.3% | 0.6% |
| Baylor University | 51.0% | 51.3% | 0.5% |
| Miami University | 75.0% | 75.4% | 0.5% |
| Elon University | 66.0% | 66.3% | 0.5% |
| University of Kansas | 93.0% | 93.5% | 0.5% |
| Temple University | 80.0% | 80.4% | 0.5% |
| University of San Francisco | 62.0% | 61.7% | 0.5% |
| University of Maryland, College Park | 45.0% | 44.8% | 0.5% |
| University of Vermont | 65.0% | 65.3% | 0.5% |
| University of Iowa | 84.0% | 83.6% | 0.5% |
| University of the Pacific | 71.0% | 71.3% | 0.5% |
| University of Wisconsin-Madison | 45.0% | 45.2% | 0.4% |
| Occidental College | 44.0% | 44.2% | 0.4% |
| Wellesley College | 14.0% | 14.1% | 0.4% |
| University of Redlands | 83.0% | 82.7% | 0.3% |
| University of California, Los Angeles | 9.0% | 9.0% | 0.3% |
| Indiana University Bloomington | 78.0% | 78.2% | 0.3% |
| Purdue University | 50.0% | 49.9% | 0.3% |
| Rutgers University-New Brunswick | 58.0% | 58.1% | 0.3% |
| University of Denver | 78.0% | 77.8% | 0.2% |
| Michigan State University | 85.0% | 84.8% | 0.2% |
| Pepperdine University | 63.0% | 62.9% | 0.2% |
| Cal Poly Humboldt | 98.0% | 98.2% | 0.2% |
| University of California, Berkeley | 11.0% | 11.0% | 0.2% |
| Loyola Marymount University | 45.0% | 45.1% | 0.2% |
| University of Arizona | 86.0% | 86.1% | 0.2% |
| Amherst College | 9.0% | 9.0% | 0.1% |
| Rochester Institute of Technology | 67.0% | 66.9% | 0.1% |
| University of Colorado Boulder | 78.0% | 78.1% | 0.1% |
| Rice University | 8.0% | 8.0% | 0.0% |

The 13 newly-matched schools' round-number admit rates all landed under
8.0% difference from Scorecard — none crossed the 10% discrepancy
threshold, so none are in SCORECARD_DISCREPANCIES.md.

## Reading this

- The gap is not uniform. A cluster of 9 schools — mostly UC/CSU campuses
  plus San Jose State — are off by **more than 10%**, several by over a
  third (Santa Cruz 40%, Cal Poly Pomona 37%, Irvine 36%, Santa Barbara
  27%). These are the same schools flagged in SCORECARD_DISCREPANCIES.md.
- The remaining ~45 matched schools cluster tightly under 1% difference,
  several at 0.0–0.3%. That tightness is itself informative: it's
  consistent with the round curated figure having been rounded *from*
  something close to Scorecard's own number (or a shared underlying
  IPEDS-derived figure), rather than independently sourced and coincidentally
  landing nearby.
- Per instruction, closeness to Scorecard does **not** make a round-number
  curated value verified — it's still an unsourced, rounded figure until a
  real citation (CDS, institutional page) is attached to it. The two
  clusters above (large-gap vs. tight-cluster) are a pattern worth keeping
  in mind when hand-sourcing, not a substitute for sourcing.
