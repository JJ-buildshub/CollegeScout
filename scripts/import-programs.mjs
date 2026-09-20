#!/usr/bin/env node
/**
 * Builds data/programs.json: how many bachelor's degrees each school in
 * data/colleges.json awarded per field, from the IPEDS Completions survey.
 *
 * Usage:
 *   node scripts/import-programs.mjs <path-to-C2023_a.csv> [--year 2022-23] [--file C2023_A]
 *
 * The CSV comes from https://nces.ed.gov/ipeds/datacenter/data/C2023_A.zip
 * (unzip it first). It is not stored in this repo. Schools are matched on
 * `ipedsUnitId`, so re-run this whenever schools are added to colleges.json —
 * nothing else needs to change. Only bachelor's degrees (AWLEVEL 5) count;
 * first and second majors are both summed, so a double major appears in each
 * field. A school missing from the survey simply gets no entry (no guess).
 *
 * This script never writes to data/colleges.json.
 */
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Field key -> CIP code prefixes (IPEDS Classification of Instructional
// Programs). A key is what lib/interests.ts refers to; the codes live only
// here, so changing what counts as e.g. "data science" is a one-line edit.
export const FIELDS = {
  business: ["52"],
  finance: ["52.03", "52.08"],
  entrepreneurship: ["52.07"],
  health: ["51"],
  nursing: ["51.38"],
  psychology: ["42"],
  biology: ["26"],
  engineering: ["14"],
  computing: ["11"],
  "data-science": ["30.70", "30.71", "27.05"],
  education: ["13"],
  kinesiology: ["31.05", "26.0908"],
  "social-sciences": ["45"],
  "performing-arts": ["50.03", "50.05", "50.09"],
  music: ["50.09"],
  "visual-arts": ["50.04", "50.06", "50.07"],
  architecture: ["04"],
  communication: ["09"],
};

const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith("--"));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
if (!csvPath) {
  console.error("Usage: node scripts/import-programs.mjs <path-to-C2023_a.csv> [--year 2022-23] [--file C2023_A]");
  process.exit(1);
}
const year = opt("year", "2022-23");
const fileName = opt("file", "C2023_A");

const colleges = JSON.parse(readFileSync(join(root, "data", "colleges.json"), "utf8"));
const idByUnit = new Map();
for (const c of colleges) if (c.ipedsUnitId) idByUnit.set(String(c.ipedsUnitId), c.id);

const totals = new Map(); // college id -> { field -> degrees }
let header = null;
let idx = {};

const rl = createInterface({ input: createReadStream(csvPath, { encoding: "utf8" }), crlfDelay: Infinity });
for await (const raw of rl) {
  const line = raw.replace(/^﻿/, "");
  if (!header) {
    header = line.split(",");
    for (const col of ["UNITID", "CIPCODE", "AWLEVEL", "CTOTALT"]) {
      idx[col] = header.indexOf(col);
      if (idx[col] === -1) throw new Error(`Column ${col} not found — is this an IPEDS Completions (C..._A) file?`);
    }
    continue;
  }
  // Fields in this file are plain tokens; only some are quoted, none contain commas.
  const f = line.split(",").map((s) => s.replace(/^"|"$/g, ""));
  if (f[idx.AWLEVEL] !== "5") continue;
  const collegeId = idByUnit.get(f[idx.UNITID]);
  if (!collegeId) continue;
  const cip = f[idx.CIPCODE];
  const n = parseInt(f[idx.CTOTALT], 10);
  if (!Number.isFinite(n) || n <= 0 || cip.startsWith("99")) continue;
  for (const [key, prefixes] of Object.entries(FIELDS)) {
    if (prefixes.some((p) => cip.startsWith(p))) {
      const t = totals.get(collegeId) ?? {};
      t[key] = (t[key] ?? 0) + n;
      totals.set(collegeId, t);
    }
  }
}

const byCollege = {};
for (const c of colleges) {
  const t = totals.get(c.id);
  if (t) byCollege[c.id] = Object.fromEntries(Object.entries(t).sort(([a], [b]) => a.localeCompare(b)));
}

const out = {
  source: `IPEDS Completions survey, ${fileName} (bachelor's degrees awarded)`,
  year,
  note: "Degrees awarded in the year, by field. First and second majors both counted. A missing school or field means none were reported.",
  fields: FIELDS,
  byCollege,
};
writeFileSync(join(root, "data", "programs.json"), JSON.stringify(out, null, 1) + "\n");

const missing = colleges.filter((c) => !byCollege[c.id]);
console.log(`Wrote data/programs.json: ${Object.keys(byCollege).length} of ${colleges.length} schools have degree data.`);
if (missing.length) console.log(`No bachelor's degree rows for: ${missing.map((c) => c.id).join(", ")}`);
