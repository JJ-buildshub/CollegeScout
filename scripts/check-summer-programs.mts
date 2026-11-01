#!/usr/bin/env node
/**
 * Checks every Summer Opportunities listing against its official pages: each line quoted in
 * summerProgramSources should still appear word for word. Run daily by
 * .github/workflows/summer-programs-check.yml, because these deadlines fall within weeks and blank ones
 * get filled in as programs post their 2027 dates.
 *
 * Fails on a changed line (the deadline, date or price may have moved), a page that is gone (404 or 410),
 * or a program with no sources. A page that refuses the request (403, 429, a timeout) says nothing about
 * the listing, so it is only reported in the log, unless so many refuse that the run proved nothing.
 *
 * Usage: node --experimental-strip-types scripts/check-summer-programs.mts
 */
import { execFileSync } from "node:child_process";
import { summerPrograms, summerProgramSources } from "../data/summerPrograms.ts";
import { normalize, UA } from "./page-check.mjs";

type Page = { status: number; body: string | null };

async function fetchOnce(url: string): Promise<Page> {
  let status = 0;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA } });
    status = res.status;
    if (res.ok) return { status, body: await res.text() };
  } catch {
    // fall through to curl
  }
  try {
    const out = execFileSync("curl", ["-sL", "--max-time", "30", "-A", UA, "-w", "\n%{http_code}", url], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
    const split = out.lastIndexOf("\n");
    const curlStatus = Number(out.slice(split + 1));
    return curlStatus >= 200 && curlStatus < 300 ? { status: curlStatus, body: out.slice(0, split) } : { status: curlStatus || status, body: null };
  } catch {
    return { status, body: null };
  }
}

/** One spaced retry, since some hosts refuse a request when several arrive close together. */
async function load(url: string): Promise<Page> {
  const first = await fetchOnce(url);
  if (first.body !== null) return first;
  await new Promise((resolve) => setTimeout(resolve, 8000));
  return fetchOnce(url);
}

const problems: string[] = [];
const refused: string[] = [];
const pages = new Map<string, Page>();
let lines = 0;
let matched = 0;

for (const program of summerPrograms) {
  const sources = summerProgramSources[program.id];
  if (!sources?.length) {
    problems.push(`[${program.id}] NO SOURCES: add it to summerProgramSources`);
    continue;
  }
  for (const source of sources) {
    if (!pages.has(source.url)) pages.set(source.url, await load(source.url));
    const page = pages.get(source.url)!;
    lines += source.evidence.length;
    if (page.body === null) {
      if (page.status === 404 || page.status === 410) problems.push(`[${program.id}] PAGE GONE (HTTP ${page.status}): ${source.url}`);
      else refused.push(`[${program.id}] could not load (HTTP ${page.status || "no response"}): ${source.url}`);
      continue;
    }
    const text = normalize(page.body);
    for (const line of source.evidence) {
      if (text.includes(normalize(line))) matched += 1;
      else problems.push(`[${program.id}] NOT FOUND on ${source.url}: "${line}"`);
    }
  }
}

const known = new Set(summerPrograms.map((p) => p.id));
for (const id of Object.keys(summerProgramSources)) {
  if (!known.has(id)) problems.push(`[${id}] NO SUCH PROGRAM: remove it from summerProgramSources`);
}

const blocked = [...pages.values()].filter((p) => p.body === null).length;
if (blocked > pages.size / 2) problems.push(`[all] MOST PAGES REFUSED: ${blocked} of ${pages.size} would not load, so this run proved nothing`);

refused.forEach((line) => console.log(line));
problems.forEach((line) => console.log(line));
console.log(`\n${matched} of ${lines} lines matched across ${pages.size} pages. ${problems.length} problems, ${refused.length} not reachable today.`);
process.exit(problems.length ? 1 : 0);
