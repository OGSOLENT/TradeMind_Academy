/**
 * Capture Phase 2 report screenshots by driving the real sign-up → consent →
 * lesson journey against the running dev server + emulators.
 * Run: npx tsx scripts/screenshot-phase2.ts
 */
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const settle = () => new Promise((r) => setTimeout(r, 1200));

  await page.goto(`${BASE}/sign-up`);
  await settle();
  await page.getByLabel("Display name").fill("Report Learner");
  await page.getByLabel("Email address").fill(`report-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-battery-staple-9!");
  await page.screenshot({ path: `${OUT}/sign-up.png` });

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("heading", { name: "Research participation & data" }).waitFor();
  await settle();
  await page.screenshot({ path: `${OUT}/consent.png` });

  await page.getByRole("button", { name: "I consent — start learning" }).click();
  await page.getByRole("heading", { level: 1, name: "Candlestick anatomy" }).waitFor();
  await settle();
  await page.screenshot({ path: `${OUT}/lesson-top.png` });
  await page.getByRole("button", { name: "Describe this chart" }).click();
  await settle();
  await page.screenshot({ path: `${OUT}/lesson-full.png`, fullPage: true });

  await browser.close();
  console.log(`Phase 2 screenshots written to ${OUT}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
