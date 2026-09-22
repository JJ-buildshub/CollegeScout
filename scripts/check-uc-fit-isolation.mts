// Confirms the UC accuracy correction: for a UC school, a student's school-reported
// unweighted GPA and SAT/ACT score must never affect the fit result when no
// self-reported UC-capped GPA has been entered — the result must come from admit
// rate alone (a "Limited-data estimate"), not from either of those two inputs.
// Also confirms a self-reported UC GPA *does* drive a real comparison, and that
// SAT is never used for UC even when one is entered alongside a real UC GPA.
// Run: node --experimental-strip-types scripts/check-uc-fit-isolation.mts
import { readFileSync } from "node:fs";
import { evaluateCollegeFit } from "../lib/gpa.ts";
import type { College } from "../lib/types.ts";

const colleges = JSON.parse(readFileSync(new URL("../data/colleges.json", import.meta.url), "utf8")) as College[];
const ucSchools = colleges.filter((c) => c.system === "UC");

let failed = 0;
const check = (name: string, condition: boolean) => {
  if (!condition) failed += 1;
  console.log(`${condition ? "ok  " : "FAIL"} ${name}`);
};

if (ucSchools.length === 0) {
  console.log("FAIL no UC schools found in data/colleges.json — nothing to test");
  process.exit(1);
}

// Wildly different school-reported GPA/SAT pairs. If UC GPA is blank, none of
// these should change the result at all.
const gpaAndSatVariants: { gpa: number; sat: number | undefined }[] = [
  { gpa: 2.0, sat: 400 },
  { gpa: 2.0, sat: undefined },
  { gpa: 3.7, sat: 1200 },
  { gpa: 4.0, sat: 1600 },
];

for (const college of ucSchools) {
  const results = gpaAndSatVariants.map(({ gpa, sat }) => evaluateCollegeFit(college, null, gpa, undefined, "CA", sat));

  const first = results[0];
  check(`${college.id}: isEstimated with no UC GPA entered`, first.isEstimated === true);
  check(`${college.id}: sat is never populated with no UC GPA entered`, first.sat === null);
  check(
    `${college.id}: category/reason/band identical across every school-GPA/SAT variant`,
    results.every(
      (r) =>
        r.category === first.category &&
        r.reason === first.reason &&
        r.band === first.band &&
        r.rangeLow === first.rangeLow &&
        r.rangeHigh === first.rangeHigh &&
        r.gpaMetricLabel === first.gpaMetricLabel &&
        r.sat === null
    )
  );
}

// A self-reported UC GPA must actually drive a real comparison, at a school
// that publishes a UC-capped range — otherwise the isolation above would be
// trivially true for the wrong reason (nothing ever using ucCappedGpa at all).
const ucWithRange = ucSchools.find((c) => /^\d/.test(c.mid50_GPA_UCCapped.trim()));
if (ucWithRange) {
  const low = evaluateCollegeFit(ucWithRange, 2.0, 3.7, undefined, "CA", 1400);
  const high = evaluateCollegeFit(ucWithRange, 4.5, 3.7, undefined, "CA", 1400);
  check(`${ucWithRange.id}: a self-reported UC GPA is actually used (2.0 vs 4.5 differ)`, low.category !== high.category || low.band !== high.band);
  check(`${ucWithRange.id}: self-reported UC GPA result is not estimated`, high.isEstimated === false);
  check(`${ucWithRange.id}: SAT is still never used even with a self-reported UC GPA`, high.sat === null);
  check(`${ucWithRange.id}: gpaMetricLabel reflects self-reported UC GPA`, high.gpaMetricLabel === "UC-Capped GPA (self-reported)");
} else {
  console.log("FAIL no UC school with a published UC-capped GPA range found — cannot verify self-reported comparison");
  failed += 1;
}

process.exit(failed ? 1 : 0);
