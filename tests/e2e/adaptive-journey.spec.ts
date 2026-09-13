import { expect, test } from "@playwright/test";
import { answerCurrent, emulatorUp, signUpAndConsent } from "./helpers";

/**
 * The Phase 4 done criterion: placement, then a routed lesson, then a topic
 * test, then a mastery event, then the next KC unlocks. It's the full
 * adaptive loop, end to end. Needs the emulators and the seed, and it skips
 * itself if they aren't there.
 */
test.describe("the adaptive loop — dissertation core journey", () => {
  test.beforeEach(async () => {
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
  });

  test("placement → lesson → topic test → mastery → unlock", async ({ page }) => {
    test.setTimeout(180_000);

    // ---- Sign up, consent, placement --------------------------------------
    await signUpAndConsent(page, { placement: true });
    await expect(page.getByText("1/16")).toBeVisible();

    for (let i = 0; i < 16; i++) await answerCurrent(page, true);

    // ---- The model-initialisation moment -----------------------------------
    await expect(page.getByText("Your starting map.")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Continue to dashboard" }).click();
    await page.waitForURL(/dashboard/);

    // ---- The dashboard routes to the first unmastered module ----------------
    await expect(page.getByRole("heading", { name: "The Candle", level: 1 })).toBeVisible({
      timeout: 20_000,
    });

    // ---- The routed lesson --------------------------------------------------
    await page.getByRole("link", { name: "Review lesson" }).click();
    await page.waitForURL(/lesson\/kc-candle-anatomy/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Reading a Single Candle" }),
    ).toBeVisible();
    // Every lesson in the module should be reachable from the lesson footer.
    await expect(
      page.locator('nav[aria-label="Lessons in this module"] a'),
    ).toHaveCount(2);

    // ---- The topic test (adaptive practice) ---------------------------------
    await page.goto("/practice");
    await page.waitForURL(/\/quiz\/practice-/);
    await expect(page.getByTestId("mastery-hud")).toBeVisible();

    // The "Why this question?" popover has to show real model values.
    await page.getByRole("button", { name: "Why this question?" }).click();
    await expect(page.getByText("The model's reasoning")).toBeVisible();
    await expect(page.getByText("Current mastery estimate")).toBeVisible();
    await page.keyboard.press("Escape");

    // Keep answering correctly until the session ends or mastery is reached.
    for (let i = 0; i < 10; i++) {
      if (await page.getByText("Session complete").isVisible()) break;
      if (await page.getByRole("status", { name: /mastered/ }).isVisible()) break;
      if ((await page.getByTestId("question-type").count()) === 0) break;
      await answerCurrent(page, true);
    }

    // ---- The mastery event, the ONE big ceremony ----------------------------
    await expect(page.getByRole("status", { name: /mastered/ })).toBeVisible({
      timeout: 20_000,
    });

    // ---- The session summary shows the delta and the unlock -----------------
    await expect(page.getByText("Session complete")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/New topic unlocked: liquidity/i)).toBeVisible();

    // ---- The skill tree shows the next KC unlocked --------------------------
    await page.getByRole("link", { name: "See your map" }).click();
    await page.waitForURL(/skill-tree/);
    await expect(page.getByRole("button", { name: /The Candle: mastered/ })).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByRole("button", { name: /Liquidity & Wicks: available/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Reversal Patterns: locked/ }),
    ).toBeVisible();
  });
});
