#!/usr/bin/env node
/**
 * Checks that every line quoted in data/pathways.json still appears, word for
 * word, on the official page it came from. A line that no longer matches means
 * a school changed a requirement, a date or a policy, and the pathway page
 * needs another look.
 *
 * Usage: node scripts/check-pathways.mjs [file]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkEntries } from "./page-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2] ?? join(root, "data", "pathways.json");
const data = JSON.parse(readFileSync(file, "utf8"));

const entries = {};
for (const [slug, page] of Object.entries(data.pages)) {
  for (const source of page.sources) {
    entries[`${slug}: ${source.label}`] = source;
  }
}
process.exit(await checkEntries(entries, data.checked));
