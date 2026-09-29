import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { emulatorUp, signUpAndConsent } from "./helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function check(page: import("@playwright/test").Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .exclude("canvas")
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious,
    `${name}: ${serious.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.html.slice(0, 120)}`).join("\n")}`,
  ).toEqual([]);
  return results.violations.map((v) => `${v.impact}:${v.id}`);
}

test.describe("axe-core WCAG 2.1 AA", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("public pages have no serious or critical violations", async ({ page }) => {
    for (const path of ["/", "/sign-in", "/sign-up", "/legal"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await page.waitForTimeout(600);
      await check(page, path);
    }
  });

  test("signed-in pages have no serious or critical violations", async ({ page }) => {
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
    test.setTimeout(180_000);
    await signUpAndConsent(page);
    for (const path of ["/dashboard", "/skill-tree", "/lesson/kc-candle-anatomy", "/profile", "/settings", "/survey", "/post-test"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 25_000 });
      await page.waitForTimeout(800);
      await check(page, path);
    }
    // The quiz, mid-question.
    await page.goto("/practice");
    await page.waitForURL(/\/quiz\//, { timeout: 25_000 });
    await expect(page.getByTestId("question-type")).toHaveCount(1);
    await check(page, "/quiz");
  });
});
