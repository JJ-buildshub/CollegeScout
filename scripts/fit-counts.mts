// Prints Likely/Target/Reach/Not-enough-data counts for a few GPAs (and
// optionally SAT scores). Run: node --experimental-strip-types scripts/fit-counts.mts [homeState|none] [sat,sat,...]
import { readFileSync } from "node:fs";
import { evaluateCollegeFit, calculateUcCappedGpa } from "../lib/gpa.ts";

const list = JSON.parse(readFileSync(new URL("../data/colleges.json", import.meta.url), "utf8"));
const state = process.argv[2] === "none" ? null : (process.argv[2] ?? "CA");
const sats: (number | undefined)[] = process.argv[3] ? process.argv[3].split(",").map(Number) : [undefined];

for (const gpa of [3.3, 3.5, 3.7, 3.9]) {
  const capped = calculateUcCappedGpa({ unweightedGpa: gpa, totalSemesters: 20, honorsSemesters: 6 }).ucCappedGpa;
  for (const sat of sats) {
    const c: Record<string, number> = { Safety: 0, Target: 0, Reach: 0, Unrated: 0 };
    for (const col of list) {
      const r = evaluateCollegeFit(col, capped, gpa, undefined, state, sat);
      if (r) c[r.category] += 1;
    }
    console.log(
      `GPA ${gpa}${sat ? ` + SAT ${sat}` : "          "}: likely ${c.Safety} · target ${c.Target} · reach ${c.Reach} · not enough data ${c.Unrated}`
    );
  }
}
