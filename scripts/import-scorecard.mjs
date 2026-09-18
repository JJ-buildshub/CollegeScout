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
// Re-runnable and idempotent: any college that already has an `ipedsUnitId`
// is skipped, so re-running only fetches schools that are still missing —
// safe to leave running unattended, and safe to re-run after dropping in a
// real API key to finish faster.
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

const FIELDS = [
  "id",
  "school.name",
  "school.state",
  "school.ownership",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.admission_rate.by_ope_id",
  "latest.cost.avg_net_price.overall",
  "latest.cost.avg_net_price.public",
  "latest.cost.avg_net_price.private",
  "latest.cost.avg_net_price.consumer.overall_median",
  "latest.cost.net_price.public.by_income_level.0-30000",
  "latest.cost.net_price.public.by_income_level.30001-48000",
  "latest.cost.net_price.public.by_income_level.48001-75000",
  "latest.cost.net_price.public.by_income_level.75001-110000",
  "latest.cost.net_price.public.by_income_level.110001-plus",
  "latest.cost.net_price.private.by_income_level.0-30000",
  "latest.cost.net_price.private.by_income_level.30001-48000",
  "latest.cost.net_price.private.by_income_level.48001-75000",
  "latest.cost.net_price.private.by_income_level.75001-110000",
  "latest.cost.net_price.private.by_income_level.110001-plus",
  "latest.completion.completion_rate_4yr_150nt",
  "latest.completion.completion_rate_less_than_4yr_150nt",
  "latest.student.size",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
].join(",");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString().slice(0, 10);
}

function scorecardSource(field) {
  return `College Scorecard (${field})`;
}

function scorecardYear() {
  return `latest snapshot, fetched ${nowIso()}`;
}

function metric(value, field) {
  return {
    value: value ?? null,
    provenance: value == null ? null : { source: scorecardSource(field), year: scorecardYear() },
  };
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[,\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchSchool(name, state) {
  // api.data.gov's gateway 500s on a literal comma in school.name (confirmed
  // live), and Scorecard itself stores these schools with a hyphen instead
  // of a comma anyway (e.g. "University of California-Berkeley"). A
  // parenthetical like "(NYU)" or "(University Park)" in our own curated
  // name is also just descriptive, not part of Scorecard's name, so it's
  // dropped from the query too. Exact-match comparison is done on
  // normalized names (see normalizeName), so this never widens a match —
  // it only strips noise that isn't part of either side's actual name.
  const queryName = name.replace(/\([^)]*\)/g, "").replace(/,/g, "");
  const url = `${BASE_URL}?api_key=${API_KEY}&school.name=${encodeURIComponent(queryName)}&school.state=${encodeURIComponent(state)}&fields=${FIELDS}&per_page=10`;
  const res = await fetch(url);
  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return { results: body.results ?? [], remaining: Number.isFinite(remaining) ? remaining : null };
}

function pickIncomeBands(result, ownership) {
  const prefix = ownership === 1 ? "latest.cost.net_price.public.by_income_level." : "latest.cost.net_price.private.by_income_level.";
  const bands = ["0-30000", "30001-48000", "48001-75000", "75001-110000", "110001-plus"];
  const value = {};
  let field = null;
  for (const band of bands) {
    const v = result[prefix + band];
    if (v != null) {
      value[band] = v;
      field = prefix + "*";
    }
  }
  return Object.keys(value).length > 0 ? { value, field } : { value: null, field: null };
}

function pickNetPriceOverall(result, ownership) {
  const candidates = [
    ["latest.cost.avg_net_price.overall", result["latest.cost.avg_net_price.overall"]],
    ownership === 1
      ? ["latest.cost.avg_net_price.public", result["latest.cost.avg_net_price.public"]]
      : ["latest.cost.avg_net_price.private", result["latest.cost.avg_net_price.private"]],
    ["latest.cost.avg_net_price.consumer.overall_median", result["latest.cost.avg_net_price.consumer.overall_median"]],
  ];
  for (const [field, value] of candidates) {
    if (value != null) return { field, value };
  }
  return { field: null, value: null };
}

function pickGraduationRate(result) {
  const fourYear = result["latest.completion.completion_rate_4yr_150nt"];
  if (fourYear != null) return { field: "latest.completion.completion_rate_4yr_150nt", value: fourYear };
  const lessThanFourYear = result["latest.completion.completion_rate_less_than_4yr_150nt"];
  if (lessThanFourYear != null) return { field: "latest.completion.completion_rate_less_than_4yr_150nt", value: lessThanFourYear };
  return { field: null, value: null };
}

function pickAdmitRate(result) {
  const overall = result["latest.admissions.admission_rate.overall"];
  if (overall != null) return { field: "latest.admissions.admission_rate.overall", value: overall };
  const byOpeId = result["latest.admissions.admission_rate.by_ope_id"];
  if (byOpeId != null) return { field: "latest.admissions.admission_rate.by_ope_id", value: byOpeId };
  return { field: null, value: null };
}

function appendQuestion(text) {
  fs.appendFileSync(questionsPath, `\n- ${text}`, "utf-8");
}

function appendDiscrepancy(text) {
  if (!fs.existsSync(discrepanciesPath)) {
    fs.writeFileSync(
      discrepanciesPath,
      "# College Scorecard vs. curated-data discrepancies\n\nSchools where Scorecard's value differs from our curated value by more than 10%. Curated value was kept in every case; Scorecard's value is stored under `college.scorecard` for reference only.\n",
      "utf-8"
    );
  }
  fs.appendFileSync(discrepanciesPath, `\n- ${text}`, "utf-8");
}

function relDiff(a, b) {
  if (a === 0) return b === 0 ? 0 : Infinity;
  return Math.abs(a - b) / Math.abs(a);
}

async function main() {
  const colleges = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const pending = colleges.filter((c) => c.ipedsUnitId == null);

  console.log(`[import-scorecard] ${colleges.length} schools total, ${pending.length} still need matching.`);
  console.log(`[import-scorecard] Using ${USING_DEMO_KEY ? "DEMO_KEY (10 req/hour)" : "SCORECARD_API_KEY"}.`);

  let matched = 0;
  let unmatched = 0;

  for (const college of pending) {
    let attempt;
    try {
      attempt = await fetchSchool(college.name, college.state);
    } catch (err) {
      console.error(`[import-scorecard] Request failed for "${college.name}": ${err.message}`);
      appendQuestion(`**${college.name}** (${college.id}) — Scorecard request failed: ${err.message}. Not matched; re-run the script to retry.`);
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
        `**${college.name}** (${college.id}, state ${college.state}) — ${
          candidates.length === 0 ? "no Scorecard match found" : `${candidates.length} ambiguous matches found`
        } for name+state. Left unmatched rather than guessing. Candidates: ${candidates
          .map((r) => `${r["school.name"]} (${r["school.state"]}, id ${r.id})`)
          .join("; ") || "none"}.`
      );
      unmatched += 1;
    } else {
      const result = candidates[0];
      const ownership = result["school.ownership"];
      const netPrice = pickNetPriceOverall(result, ownership);
      const bands = pickIncomeBands(result, ownership);
      const grad = pickGraduationRate(result);
      const admit = pickAdmitRate(result);
      const enrollment = result["latest.student.size"];
      const tuitionInState = result["latest.cost.tuition.in_state"];
      const tuitionOutOfState = result["latest.cost.tuition.out_of_state"];

      college.ipedsUnitId = result.id;
      college.scorecard = {
        netPriceOverall: metric(netPrice.value, netPrice.field ?? "latest.cost.avg_net_price.*"),
        netPriceByIncomeBand: {
          value: bands.value,
          provenance: bands.value ? { source: scorecardSource(bands.field), year: scorecardYear() } : null,
        },
        graduationRate: metric(grad.value, grad.field ?? "latest.completion.completion_rate_4yr_150nt"),
        undergradEnrollment: metric(enrollment, "latest.student.size"),
        tuitionInState: metric(tuitionInState, "latest.cost.tuition.in_state"),
        tuitionOutOfState: metric(tuitionOutOfState, "latest.cost.tuition.out_of_state"),
        admitRateOverall: metric(admit.value, admit.field ?? "latest.admissions.admission_rate.overall"),
      };

      if (admit.value != null && college.admitRateOverall != null && relDiff(admit.value, college.admitRateOverall) > DISCREPANCY_THRESHOLD) {
        appendDiscrepancy(
          `**${college.name}** — admit rate: curated ${(college.admitRateOverall * 100).toFixed(1)}% vs. Scorecard ${(admit.value * 100).toFixed(1)}% (${(relDiff(admit.value, college.admitRateOverall) * 100).toFixed(1)}% relative difference). Kept curated value.`
        );
      }

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

  console.log(`[import-scorecard] Done. Matched ${matched}, unmatched ${unmatched}.`);
}

main().catch((err) => {
  console.error("[import-scorecard] Fatal error:", err);
  process.exit(1);
});
