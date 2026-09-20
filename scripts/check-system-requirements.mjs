#!/usr/bin/env node
/**
 * Checks that every quoted line in data/system-requirements.json still appears,
 * word for word, on the official page it came from. Run it after editing the
 * file and again each admissions cycle: a line that no longer matches means the
 * system changed its rules.
 *
 * Usage: node scripts/check-system-requirements.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data", "system-requirements.json"), "utf8"));

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', mdash: "-", ndash: "-" };
function normalize(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[\ufffd\ud800-\udfff\u200b]/g, "")
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    // The pages put stray spaces around bold text ("counts twice ." / "( 2 points)"), so ignore them.
    .replace(/ ([.,;:)])/g, "$1")
    .replace(/\( /g, "(")
    .trim()
    .toLowerCase();
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const pages = new Map();

// Some sites (calstate.edu among them) refuse Node's fetch but serve a normal
// curl request, so fall back to curl when fetch is refused.
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

async function pageText(url) {
  if (!pages.has(url)) {
    const body = await download(url);
    pages.set(url, body === null ? null : normalize(body));
  }
  return pages.get(url);
}

let checked = 0;
let failed = 0;
for (const [system, info] of Object.entries(data.systems)) {
  const lines = [];
  const add = (source, text) => text && lines.push([source, text]);
  add(info.courseRule.source, info.courseRule.text);
  for (const c of info.courses) add("main", c.text);
  for (const l of info.gpa.lines) add(info.gpa.source, l);
  add(info.supplementalFactors.source, info.supplementalFactors.intro);
  for (const i of info.supplementalFactors.items) add(info.supplementalFactors.source, i);
  for (const l of info.honors.lines) add(info.honors.source, l);
  for (const l of info.graduation.lines) add(info.graduation.source, l);
  add(info.residency.source, info.residency.text);
  add(info.testing.source, info.testing.text);
  if (info.gpaMethod) {
    add(info.gpaMethod.source, info.gpaMethod.intro);
    for (const step of info.gpaMethod.steps) for (const l of step.lines) add(info.gpaMethod.source, l);
  }

  for (const [source, text] of lines) {
    checked += 1;
    const page = await pageText(info.sources[source]);
    if (page === null) {
      failed += 1;
      console.log(`[${system}] could not load ${info.sources[source]}`);
    } else if (!page.includes(normalize(text))) {
      failed += 1;
      console.log(`[${system}] NOT FOUND on ${source} page: "${text.slice(0, 80)}..."`);
    }
  }
}
console.log(`\n${checked - failed} of ${checked} lines matched their source page word for word.`);
process.exit(failed ? 1 : 0);
