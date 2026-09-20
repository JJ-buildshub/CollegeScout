#!/usr/bin/env node
/**
 * Checks that every page line quoted in data/reviewed-deadlines.json still
 * appears, word for word, on the school's own page. Run it after editing the
 * file and again each admissions cycle: a line that no longer matches means the
 * school changed its dates.
 *
 * Usage: node scripts/check-reviewed-deadlines.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkEntries } from "./page-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data", "reviewed-deadlines.json"), "utf8"));
process.exit(await checkEntries(data.schools, data.checked));
