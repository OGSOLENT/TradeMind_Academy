/**
 * Phase 4 report screenshots: placement, init moment, HUD, dashboard, tree.
 * Requires dev server + emulators + seed. Run: npx tsx scripts/screenshot-phase4.ts
 */
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const settle = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

  await page.goto(`${BASE}/sign-up`);
  await page.getByLabel("Email address").fill(`shots4-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-battery-staple-9!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "I consent — start learning" }).click();

  await page.getByRole("heading", { name: /map what you already know/i }).waitFor();
  await settle();
  await page.screenshot({ path: `${OUT}/placement-intro.png` });

  await page.getByRole("button", { name: "Start placement" }).click();
  await page.waitForURL(/\/quiz\/placement-/);

  const answer = async () => {
    // Card transitions briefly leave two cards mounted — wait for one.
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="question-type"]').length === 1,
    );
    const type = (await page.getByTestId("question-type").textContent())?.trim();
    if (type === "mcq") await page.getByRole("radio", { name: /option B/ }).click();
    if (type === "multi") {
      await page.getByRole("checkbox", { name: /option B/ }).click();
      await page.getByRole("checkbox", { name: /option D/ }).click();
    }
    if (type === "numeric") await page.getByRole("spinbutton").fill("42");
    if (type === "tf-confidence") await page.getByRole("radio", { name: "True" }).click();
    if (type === "annotation") {
      const pane = page.locator(".cursor-crosshair");
      const box = await pane.boundingBox();
      if (box) await pane.click({ position: { x: box.width * 0.4, y: box.height * 0.5 } });
    }
    await page.getByRole("button", { name: "Submit answer" }).click();
    await page.getByRole("button", { name: /Continue|Finish session/ }).click();
  };

  for (let i = 0; i < 8; i++) await answer();

  await page.getByText("Your starting map.").waitFor({ timeout: 15_000 });
  await settle(1600);
  await page.screenshot({ path: `${OUT}/init-moment.png` });

  await page.getByRole("button", { name: "Continue to dashboard" }).click();
  await page.waitForURL(/dashboard/);
  await settle(1500);
  await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: true });

  // Quiz with mastery HUD + why-popover open
  await page.goto(`${BASE}/practice`);
  await page.waitForURL(/\/quiz\/practice-/);
  await page.getByTestId("mastery-hud").waitFor();
  await page.getByRole("button", { name: "Why this question?" }).click();
  await settle(600);
  await page.screenshot({ path: `${OUT}/quiz-hud-why.png` });

  await page.goto(`${BASE}/skill-tree`);
  await settle(1500);
  await page.screenshot({ path: `${OUT}/skill-tree.png` });

  await browser.close();
  console.log(`Phase 4 screenshots written to ${OUT}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
