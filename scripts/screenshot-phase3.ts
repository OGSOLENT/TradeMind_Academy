/**
 * The Phase 3 report screenshots: quiz shell, feedback panel, session
 * summary. Needs the dev server, emulators and seed.
 * Run: npx tsx scripts/screenshot-phase3.ts
 */
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const settle = (ms = 900) => new Promise((r) => setTimeout(r, ms));

  await page.goto(`${BASE}/sign-up`);
  await page.getByLabel("Email address").fill(`shots3-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-battery-staple-9!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "I consent — start learning" }).click();
  await page.getByRole("heading", { level: 1, name: "Candlestick anatomy" }).waitFor();

  await page.goto(`${BASE}/practice`);
  await page.waitForURL(/\/quiz\//);
  await page.getByText("1/10").waitFor();
  await settle();
  await page.screenshot({ path: `${OUT}/quiz-question.png` });

  // Answer the first question (an MCQ) so the feedback panel shows.
  await page.getByRole("radio", { name: /option B/ }).click();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await settle();
  await page.screenshot({ path: `${OUT}/quiz-feedback.png` });

  await browser.close();
  console.log(`Phase 3 screenshots written to ${OUT}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
