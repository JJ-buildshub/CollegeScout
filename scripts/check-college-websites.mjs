// Checks that every college's `website` URL in data/colleges.json actually
// loads, and flags any that redirect to a different domain than the one
// stored (a common sign the URL is stale, wrong, or hijacked).
//
// Usage: node scripts/check-college-websites.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "data", "colleges.json");
const colleges = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 4;

function baseDomain(hostname) {
  const parts = hostname.split(".");
  return parts.slice(-2).join(".");
}

async function checkOne(college) {
  const { id, name, website } = college;
  if (!website) {
    return { id, name, website, status: "skipped", detail: "No website on record" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(website, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // A realistic browser UA + headers, since some university WAFs (Akamai
        // etc.) 403 anything that looks like a bare script — this cuts false
        // positives, though a handful of schools still block automated
        // requests from datacenter IPs regardless (see README note below).
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);

    const originalHost = new URL(website).hostname;
    const finalHost = new URL(res.url).hostname;
    const domainChanged = baseDomain(originalHost) !== baseDomain(finalHost);

    if (!res.ok) {
      return { id, name, website, status: "fail", detail: `HTTP ${res.status} ${res.statusText}` };
    }
    if (domainChanged) {
      return {
        id,
        name,
        website,
        status: "domain-changed",
        detail: `Redirected from ${originalHost} to ${finalHost}`,
      };
    }
    return { id, name, website, status: "ok", detail: `HTTP ${res.status}, final URL ${res.url}` };
  } catch (err) {
    clearTimeout(timer);
    return { id, name, website, status: "error", detail: err.name === "AbortError" ? "Timed out" : err.message };
  }
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner));
  return results;
}

const results = await runPool(colleges, checkOne, CONCURRENCY);

const ok = results.filter((r) => r.status === "ok");
const problems = results.filter((r) => r.status !== "ok" && r.status !== "skipped");
const skipped = results.filter((r) => r.status === "skipped");

console.log(`Checked ${results.length} colleges: ${ok.length} ok, ${problems.length} problem(s), ${skipped.length} skipped (no URL).\n`);

if (problems.length > 0) {
  console.log("PROBLEMS:");
  for (const r of problems) {
    console.log(`- [${r.status}] ${r.name} (${r.id}) — ${r.website} — ${r.detail}`);
  }
}

if (skipped.length > 0) {
  console.log("\nSKIPPED (no website on record):");
  for (const r of skipped) {
    console.log(`- ${r.name} (${r.id})`);
  }
}

process.exit(problems.length > 0 ? 1 : 0);
