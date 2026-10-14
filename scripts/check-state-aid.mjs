#!/usr/bin/env node
/**
 * Checks that every page line quoted in data/state-aid.json still appears,
 * word for word, on the page of the agency that runs the program. Run it after
 * editing the file and again each award year: a line that no longer matches
 * means the state changed an amount, a ceiling or a deadline.
 *
 * Usage: node scripts/check-state-aid.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkEntries } from "./page-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data", "state-aid.json"), "utf8"));

const entries = {};
for (const [state, { programs }] of Object.entries(data.states)) {
  for (const [id, program] of Object.entries(programs)) entries[`${state}/${id}`] = program;
}
process.exit(await checkEntries(entries, data.checked));
