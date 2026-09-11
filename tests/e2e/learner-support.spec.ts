import { expect, test, type Page } from "@playwright/test";
import { answerCurrent } from "./helpers";

/**
 * Phase 5: settings (including colour-blind candles, font scale and the
 * delete-then-undo flow), answer review, the mistake bank, the review queue
 * and the profile. Needs the emulators and the seed, and skips itself
 * otherwise.
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
  await page.getByLabel("Display name").fill("Phase Five");
  await page
    .getByLabel("Email address")
    .fill(`p5-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`);
  await page.getByLabel("Password").fill("a-long-strong-passphrase-3!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "I consent — start learning" }).click();
  await expect(
    page.getByRole("heading", { name: /map what you already know/i }),
  ).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Skip — start from scratch/ }).click();
  await page.waitForURL(/dashboard/, { timeout: 20_000 });
}


test.describe("learner support", () => {
  test.beforeEach(async () => {
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
  });

  test("settings: colour-blind candles, font scale, delete with undo, data download", async ({
    page,
  }) => {
    await signUpSkipPlacement(page);
    await page.goto("/settings");

    // Colour-blind mode flips the CSS vars through a data attribute, which is the live preview.
    await page.getByRole("switch", { name: "Colour-blind candles" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-candles", "colorblind");

    // The font scale lands on the root element.
    await page.getByRole("radio", { name: "115%" }).click();
    await expect(page.locator("html")).toHaveAttribute("style", /font-size: 115%/);

    // Reduced motion sets the override attribute.
    await page.getByRole("switch", { name: "Reduce motion" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");

    // Download my data should produce a CSV download.
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download my data" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("trademind-my-data.csv");

    // The delete flow: the type-DELETE gate, then five seconds to undo.
    await page.getByRole("button", { name: "Delete my account" }).click();
    const dialog = page.getByRole("dialog", { name: "Delete account?" });
    await expect(dialog.getByRole("button", { name: "Delete account" })).toBeDisabled();
    await dialog.getByLabel("Type DELETE").fill("DELETE");
    await dialog.getByRole("button", { name: "Delete account" }).click();
    await expect(page.getByText(/Deleting in \ds/)).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Deletion cancelled")).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete my account" })).toBeVisible();
  });

  test("answer review, mistake bank, review queue, profile badges", async ({ page }) => {
    await signUpSkipPlacement(page);

    // Complete a session, with the numeric question answered wrong on purpose.
    await page.goto("/practice");
    await page.waitForURL(/\/quiz\//);
    for (let i = 0; i < 10; i++) {
      if (await page.getByText("Session complete").isVisible()) break;
      await answerCurrent(page, false);
    }
    await expect(page.getByText("Session complete")).toBeVisible({ timeout: 15_000 });

    // Answer review shows a verdict and an explanation for each item.
    await page.getByRole("link", { name: "Review answers" }).click();
    await page.waitForURL(/\/review$/);
    await expect(page.getByRole("heading", { name: "Answer review" })).toBeVisible();
    await expect(page.getByText("missed").first()).toBeVisible();
    await expect(page.getByText("correct").first()).toBeVisible();
    // Each reviewed item carries the explanation I wrote for it.
    await expect(page.getByTestId("review-explanation").first()).toBeVisible();

    // The mistake bank groups the missed numeric item under its KC.
    await page.goto("/mistakes");
    await expect(page.getByRole("heading", { name: "Mistake bank" })).toBeVisible();
    await expect(page.getByText(/missed/).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Re-drill" }).first()).toBeVisible();

    // The review queue: nothing's fading yet on a fresh account.
    await page.goto("/review");
    await expect(page.getByText("Nothing is fading")).toBeVisible();

    // The profile: stats and the badges earned so far.
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Phase Five" })).toBeVisible();
    await expect(page.getByText("First steps")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});
