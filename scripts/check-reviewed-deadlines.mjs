#!/usr/bin/env node
/**
 * Checks that every page line quoted in data/reviewed-deadlines.json still
 * appears, word for word, on the school's own page. Run it after editing the
 * file and again each admissions cycle: a line that no longer matches means the
 * school changed its dates.
 *
 * Usage: node scripts/check-reviewed-deadlines.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data", "reviewed-deadlines.json"), "utf8"));

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', mdash: "-", ndash: "-" };
function normalize(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[\ufffd\ud800-\udfff\u200b\u00a0]/g, " ")
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/ ([.,;:)])/g, "$1")
    .replace(/\( /g, "(")
    .trim()
    .toLowerCase();
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
async function download(url) {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (res.ok) return await res.text();
  } catch {
    // fall through to curl
  }
  try {
    return execFileSync("curl", ["-sL", "--fail", "-A", UA, url], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
  } catch {
    return null;
  }
}

let checked = 0;
let failed = 0;
for (const [id, entry] of Object.entries(data.schools)) {
  const body = await download(entry.url);
  const page = body === null ? null : normalize(body);
  for (const line of entry.evidence) {
    checked += 1;
    if (page === null) {
      failed += 1;
      console.log(`[${id}] could not load ${entry.url}`);
      break;
    }
    if (!page.includes(normalize(line))) {
      failed += 1;
      console.log(`[${id}] NOT FOUND: "${line.slice(0, 90)}"`);
    }
  }
}
console.log(`\n${checked - failed} of ${checked} lines matched their school page word for word.`);
process.exit(failed ? 1 : 0);
