// Checks calculateCsuGpa against results from CSU's own GPA calculator
// (https://www.calstate.edu/apply/gpa-calculator), entered with made-up numbers
// on 2026-09-19. Run: node --experimental-strip-types scripts/check-csu-gpa.mts
import { calculateCsuGpa } from "../lib/gpa.ts";

// [inputs, CSU's countTotal, CSU's pointTotal, CSU's displayed GPA]
const cases: [Parameters<typeof calculateCsuGpa>[0], number, number, string][] = [
  [{ a: 4, b: 3, c: 1, d: 0, f: 0, honors10: 0, honors1112: 4 }, 8, 31, "3.88"],
  [{ a: 5, b: 5, c: 0, d: 2, f: 1, honors10: 0, honors1112: 6 }, 13, 43, "3.31"],
  // Honors entered beyond the cap of 8: CSU counted 8 points (48, not 50).
  [{ a: 10, b: 0, c: 0, d: 0, f: 0, honors10: 0, honors1112: 10 }, 10, 48, "4.8"],
];

let failed = 0;
for (const [input, count, points, shown] of cases) {
  const r = calculateCsuGpa(input);
  const total = r.gradePoints + r.honorsPoints;
  const display = String(Math.round((r.gpa ?? 0) * 100) / 100);
  const ok = r.gradeCount === count && total === points && display === shown;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} count ${r.gradeCount} (CSU ${count}), points ${total} (CSU ${points}), GPA ${display} (CSU ${shown})`);
}
process.exit(failed ? 1 : 0);
