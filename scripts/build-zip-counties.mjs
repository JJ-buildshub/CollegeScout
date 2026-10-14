#!/usr/bin/env node
/**
 * Builds data/zip-counties.json, the table the scholarships page uses to turn
 * a student's ZIP code into the counties it covers. Nothing leaves the browser:
 * the lookup is this file, shipped with the page.
 *
 * Source: the Census Bureau's 2020 ZCTA-to-county relationship file,
 *   https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt
 * Download it, then run:
 *   node scripts/build-zip-counties.mjs <path to that file> [state FIPS codes, default 06]
 *
 * ZCTAs are the Census Bureau's areas for ZIP codes that deliver to homes. A
 * ZIP used only for PO boxes or one large organization has no ZCTA and is not
 * in the table; the page says so when a ZIP is not found. A ZCTA that crosses a
 * county line lists every county it has land in, largest share first.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const STATE_NAMES = { "06": "CA" };

const [source, statesArg = "06"] = process.argv.slice(2);
if (!source) {
  console.error("Usage: node scripts/build-zip-counties.mjs <relationship file> [state FIPS codes]");
  process.exit(1);
}
const states = new Set(statesArg.split(","));

const rows = readFileSync(source, "utf8").replace(/^﻿/, "").split(/\r?\n/);
const header = rows[0].split("|");
const col = (name) => header.indexOf(name);
const [zctaCol, countyIdCol, countyNameCol, landCol] = [
  col("GEOID_ZCTA5_20"),
  col("GEOID_COUNTY_20"),
  col("NAMELSAD_COUNTY_20"),
  col("AREALAND_PART"),
];

const byZip = new Map();
for (const row of rows.slice(1)) {
  const f = row.split("|");
  const zip = f[zctaCol];
  const countyId = f[countyIdCol];
  const land = Number(f[landCol]);
  if (!zip || !countyId || !(land > 0)) continue;
  const fips = countyId.slice(0, 2);
  if (!states.has(fips)) continue;
  const county = f[countyNameCol].replace(/ County$/, "");
  if (!byZip.has(zip)) byZip.set(zip, { state: STATE_NAMES[fips] ?? fips, parts: [] });
  byZip.get(zip).parts.push({ county, land });
}

const zips = {};
for (const zip of [...byZip.keys()].sort()) {
  const { state, parts } = byZip.get(zip);
  zips[zip] = [state, ...parts.sort((a, b) => b.land - a.land).map((p) => p.county)];
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "data", "zip-counties.json");
writeFileSync(
  out,
  JSON.stringify({
    note: "ZIP code (Census ZCTA) to [state, county, ...], largest land share first. Built by scripts/build-zip-counties.mjs from the Census Bureau's 2020 ZCTA-to-county relationship file.",
    zips,
  }) + "\n"
);
console.log(`${Object.keys(zips).length} ZIP codes written to data/zip-counties.json`);
