// Playwright screenshot helper for manual/visual verification of Find My
// Fit — opens the running dev server, drives the state dropdown and GPA
// inputs, and saves full-page (or element) screenshots to screenshots/.
//
// Usage:
//   node scripts/screenshots.mjs
//
// Requires the dev server already running at BASE_URL (default
// http://localhost:3000). Requires `npx playwright install chromium` to
// have been run once first.

import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function shot(page, name, opts = {}) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true, ...opts });
  console.log(`[screenshots] saved ${name}.png`);
}

/** The matcher page has exactly one <select> (home state); everywhere else uses buttons. */
async function setHomeState(page, label) {
  await page.locator("select").selectOption({ label });
  await page.waitForTimeout(150);
}

/** Unweighted GPA is the only number input outside the (possibly collapsed) UC section, so it's unambiguous even when that section is closed. */
async function setUnweightedGpa(page, value) {
  const input = page.locator('input[type="number"]').first();
  await input.fill(String(value));
  await input.blur();
  await page.waitForTimeout(150);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

  await page.goto(`${BASE_URL}/matcher`, { waitUntil: "networkidle" });
  await shot(page, "01-matcher-default");

  // Verification 1: UC section opens for California, stays collapsed for
  // Connecticut. Screenshot just the GPA panel so the open/closed state is
  // easy to eyeball without scrolling through the whole page.
  const gpaPanel = page.locator("h2", { hasText: "Your GPA" }).locator("..");
  await setHomeState(page, "California");
  await gpaPanel.screenshot({ path: path.join(outDir, "02-gpa-panel-california.png") });
  console.log("[screenshots] saved 02-gpa-panel-california.png");

  await setHomeState(page, "Connecticut");
  await gpaPanel.screenshot({ path: path.join(outDir, "03-gpa-panel-connecticut.png") });
  console.log("[screenshots] saved 03-gpa-panel-connecticut.png");

  // Verification 2 & 3: group order (Likely, Target, Reach, Unrated),
  // summary line, and University of Washington's range bar at 3.70 GPA
  // (UW's own range is 3.75-3.98, so this is the exact below-range case
  // that prompted the padding fix).
  await setUnweightedGpa(page, 3.7);
  await shot(page, "04-matcher-results-gpa-3.70");

  const uwCard = page.locator("a", { hasText: "University of Washington" }).first();
  if ((await uwCard.count()) > 0) {
    await uwCard.scrollIntoViewIfNeeded();
    await uwCard.screenshot({ path: path.join(outDir, "05-uw-range-bar.png") });
    console.log("[screenshots] saved 05-uw-range-bar.png");
  } else {
    console.log("[screenshots] University of Washington card not found — check its fit category/search state.");
  }

  await browser.close();
  console.log(`[screenshots] Done. See ${outDir}`);
}

main().catch((err) => {
  console.error("[screenshots] Fatal error:", err);
  process.exit(1);
});
