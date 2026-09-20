#!/usr/bin/env node
/**
 * Checks that every quoted prompt in data/applications.json still appears,
 * word for word, on the school page it was taken from. Run it after editing
 * the file and again each summer: a prompt that no longer matches has
 * probably been changed or removed by the school.
 *
 * Usage: node scripts/check-applications.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data", "applications.json"), "utf8"));

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', mdash: "-", ndash: "-", hellip: "..." };
function normalize(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const pages = new Map();
async function pageText(url) {
  if (!pages.has(url)) {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (CollegeScout prompt check)" } });
    pages.set(url, res.ok ? normalize(await res.text()) : null);
  }
  return pages.get(url);
}

let checked = 0;
let failed = 0;
const seen = new Set();
for (const [id, info] of Object.entries(data.byCollege)) {
  const key = info.source.url + JSON.stringify(info);
  if (seen.has(key)) continue; // identical entries (e.g. every UC campus) share one check
  seen.add(key);
  const text = await pageText(info.source.url);
  const items = [info.mainEssay, ...info.requiredWriting, ...info.optionalWriting];
  for (const item of items) {
    for (const prompt of item.prompts) {
      checked += 1;
      if (text === null) {
        failed += 1;
        console.log(`[${id}] could not load ${info.source.url}`);
        break;
      }
      if (!text.includes(normalize(prompt))) {
        failed += 1;
        console.log(`[${id}] NOT FOUND on page: "${prompt.slice(0, 70)}..."`);
      }
    }
  }
}
console.log(`\n${checked - failed} of ${checked} prompts matched their source page word for word.`);
process.exit(failed ? 1 : 0);
