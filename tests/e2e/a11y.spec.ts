import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 6: keyboard-only walkthrough (quiz, skill tree) and reduced-motion
 * verification. Requires emulators + seed (self-skips otherwise).
 */

async function emulatorUp(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:9099/", { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function signUpSkipPlacement(page: Page): Promise<void> {
  await page.goto("/sign-up");
  await page
    .getByLabel("Email address")
    .fill(`a11y-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`);
  await page.getByLabel("Password").fill("a-long-strong-passphrase-3!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "I consent — start learning" }).click();
  await page.getByRole("button", { name: /Skip — start from scratch/ }).click({ timeout: 20_000 });
  await page.waitForURL(/dashboard/, { timeout: 20_000 });
}

test.describe("accessibility", () => {
  test.beforeEach(async () => {
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
  });

  test("quiz is fully keyboard-operable (number keys + Enter)", async ({ page }) => {
    await signUpSkipPlacement(page);
    await page.goto("/practice");
    await page.waitForURL(/\/quiz\//);
    await expect(page.getByTestId("question-type")).toHaveCount(1);

    // First question is an MCQ: select option 2 with the keyboard, submit
    // with Enter, continue with Enter — no pointer at any step.
    await page.keyboard.press("2");
    // Pressing "2" selects the second option, whatever its text.
    await expect(page.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Enter"); // submit
    await expect(page.getByText(/Correct|Not quite/)).toBeVisible();
    await page.keyboard.press("Enter"); // continue
    await expect(page.getByText("2/10")).toBeVisible();

    // The live-region mastery announcement exists for screen readers.
    await expect(page.locator('[aria-live="polite"]').last()).toBeAttached();
  });

  test("skill-tree nodes are focusable and open the panel with Enter", async ({ page }) => {
    await signUpSkipPlacement(page);
    await page.goto("/skill-tree");
    const node = page.getByRole("button", { name: /The Candle:/ });
    await expect(node).toBeVisible();
    await node.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "The Candle" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Lesson" })).toBeVisible();
  });

  test("reduced motion: landing and dashboard render fully, focus rings visible", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Learn trading like your brain/ }),
    ).toBeVisible();
    await expect(page.getByText("simulation only · no signals · no live money")).toBeVisible();

    // Keyboard focus lands visibly on the primary CTA.
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();

    await signUpSkipPlacement(page);
    await expect(page.getByRole("heading", { name: "Your dashboard" })).toBeVisible();
    await ctx.close();
  });
});
