#!/usr/bin/env node
/**
 * Checks that every line quoted in data/pathways.json and
 * data/college-talent.json still appears, word for word, on the official page
 * it came from. A line that no longer matches means
 * a school changed a requirement, a date or a policy, and the pathway page
 * needs another look.
 *
 * Usage: node scripts/check-pathways.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkEntries } from "./page-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data", "pathways.json"), "utf8"));
const talent = JSON.parse(readFileSync(join(root, "data", "college-talent.json"), "utf8"));

const entries = {};
for (const [slug, page] of Object.entries(data.pages)) {
  for (const source of page.sources) {
    entries[`${slug}: ${source.label}`] = source;
  }
}
for (const [collegeId, college] of Object.entries(talent.colleges)) {
  for (const [kind, facts] of Object.entries(college)) {
    facts.forEach((fact, i) => {
      for (const source of fact.sources) {
        entries[`${collegeId} ${kind} #${i + 1}: ${source.label}`] = source;
      }
    });
  }
}
process.exit(await checkEntries(entries, data.checked));
