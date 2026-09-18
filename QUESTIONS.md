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

## 2. 13 schools left unmatched — genuinely ambiguous, not a bug

For these, "school name" alone doesn't identify a single Scorecard record:
either the curated name is a public system with multiple separately
IPEDS-reported campuses (no campus specified), or a real naming collision.
Left unmatched rather than guessing which campus/record was meant.

- **Columbia University** (columbia-university, NY) — 2 candidates: Columbia University in the City of New York (id 190150); Teachers College at Columbia University (id 196468).
- **Purdue University** (purdue-university, IN) — 10 candidates, including Purdue University-Main Campus (id 243780), Purdue Fort Wayne, Purdue Northwest, and several Purdue Polytechnic satellite sites.
- **University of Washington** (university-of-washington, WA) — 10 candidates, including University of Washington-Seattle Campus (id 236948), -Bothell, -Tacoma, plus unrelated WA public universities matched by the broad search.
- **University of Michigan** (university-of-michigan, MI) — 10 candidates, including University of Michigan-Ann Arbor (id 170976), -Dearborn, -Flint, plus unrelated MI public universities.
- **University of Alabama** (university-of-alabama, AL) — 9 candidates, including The University of Alabama (id 100751) vs. University of Alabama in Huntsville, at Birmingham, etc.
- **University of Pittsburgh** (university-of-pittsburgh, PA) — 5 candidates: Pittsburgh Campus (id 215293), Bradford, Greensburg, Johnstown, Titusville.
- **University of Virginia** (university-of-virginia, VA) — 10 candidates, including University of Virginia-Main Campus (id 234076) plus unrelated VA public universities matched by the broad search.
- **University of Florida** (university-of-florida, FL) — 10 candidates, none of which is actually "University of Florida" itself (Florida State, USF, UCF, etc. — the broad search didn't surface the exact record within the first page).
- **Ohio State University** (ohio-state-university, OH) — 6 candidates, including Ohio State University-Main Campus (id 204796), Lima, Mansfield, Marion, Newark, ATI.
- **Penn State University (University Park)** (penn-state-university, PA) — 10 candidates, all named "Pennsylvania State University-Penn State \<branch\>" (DuBois, New Kensington, Shenango, Brandywine, Scranton, Lehigh Valley, Altoona, Beaver, Berks, Harrisburg); the University Park main campus record wasn't in the first page of results and wasn't confidently identifiable without guessing.
- **Arizona State University** (arizona-state-university, AZ) — 10 candidates, all ASU's own separately-reported campus/immersion records (Campus Immersion, Digital Immersion, Downtown Phoenix, Polytechnic, West Valley, Tucson, etc.) — no single "main" record.
- **Texas A&M University** (texas-am-university, TX) — 10 candidates, none of which is actually the flagship College Station campus (the broad search surfaced UT System schools and Texas A&M-San Antonio instead).
- **Miami University** (miami-university-ohio, OH) — 3 candidates: Miami University-Oxford (id 204024, almost certainly the intended school), -Hamilton, -Middletown.

If you want any of these filled in, the fix is to add the exact Scorecard
record name or IPEDS id you want used (e.g. as an override next to the
college's curated data), not a fuzzier name-matching heuristic — several of
these (Florida, Texas A&M, Penn State University Park) don't even return
the intended record in the API's own top-10 results for a name+state
search, so no purely mechanical matching rule would get them all right
without risking a wrong match elsewhere.
