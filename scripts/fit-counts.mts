import { readFileSync } from "node:fs";
import { evaluateCollegeFit, calculateUcCappedGpa } from "../lib/gpa.ts";
const list = JSON.parse(readFileSync(new URL("../data/colleges.json", import.meta.url), "utf8"));
const state = process.argv[2] === "none" ? null : (process.argv[2] ?? "CA");
for (const gpa of [3.3, 3.5, 3.7, 3.9]) {
  const capped = calculateUcCappedGpa({ unweightedGpa: gpa, totalSemesters: 20, honorsSemesters: 6 }).ucCappedGpa;
  const c: Record<string, string[]> = { Safety: [], Target: [], Reach: [], Unrated: [] };
  for (const col of list) {
    const r = evaluateCollegeFit(col, capped, gpa, undefined, state);
    if (r) c[r.category].push(col.name);
  }
  console.log(gpa, `likely ${c.Safety.length} · target ${c.Target.length} · reach ${c.Reach.length} · no GPA range ${c.Unrated.length}`);
  if (process.argv[3]) console.log("  Likely:", c.Safety.join("; "));
}
