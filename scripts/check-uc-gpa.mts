// Checks the UC GPA calculation against the rules on UC's GPA requirement page
// (admission.universityofcalifornia.edu/admission-requirements/first-year-requirements/gpa-requirement.html):
// grade points plus one point per honors semester, at most 8 across 10th and
// 11th grade, at most 4 from 10th grade, divided by the number of grades. Cases
// are worked by hand. Run: node --experimental-strip-types scripts/check-uc-gpa.mts
import { calculateUcCappedGpa, calculateUcNonResidentGpa } from "../lib/gpa.ts";

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
let failed = 0;
const check = (name: string, got: number, want: number) => {
  const ok = near(got, want);
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${got.toFixed(4)} (expected ${want.toFixed(4)})`);
};

const base = { unweightedGpa: 3.7, totalSemesters: 20 };

// 6 honors semesters, no 10th-grade split given: 3.70 + 6/20
check("6 honors, no split", calculateUcCappedGpa({ ...base, honorsSemesters: 6 }).ucCappedGpa, 4.0);
// 6 honors, 5 of them in 10th grade: only 4 count from 10th, so 4 + 1 = 5 points
check("6 honors, 5 in 10th grade", calculateUcCappedGpa({ ...base, honorsSemesters: 6, honors10Semesters: 5 }).ucCappedGpa, 3.7 + 5 / 20);
// 6 honors, 3 in 10th grade: nothing over the limit, all 6 count
check("6 honors, 3 in 10th grade", calculateUcCappedGpa({ ...base, honorsSemesters: 6, honors10Semesters: 3 }).ucCappedGpa, 3.7 + 6 / 20);
// 10 honors semesters: the overall cap of 8 applies
check("10 honors, capped at 8", calculateUcCappedGpa({ ...base, honorsSemesters: 10 }).ucCappedGpa, 3.7 + 8 / 20);
// 10 honors, 6 in 10th grade: min(6,4) + 4 = 8 points
check("10 honors, 6 in 10th grade", calculateUcCappedGpa({ ...base, honorsSemesters: 10, honors10Semesters: 6 }).ucCappedGpa, 3.7 + 8 / 20);
// Non-resident: 6 honors of which 4 are school-designated, so only 2 AP/IB semesters count
check("non-resident, 4 of 6 school honors", calculateUcNonResidentGpa({ ...base, honorsSemesters: 6, schoolHonorsSemesters: 4 }).ucCappedGpa, 3.7 + 2 / 20);
// Non-resident with nothing marked school-designated equals the resident calculation
check("non-resident, none school honors", calculateUcNonResidentGpa({ ...base, honorsSemesters: 6 }).ucCappedGpa, 4.0);

process.exit(failed ? 1 : 0);
