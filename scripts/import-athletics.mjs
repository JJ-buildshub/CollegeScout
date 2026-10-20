#!/usr/bin/env node
/**
 * Builds data/athletics.json: the athletic association and division each
 * school in data/colleges.json competes in, and its varsity sports.
 *
 * Usage:
 *   node scripts/import-athletics.mjs <EADA folder> <path-to-IC2024.csv> [--year 2024-25] [--file EADA_2024-2025]
 *
 * <EADA folder> holds instLevel.xlsx and schools.xlsx, unzipped from
 * EADA_2024-2025.zip, the U.S. Department of Education's Equity in Athletics
 * data file: https://ope.ed.gov/athletics/#/datafile/list (direct download:
 * https://ope.ed.gov/athletics/api/dataFiles/file?fileName=EADA_2024-2025.zip).
 * instLevel.xlsx has one row per school, with its classification
 * (classification_name, e.g. "NCAA Division I-FBS"); schools.xlsx has one row
 * per varsity sport per school (Sports, e.g. "Basketball").
 *
 * IC2024.csv is the IPEDS Institutional Characteristics survey,
 * https://nces.ed.gov/ipeds/datacenter/data/IC2024.zip (dictionary:
 * IC2024_Dict.zip). It is used for two things only: the association of a
 * school EADA classifies as "Other" or "Independent", and of a school that is
 * not in the EADA file at all — in both cases from the ASSOC1..ASSOC5
 * membership flags (1 = "Yes"), and only when exactly one is set. IPEDS gives
 * no division and no full sports list, so those schools get the association
 * alone.
 *
 * Neither file is stored in this repo. Schools are matched on `ipedsUnitId`
 * (EADA's `unitid` is the same IPEDS UNITID). A school in neither source, or
 * with no membership in either, simply gets no entry (no guess).
 *
 * This script never writes to data/colleges.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// EADA ClassificationCode -> association and plain division label. The codes
// and their names ("NCAA Division I-FBS", ...) come from the
// classification_name column of the file itself. "with/without football" is
// dropped from the label: football shows (or not) in the sports list.
// NAIA's "Division I"/"Division II" are left out: the NAIA merged its two
// divisions, and the EADA form still offers them, so the label would mislead.
// 8 "Other" and 18 "Independent" name no association; see IPEDS below.
const CLASSIFICATION = {
  1: { association: "NCAA", division: "Division I (FBS)" },
  2: { association: "NCAA", division: "Division I (FCS)" },
  3: { association: "NCAA", division: "Division I" },
  4: { association: "NCAA", division: "Division II" },
  5: { association: "NCAA", division: "Division II" },
  6: { association: "NCAA", division: "Division III" },
  7: { association: "NCAA", division: "Division III" },
  9: { association: "NAIA" },
  10: { association: "NAIA" },
  12: { association: "NJCAA", division: "Division I" },
  13: { association: "NJCAA", division: "Division II" },
  14: { association: "NJCAA", division: "Division III" },
  15: { association: "NCCAA", division: "Division I" },
  16: { association: "NCCAA", division: "Division II" },
  17: { association: "CCCAA" },
  19: { association: "NWAC" },
  20: { association: "USCAA" },
};
// The name each code must carry in the file, so a renumbering is caught.
const EXPECTED_NAME = {
  1: "NCAA Division I-FBS", 2: "NCAA Division I-FCS", 3: "NCAA Division I without football",
  4: "NCAA Division II with football", 5: "NCAA Division II without football",
  6: "NCAA Division III with football", 7: "NCAA Division III without football",
  8: "Other", 9: "NAIA Division I", 10: "NAIA Division II", 12: "NJCAA Division I",
  13: "NJCAA Division II", 14: "NJCAA Division III", 15: "NCCAA Division I",
  16: "NCCAA Division II", 17: "CCCAA", 18: "Independent", 19: "NWAC", 20: "USCAA",
};

// IPEDS IC ASSOC1..ASSOC5 ("Member of National Collegiate Athletic Association
// (NCAA)", ...). ASSOC6 ("other national athletic association not listed")
// names none, so it is not used.
const IPEDS_ASSOC = { ASSOC1: "NCAA", ASSOC2: "NAIA", ASSOC3: "NJCAA", ASSOC4: "NSCAA", ASSOC5: "NCCAA" };

// EADA sport names, reworded where the federal wording is not how a student
// would say it. "Other Sports" names no sport and is left out.
const SPORT_NAMES = {
  "Track and Field and Cross Country (combined)": "Track and field and cross country",
  "Track and Field (Indoor)": "Indoor track and field",
  "Track and Field (Outdoor)": "Outdoor track and field",
  "Swimming and Diving (combined)": "Swimming and diving",
  "Other Sports": null,
};
const sportName = (s) => (s in SPORT_NAMES ? SPORT_NAMES[s] : s.charAt(0) + s.slice(1).toLowerCase());

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : fallback;
};
const year = flag("--year", "2024-25");
const fileName = flag("--file", "EADA_2024-2025");
const [eadaDir, icPath] = args;
if (!eadaDir || !icPath) {
  console.error("Usage: node scripts/import-athletics.mjs <EADA folder> <path-to-IC2024.csv> [--year 2024-25] [--file EADA_2024-2025]");
  process.exit(1);
}

// --- minimal .xlsx reader (an .xlsx is a zip of XML) ------------------------
function unzip(path) {
  const buf = readFileSync(path);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error(`${path} is not a zip file`);
  const entries = new Map();
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = buf.readUInt16LE(eocd + 10); n > 0; n--) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    entries.set(name, () => {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      return (method === 8 ? inflateRawSync(data) : data).toString("utf8");
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}
const XML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const unescapeXml = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : XML_ENTITIES[e] ?? m);
const textOf = (xml) => unescapeXml([...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""));

/** First sheet of an .xlsx as objects keyed by the header row. */
function readXlsx(path) {
  const zip = unzip(path);
  const shared = zip.has("xl/sharedStrings.xml")
    ? [...zip.get("xl/sharedStrings.xml")().matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
    : [];
  const sheet = zip.get("xl/worksheets/sheet1.xml")();
  const colIndex = (ref) => [...ref.match(/^[A-Z]+/)[0]].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const rows = [];
  for (const [, rowXml] of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const [, attrs, body] of rowXml.matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attrs.match(/r="([A-Z]+)\d+"/)[1];
      const type = attrs.match(/t="(\w+)"/)?.[1];
      const v = body?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      row[colIndex(ref)] = type === "s" ? shared[Number(v)] : type === "inlineStr" ? textOf(body) : v === undefined ? "" : unescapeXml(v);
    }
    rows.push(row);
  }
  const [header, ...data] = rows;
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function readCsv(path) {
  const lines = readFileSync(path, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const split = (line) => [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].slice(0, -1).map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"'));
  const header = split(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [header[i], v])));
}

// --- build ------------------------------------------------------------------
const colleges = JSON.parse(readFileSync(join(root, "data", "colleges.json"), "utf8"));
const idByUnit = new Map();
for (const c of colleges) if (c.ipedsUnitId) idByUnit.set(String(c.ipedsUnitId), c.id);

const inst = new Map();
for (const r of readXlsx(join(eadaDir, "instLevel.xlsx"))) {
  const code = Number(r.ClassificationCode);
  if (EXPECTED_NAME[code] !== r.classification_name.trim()) {
    throw new Error(`Unexpected classification ${code} "${r.classification_name}" — check the codes in this script`);
  }
  if (idByUnit.has(String(r.unitid))) inst.set(String(r.unitid), r);
}
const sportsByUnit = new Map();
for (const r of readXlsx(join(eadaDir, "schools.xlsx"))) {
  const unit = String(r.unitid);
  if (!idByUnit.has(unit)) continue;
  const name = sportName(r.Sports.trim());
  if (!name) continue;
  if (!sportsByUnit.has(unit)) sportsByUnit.set(unit, new Set());
  sportsByUnit.get(unit).add(name);
}
const ic = new Map(readCsv(icPath).filter((r) => idByUnit.has(r.UNITID)).map((r) => [r.UNITID, r]));

function ipedsAssociation(unit) {
  const r = ic.get(unit);
  if (!r) return null;
  const yes = Object.keys(IPEDS_ASSOC).filter((k) => r[k] === "1");
  return yes.length === 1 ? IPEDS_ASSOC[yes[0]] : null;
}

const byCollege = {};
const fromIpeds = [];
const skipped = [];
for (const [unit, id] of idByUnit) {
  const e = inst.get(unit);
  let entry = null;
  if (e) {
    const known = CLASSIFICATION[Number(e.ClassificationCode)];
    const association = known?.association ?? ipedsAssociation(unit);
    if (association) {
      entry = { association };
      if (known?.division) entry.division = known.division;
      if (!known) fromIpeds.push(`${id} (EADA: ${e.classification_name.trim()}${e.ClassificationOther ? `, "${e.ClassificationOther.trim()}"` : ""})`);
      const icRow = ic.get(unit);
      const flagFor = Object.keys(IPEDS_ASSOC).find((k) => IPEDS_ASSOC[k] === association);
      if (known && icRow && flagFor && icRow[flagFor] !== "1") console.log(`Note: ${id} — EADA says ${association}, IPEDS ${flagFor} is ${icRow[flagFor]}`);
    } else skipped.push(`${id} (EADA: ${e.classification_name.trim()}, no single IPEDS association)`);
    const sports = sportsByUnit.get(unit);
    if (entry && sports?.size) entry.sports = [...sports].sort((a, b) => a.localeCompare(b));
  } else {
    const association = ipedsAssociation(unit);
    if (association) {
      entry = { association };
      fromIpeds.push(`${id} (not in EADA)`);
    }
  }
  if (entry) byCollege[id] = entry;
}

const sorted = Object.fromEntries(Object.entries(byCollege).sort(([a], [b]) => a.localeCompare(b)));
const out = {
  source: `U.S. Department of Education, Equity in Athletics Data Analysis (EADA), ${fileName}.zip (instLevel.xlsx, schools.xlsx), https://ope.ed.gov/athletics/#/datafile/list; association only, where EADA names none or lacks the school: IPEDS Institutional Characteristics survey, IC2024.csv, https://nces.ed.gov/ipeds/datacenter/data/IC2024.zip`,
  year,
  byCollege: sorted,
};
writeFileSync(join(root, "data", "athletics.json"), JSON.stringify(out, null, 1) + "\n");

const counts = {};
for (const e of Object.values(sorted)) {
  const k = e.division ? `${e.association} ${e.division}` : e.association;
  counts[k] = (counts[k] ?? 0) + 1;
}
console.log(`Wrote data/athletics.json: ${Object.keys(sorted).length} of ${colleges.length} schools have an entry.`);
for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${n}`);
if (fromIpeds.length) console.log(`Association from IPEDS only: ${fromIpeds.join("; ")}`);
if (skipped.length) console.log(`Left out: ${skipped.join("; ")}`);
const none = colleges.filter((c) => !sorted[c.id]).map((c) => c.id);
if (none.length) console.log(`No entry: ${none.join(", ")}`);
