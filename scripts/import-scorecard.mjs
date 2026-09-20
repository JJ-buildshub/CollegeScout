// Fills data gaps (net price, graduation rate, undergrad enrollment,
// in-state/out-of-state tuition, admit rate) from the College Scorecard API,
// writing every value into `college.scorecard` — a namespace kept entirely
// separate from hand-curated fields so this script can never silently
// overwrite curated data. See SCORECARD_FEASIBILITY.md for the field
// mapping and REPORT.md for what happened on the run that produced the
// data currently in data/colleges.json.
//
// Usage:
//   node scripts/import-scorecard.mjs
//
// Uses SCORECARD_API_KEY from the environment if set, otherwise falls back
// to the public DEMO_KEY (rate-limited to 10 req/hour — see QUESTIONS.md).
// Two passes, both idempotent:
//   1. Refresh — colleges that already have an `ipedsUnitId` are re-fetched
//      directly by that id (no name/state matching involved, so this can
//      never change which record a school is matched to) to pick up new
//      award years or updated Scorecard figures.
//   2. Match — colleges still missing an `ipedsUnitId` go through the
//      existing name+state matching flow.
// Safe to leave running unattended, and safe to re-run any time.
//
// Rate-limit handling is adaptive, not a hardcoded guess: after every
// request it reads the API's own X-Ratelimit-Remaining header and sleeps
// until the next hour boundary once that header gets low, so it works
// whether you're on DEMO_KEY or a real key without editing this file.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "data", "colleges.json");
const questionsPath = path.join(__dirname, "..", "QUESTIONS.md");
const discrepanciesPath = path.join(__dirname, "..", "SCORECARD_DISCREPANCIES.md");

const API_KEY = process.env.SCORECARD_API_KEY || "DEMO_KEY";
const USING_DEMO_KEY = API_KEY === "DEMO_KEY";
const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json";
const DISCREPANCY_THRESHOLD = 0.10; // 10%, per instructions

// Bare field names (no "latest."/year prefix) for every value this script
// imports. Used both for the "latest.<field>" lookup and, prefixed with a
// candidate year instead, to find which award year "latest" actually came
// from — see findAwardYear.
const BASE_FIELDS = [
  "admissions.admission_rate.overall",
  "admissions.admission_rate.by_ope_id",
  "cost.avg_net_price.overall",
  "cost.avg_net_price.public",
  "cost.avg_net_price.private",
  "cost.avg_net_price.consumer.overall_median",
  "cost.net_price.public.by_income_level.0-30000",
  "cost.net_price.public.by_income_level.30001-48000",
  "cost.net_price.public.by_income_level.48001-75000",
  "cost.net_price.public.by_income_level.75001-110000",
  "cost.net_price.public.by_income_level.110001-plus",
  "cost.net_price.private.by_income_level.0-30000",
  "cost.net_price.private.by_income_level.30001-48000",
  "cost.net_price.private.by_income_level.48001-75000",
  "cost.net_price.private.by_income_level.75001-110000",
  "cost.net_price.private.by_income_level.110001-plus",
  "completion.completion_rate_4yr_150nt",
  "completion.completion_rate_less_than_4yr_150nt",
  "student.size",
  "cost.tuition.in_state",
  "cost.tuition.out_of_state",
];

// "latest.<field>" is Scorecard's own alias for "the most recent value
// available for this field" — confirmed live that this is picked
// independently per field (and can lag by a different number of years for
// different fields on the same school), not a single global data year. It
// is NOT exposed directly by the API as a year, so the only way to find it
// is to also request the same field under a range of candidate years and
// see which one's value is identical to "latest" (confirmed live: e.g.
// Harvard's latest.admissions.admission_rate.overall === its
// 2024.admissions.admission_rate.overall). 7 years back covers every case
// seen so far (everything checked landed on the most recent available
// year). Capped at 7, not more: api.data.gov's gateway 414s past ~8,200
// request-URL bytes (confirmed live — 8 years produced an 8,687-byte URL
// and a hard 414; 7 years is ~7,850 at worst, leaving real margin).
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_SEARCH_RANGE = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR - i);

const FIELDS = [
  "id",
  "school.name",
  "school.state",
  "school.ownership",
  ...BASE_FIELDS.map((f) => `latest.${f}`),
  ...YEAR_SEARCH_RANGE.flatMap((year) => BASE_FIELDS.map((f) => `${year}.${f}`)),
].join(",");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scorecardSource(field) {
  return `College Scorecard (latest.${field})`;
}

/** Finds which candidate year's value matches "latest" for this field — see the YEAR_SEARCH_RANGE comment above. Never guessed: returns null (never a fabricated year) if no candidate year matches. */
function findAwardYear(result, field) {
  const latestValue = result[`latest.${field}`];
  if (latestValue == null) return null;
  for (const year of YEAR_SEARCH_RANGE) {
    if (result[`${year}.${field}`] === latestValue) return year;
  }
  return null;
}

function formatAwardYear(year) {
  if (year != null) return String(year);
  const oldest = YEAR_SEARCH_RANGE[YEAR_SEARCH_RANGE.length - 1];
  const newest = YEAR_SEARCH_RANGE[0];
  return `award year not identified (checked ${oldest}–${newest})`;
}

function metric(result, value, field) {
  if (value == null) return { value: null, provenance: null };
  return { value, provenance: { source: scorecardSource(field), year: formatAwardYear(findAwardYear(result, field)) } };
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[,\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchSchoolByNameState(name, state) {
  // api.data.gov's gateway 500s on a literal comma in school.name (confirmed
  // live), and Scorecard itself stores these schools with a hyphen instead
  // of a comma anyway (e.g. "University of California-Berkeley"). A
  // parenthetical like "(NYU)" or "(University Park)" in our own curated
  // name is also just descriptive, not part of Scorecard's name, so it's
  // dropped from the query too. A literal "&" doesn't error, but confirmed
  // live it wrecks Scorecard's own search relevance: querying "Texas A&M
  // University" returns ten unrelated Texas schools and never surfaces
  // "Texas A&M University-College Station" at all, while querying "Texas AM
  // University" (the "&" just dropped) surfaces it at position 6. So "&" is
  // stripped from the query too, same as the other two. Exact-match
  // comparison is done on normalized names (see normalizeName), so none of
  // this ever widens a match — it only strips noise/quirks on the query
  // side that aren't part of either side's actual name.
  const queryName = name.replace(/\([^)]*\)/g, "").replace(/[,&]/g, "");
  const url = `${BASE_URL}?api_key=${API_KEY}&school.name=${encodeURIComponent(queryName)}&school.state=${encodeURIComponent(state)}&fields=${FIELDS}&per_page=10`;
  return doFetch(url);
}

/** Re-fetches an already-matched school directly by its confirmed IPEDS id — no name/state matching involved, so this can never change which record a school is matched to. */
async function fetchSchoolById(id) {
  const url = `${BASE_URL}?api_key=${API_KEY}&id=${id}&fields=${FIELDS}`;
  return doFetch(url);
}

async function doFetch(url) {
  const res = await fetch(url);
  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return { results: body.results ?? [], remaining: Number.isFinite(remaining) ? remaining : null };
}

function pickIncomeBands(result, ownership) {
  const prefix = ownership === 1 ? "cost.net_price.public.by_income_level." : "cost.net_price.private.by_income_level.";
  const bands = ["0-30000", "30001-48000", "48001-75000", "75001-110000", "110001-plus"];
  const value = {};
  const years = new Set();
  let anyField = null;
  for (const band of bands) {
    const field = prefix + band;
    const v = result[`latest.${field}`];
    if (v != null) {
      value[band] = v;
      anyField = prefix + "*";
      years.add(formatAwardYear(findAwardYear(result, field)));
    }
  }
  if (Object.keys(value).length === 0) return { value: null, field: null, year: null };
  // Bands share one data category/reporting cycle in practice (confirmed on
  // every school imported so far), but this is checked per band rather than
  // assumed — if they ever disagree, all distinct years are shown rather
  // than silently picking one.
  return { value, field: anyField, year: [...years].join(" / ") };
}

function pickNetPriceOverall(result, ownership) {
  const candidates = [
    ["cost.avg_net_price.overall", result["latest.cost.avg_net_price.overall"]],
    ownership === 1
      ? ["cost.avg_net_price.public", result["latest.cost.avg_net_price.public"]]
      : ["cost.avg_net_price.private", result["latest.cost.avg_net_price.private"]],
    ["cost.avg_net_price.consumer.overall_median", result["latest.cost.avg_net_price.consumer.overall_median"]],
  ];
  for (const [field, value] of candidates) {
    if (value != null) return { field, value };
  }
  return { field: null, value: null };
}

function pickGraduationRate(result) {
  const fourYear = result["latest.completion.completion_rate_4yr_150nt"];
  if (fourYear != null) return { field: "completion.completion_rate_4yr_150nt", value: fourYear };
  const lessThanFourYear = result["latest.completion.completion_rate_less_than_4yr_150nt"];
  if (lessThanFourYear != null) return { field: "completion.completion_rate_less_than_4yr_150nt", value: lessThanFourYear };
  return { field: null, value: null };
}

function pickAdmitRate(result) {
  const overall = result["latest.admissions.admission_rate.overall"];
  if (overall != null) return { field: "admissions.admission_rate.overall", value: overall };
  const byOpeId = result["latest.admissions.admission_rate.by_ope_id"];
  if (byOpeId != null) return { field: "admissions.admission_rate.by_ope_id", value: byOpeId };
  return { field: null, value: null };
}

/** Both QUESTIONS.md and SCORECARD_DISCREPANCIES.md are re-derived facts about the current data, not an accumulating log — appending unconditionally on every re-run would duplicate the same entry. Guarded by a stable per-school marker instead. */
function appendUnique(filePath, marker, text) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
  if (existing.includes(marker)) return;
  fs.appendFileSync(filePath, `\n- ${text}`, "utf-8");
}

function appendQuestion(college, text) {
  appendUnique(questionsPath, `**${college.name}** (${college.id}`, text);
}

function appendDiscrepancy(college, text) {
  if (!fs.existsSync(discrepanciesPath)) {
    fs.writeFileSync(
      discrepanciesPath,
      "# College Scorecard vs. curated-data discrepancies\n\nSchools where Scorecard's value differs from our curated value by more than 10%. Curated value was kept in every case; Scorecard's value is stored under `college.scorecard` for reference only.\n",
      "utf-8"
    );
  }
  appendUnique(discrepanciesPath, `**${college.name}** — admit rate:`, text);
}

function relDiff(a, b) {
  if (a === 0) return b === 0 ? 0 : Infinity;
  return Math.abs(a - b) / Math.abs(a);
}

function buildScorecardData(result) {
  const ownership = result["school.ownership"];
  const netPrice = pickNetPriceOverall(result, ownership);
  const bands = pickIncomeBands(result, ownership);
  const grad = pickGraduationRate(result);
  const admit = pickAdmitRate(result);

  return {
    scorecard: {
      netPriceOverall: metric(result, netPrice.value, netPrice.field ?? "cost.avg_net_price.overall"),
      netPriceByIncomeBand: {
        value: bands.value,
        provenance: bands.value ? { source: scorecardSource(bands.field), year: bands.year } : null,
      },
      graduationRate: metric(result, grad.value, grad.field ?? "completion.completion_rate_4yr_150nt"),
      undergradEnrollment: metric(result, result["latest.student.size"], "student.size"),
      tuitionInState: metric(result, result["latest.cost.tuition.in_state"], "cost.tuition.in_state"),
      tuitionOutOfState: metric(result, result["latest.cost.tuition.out_of_state"], "cost.tuition.out_of_state"),
      admitRateOverall: metric(result, admit.value, admit.field ?? "admissions.admission_rate.overall"),
    },
    admitValue: admit.value,
  };
}

function checkDiscrepancy(college, admitValue) {
  if (admitValue != null && college.admitRateOverall != null && relDiff(admitValue, college.admitRateOverall) > DISCREPANCY_THRESHOLD) {
    appendDiscrepancy(
      college,
      `**${college.name}** — admit rate: curated ${(college.admitRateOverall * 100).toFixed(1)}% vs. Scorecard ${(admitValue * 100).toFixed(1)}% (${(relDiff(admitValue, college.admitRateOverall) * 100).toFixed(1)}% relative difference). Kept curated value.`
    );
  }
}

async function main() {
  const colleges = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const alreadyMatched = colleges.filter((c) => c.ipedsUnitId != null);
  const pending = colleges.filter((c) => c.ipedsUnitId == null);

  console.log(`[import-scorecard] ${colleges.length} schools total: ${alreadyMatched.length} to refresh, ${pending.length} still need matching.`);
  console.log(`[import-scorecard] Using ${USING_DEMO_KEY ? "DEMO_KEY (10 req/hour)" : "SCORECARD_API_KEY"}.`);

  let refreshed = 0;
  let matched = 0;
  let unmatched = 0;

  // Pass 1: refresh already-matched schools directly by id (never touches
  // matching, so it can't change which record a school is tied to; never
  // touches curated fields, only college.scorecard).
  for (const college of alreadyMatched) {
    let attempt;
    try {
      attempt = await fetchSchoolById(college.ipedsUnitId);
    } catch (err) {
      console.error(`[import-scorecard] Refresh request failed for "${college.name}": ${err.message}`);
      await sleep(5000);
      continue;
    }
    const { results, remaining } = attempt;
    const result = results[0];
    if (result) {
      const { scorecard, admitValue } = buildScorecardData(result);
      college.scorecard = scorecard;
      checkDiscrepancy(college, admitValue);
      console.log(`[import-scorecard] REFRESHED "${college.name}" (IPEDS ${college.ipedsUnitId})`);
      refreshed += 1;
    } else {
      console.error(`[import-scorecard] Refresh found no record for "${college.name}" (IPEDS ${college.ipedsUnitId}) — left scorecard data as-is.`);
    }
    fs.writeFileSync(dataPath, JSON.stringify(colleges, null, 2) + "\n", "utf-8");
    if (remaining != null && remaining <= 1) {
      const waitMs = 65 * 60 * 1000;
      console.log(`[import-scorecard] Rate limit nearly exhausted (remaining=${remaining}). Sleeping ${Math.round(waitMs / 60000)} min.`);
      await sleep(waitMs);
    } else {
      await sleep(2000);
    }
  }

  // Pass 2: match schools that still have no ipedsUnitId (unchanged flow).
  for (const college of pending) {
    let attempt;
    try {
      attempt = await fetchSchoolByNameState(college.name, college.state);
    } catch (err) {
      console.error(`[import-scorecard] Request failed for "${college.name}": ${err.message}`);
      appendQuestion(college, `**${college.name}** (${college.id}) — Scorecard request failed: ${err.message}. Not matched; re-run the script to retry.`);
      unmatched += 1;
      await sleep(5000);
      continue;
    }

    const { results, remaining } = attempt;
    const exact = results.filter((r) => normalizeName(r["school.name"] ?? "") === normalizeName(college.name));
    const candidates = exact.length > 0 ? exact : results;

    if (candidates.length !== 1) {
      console.log(`[import-scorecard] SKIP "${college.name}" (${college.state}) — ${candidates.length} candidate(s), not confident.`);
      appendQuestion(
        college,
        `**${college.name}** (${college.id}, state ${college.state}) — ${
          candidates.length === 0 ? "no Scorecard match found" : `${candidates.length} ambiguous matches found`
        } for name+state. Left unmatched rather than guessing. Candidates: ${candidates
          .map((r) => `${r["school.name"]} (${r["school.state"]}, id ${r.id})`)
          .join("; ") || "none"}.`
      );
      unmatched += 1;
    } else {
      const result = candidates[0];
      const { scorecard, admitValue } = buildScorecardData(result);
      college.ipedsUnitId = result.id;
      college.scorecard = scorecard;
      checkDiscrepancy(college, admitValue);
      console.log(`[import-scorecard] MATCHED "${college.name}" -> IPEDS ${result.id}`);
      matched += 1;
    }

    fs.writeFileSync(dataPath, JSON.stringify(colleges, null, 2) + "\n", "utf-8");

    if (remaining != null && remaining <= 1) {
      const waitMs = 65 * 60 * 1000;
      console.log(`[import-scorecard] Rate limit nearly exhausted (remaining=${remaining}). Sleeping ${Math.round(waitMs / 60000)} min.`);
      await sleep(waitMs);
    } else {
      await sleep(2000);
    }
  }

  console.log(`[import-scorecard] Done. Refreshed ${refreshed}, matched ${matched}, unmatched ${unmatched}.`);
}

main().catch((err) => {
  console.error("[import-scorecard] Fatal error:", err);
  process.exit(1);
});
