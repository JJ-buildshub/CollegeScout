#!/usr/bin/env node
/**
 * Checks that every page line quoted in data/scholarships.json still appears,
 * word for word, on the sponsoring organization's own page. Run it after
 * editing the file and again each summer: a line that no longer matches means
 * the organization changed an amount, a requirement or a deadline.
 *
 * A program's facts usually sit on more than one page (eligibility on one, how
 * to apply on another), so each program lists several sources and each source
 * is checked against its own page.
 *
 * Usage: node scripts/check-scholarships.mjs [file]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkEntries } from "./page-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2] ?? join(root, "data", "scholarships.json");
const data = JSON.parse(readFileSync(file, "utf8"));

const entries = {};
// `changed` holds programs we list only to say their rules changed; same source shape.
for (const [id, program] of Object.entries({ ...data.programs, ...(data.changed ?? {}) })) {
  program.sources.forEach((source, i) => {
    entries[program.sources.length > 1 ? `${id} #${i + 1}` : id] = source;
  });
}
process.exit(await checkEntries(entries, data.checked));
