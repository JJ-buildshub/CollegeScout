#!/usr/bin/env node
/**
 * Builds data/programs.json: how many bachelor's degrees each school in
 * data/colleges.json awarded per field, from the IPEDS Completions survey.
 *
 * Usage:
 *   node scripts/import-programs.mjs <path-to-C2023_a.csv> [--year 2022-23] [--file C2023_A] [--cip <path-to-CIPCode2020.csv>]
 *
 * With --cip it also writes data/majors.json: every major each school awarded
 * bachelor's degrees in, largest first. That file needs the names of the
 * majors, which the completions file does not carry — they come from
 * https://nces.ed.gov/ipeds/cipcode/Files/CIPCode2020.csv (not stored here).
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

// The federal names are written for classification, not for a family reading a
// school page: "Registered Nursing/Registered Nurse", "Biology/Biological
// Sciences, General". These are the ones that turn up most in schools' top
// tens, reworded to what the major is ordinarily called. Nothing here renames a
// major to a particular school's own title for it — that would need each
// school's catalogue. Everything not listed keeps its federal name, minus a
// trailing ", General" and with ", Other" turned into "(other)".
export const MAJOR_NAMES = {
  "04.0902": "Architectural Sciences and Technology",
  "09.0102": "Media Studies",
  "09.0702": "Digital Media",
  "09.0900": "Public Relations and Advertising",
  "09.0902": "Public Relations",
  "10.0304": "Animation and Interactive Media",
  "11.0101": "Computer and Information Sciences",
  "11.0401": "Information Science",
  "11.1003": "Cybersecurity",
  "14.0201": "Aerospace Engineering",
  "14.0501": "Biomedical Engineering",
  "14.1001": "Electrical Engineering",
  "14.1401": "Environmental Engineering",
  "15.1501": "Engineering Management",
  "23.0101": "English",
  "24.0101": "Liberal Arts and Sciences",
  "26.0101": "Biology",
  "26.0406": "Cell and Molecular Biology",
  "30.2001": "International Studies",
  "30.0000": "Interdisciplinary Studies",
  "30.9999": "Interdisciplinary Studies (other)",
  "31.0501": "Kinesiology and Physical Education",
  "31.0504": "Sport Management",
  "42.2799": "Research and Experimental Psychology",
  "43.0103": "Criminal Justice Administration",
  "43.0104": "Criminal Justice",
  "45.0603": "Quantitative Economics",
  "45.1001": "Political Science",
  "49.0101": "Aviation",
  "50.0407": "Fashion Design",
  "50.0501": "Theatre",
  "50.0601": "Film and Media Studies",
  "50.0602": "Film and Video Production",
  "50.0701": "Art",
  "50.0702": "Studio Art",
  "50.0910": "Jazz Studies",
  "51.0000": "Health Sciences",
  "51.0204": "Speech-Language Pathology and Audiology",
  "51.0701": "Health Care Administration",
  "51.3801": "Nursing",
  "51.3899": "Nursing",
  "52.0101": "Business",
  "52.0201": "Business Administration",
  "52.0203": "Supply Chain Management",
  "52.0601": "Business Economics",
  "52.0701": "Entrepreneurship",
  "52.1101": "International Business",
  "52.1401": "Marketing",
};

export function majorName(cip, federalTitle) {
  if (MAJOR_NAMES[cip]) return MAJOR_NAMES[cip];
  return federalTitle
    .replace(/\.$/, "")
    .replace(/, General$/, "")
    .replace(/, Other$/, " (other)");
}

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
const cipPath = opt("cip", null);

// CIPCode2020.csv rows look like: ="14",="14.1901","No substantive changes",no,"Mechanical Engineering.",...
const federalTitles = new Map();
if (cipPath) {
  for (const line of readFileSync(cipPath, "utf8").split(/\r?\n/).slice(1)) {
    const m = line.match(/^="[^"]*",="([^"]*)",(?:"[^"]*"|[^,]*),(?:"[^"]*"|[^,]*),"((?:[^"]|"")*)"/);
    if (m) federalTitles.set(m[1], m[2].replace(/""/g, '"'));
  }
  if (federalTitles.size === 0) throw new Error(`No major names read from ${cipPath} — is this CIPCode2020.csv?`);
}

const colleges = JSON.parse(readFileSync(join(root, "data", "colleges.json"), "utf8"));
const idByUnit = new Map();
for (const c of colleges) if (c.ipedsUnitId) idByUnit.set(String(c.ipedsUnitId), c.id);

const totals = new Map(); // college id -> { field -> degrees }
const majors = new Map(); // college id -> Map(CIP code -> degrees)
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
  const m = majors.get(collegeId) ?? new Map();
  m.set(cip, (m.get(cip) ?? 0) + n);
  majors.set(collegeId, m);
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

if (cipPath) {
  // Largest first; the code breaks ties so a re-run never reshuffles a list.
  // Only the order is kept, not the counts: the site shows which majors are a
  // school's biggest, and a count would invite comparing a 1,800-graduate
  // school against a 9,000-graduate one.
  const majorsByCollege = {};
  const names = {};
  const unnamed = new Set();
  for (const c of colleges) {
    const m = majors.get(c.id);
    if (!m) continue;
    const ordered = [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([cip]) => cip);
    for (const cip of ordered) {
      const title = federalTitles.get(cip);
      if (!title) unnamed.add(cip);
      else names[cip] = majorName(cip, title);
    }
    majorsByCollege[c.id] = ordered.filter((cip) => names[cip]);
  }
  const majorsOut = {
    source: `IPEDS Completions survey, ${fileName} (bachelor's degrees awarded)`,
    year,
    note: "Each school's majors, ordered by bachelor's degrees awarded in the year, largest first; first and second majors both counted. Names are federal CIP 2020 categories, reworded where the federal wording is unwieldy (see MAJOR_NAMES in scripts/import-programs.mjs) — not each school's own name for the major.",
    names: Object.fromEntries(Object.entries(names).sort(([a], [b]) => a.localeCompare(b))),
    byCollege: majorsByCollege,
  };
  writeFileSync(join(root, "data", "majors.json"), JSON.stringify(majorsOut) + "\n");
  console.log(`Wrote data/majors.json: ${Object.keys(majorsByCollege).length} schools, ${Object.keys(names).length} distinct majors.`);
  if (unnamed.size) console.log(`No name in the CIP file for: ${[...unnamed].join(", ")} (left out)`);
}

const missing = colleges.filter((c) => !byCollege[c.id]);
console.log(`Wrote data/programs.json: ${Object.keys(byCollege).length} of ${colleges.length} schools have degree data.`);
if (missing.length) console.log(`No bachelor's degree rows for: ${missing.map((c) => c.id).join(", ")}`);
