#!/usr/bin/env node
/**
 * Sets the displayed cost of attendance from College Scorecard for every
 * school whose cost carries no source, using the figure
 * scripts/import-scorecard.mjs already stored under
 * `scorecard.costOfAttendance`.
 *
 * Usage:
 *   node scripts/apply-scorecard-cost.mjs            # report only
 *   node scripts/apply-scorecard-cost.mjs --apply    # write data/colleges.json
 *
 * It applies the rule the 208 already-sourced records were built with (see
 * build-expansion-records.py), so all sourced costs mean the same thing:
 * Scorecard publishes one cost of attendance per school; for a public school
 * the out-of-state figure adds the published tuition difference.
 *
 * A school that already has `costProvenance` is never touched, so a cost
 * later sourced from the school's own page is safe from a re-run. A school
 * Scorecard has no figure for is left as it is, still unsourced.
 *
 * What this figure is and is not: Scorecard's cost of attendance averages
 * across students living on campus, off campus and at home, and lags the
 * current year. It runs below a school's own on-campus budget — by a few
 * percent at most schools, by far more at commuter campuses such as the CSUs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dataPath = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "colleges.json");
const apply = process.argv.includes("--apply");
const PUBLIC_SYSTEMS = new Set(["UC", "CSU", "Public"]);
const SOURCE = "College Scorecard (latest.cost.attendance.academic_year)";

const colleges = JSON.parse(readFileSync(dataPath, "utf8"));
const changed = [];
const skipped = [];

for (const college of colleges) {
  if (college.costProvenance) continue;
  const coa = college.scorecard?.costOfAttendance;
  if (coa?.value == null) {
    skipped.push(college.name);
    continue;
  }
  const tuitionIn = college.scorecard.tuitionInState?.value;
  const tuitionOut = college.scorecard.tuitionOutOfState?.value;
  const splitByResidency = PUBLIC_SYSTEMS.has(college.system) && tuitionIn != null && tuitionOut != null;
  const next = {
    coaInState: coa.value,
    coaOutOfState: splitByResidency ? coa.value + (tuitionOut - tuitionIn) : coa.value,
  };
  changed.push({ name: college.name, system: college.system, before: { ...college.financials }, next });
  if (apply) {
    college.financials.coaInState = next.coaInState;
    college.financials.coaOutOfState = next.coaOutOfState;
    college.costProvenance = {
      source: SOURCE,
      year: coa.provenance.year,
      note: splitByResidency
        ? "Cost of attendance from College Scorecard; the out-of-state figure adds the published tuition difference (out-of-state minus in-state tuition)."
        : "Cost of attendance from College Scorecard (academic-year cost).",
    };
  }
}

const usd = (n) => (n == null ? "—" : `$${n.toLocaleString()}`);
for (const c of changed) {
  console.log(
    `${c.name.padEnd(58)} ${c.system.padEnd(8)} in-state ${usd(c.before.coaInState)} -> ${usd(c.next.coaInState)}   out-of-state ${usd(c.before.coaOutOfState)} -> ${usd(c.next.coaOutOfState)}`
  );
}
console.log(`\n${changed.length} school(s) ${apply ? "updated" : "would be updated"}.`);
if (skipped.length) console.log(`No Scorecard figure, left unsourced: ${skipped.join("; ")}`);

if (apply) {
  writeFileSync(dataPath, JSON.stringify(colleges, null, 2) + "\n", "utf8");
  console.log("Wrote data/colleges.json.");
} else {
  console.log("Report only. Re-run with --apply to write.");
}
