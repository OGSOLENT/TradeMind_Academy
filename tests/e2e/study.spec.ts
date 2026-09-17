import { expect, test } from "@playwright/test";
import { answerCurrent, emulatorUp, signUpAndConsent } from "./helpers";

/**
 * The study instruments: placement (form A), post-test (form B, different
 * questions, no model update), and the SUS questionnaire. Needs the
 * emulators and the seed, and skips itself otherwise.
 */
test.describe("study instruments", () => {
  test.beforeEach(async () => {
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
  });

  test("placement → post-test scores against it → survey saves", async ({ page }) => {
    test.setTimeout(240_000);

    // Placement, deliberately half wrong so there's headroom to gain.
    await signUpAndConsent(page, { placement: true });
    await expect(page.getByText("1/16")).toBeVisible();
    const placementItems: string[] = [];
    for (let i = 0; i < 16; i++) {
      // The exit animation keeps the previous question in the DOM for a moment.
      await expect(page.getByTestId("question-type")).toHaveCount(1);
      placementItems.push((await page.getByTestId("question-type").getAttribute("data-item-id")) ?? "");
      await answerCurrent(page, i % 2 === 0);
    }
    await expect(page.getByText("Your starting map.")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Continue to dashboard" }).click();
    await page.waitForURL(/dashboard/);

    // The post-test lives on the profile.
    await page.goto("/profile");
    await page.getByRole("link", { name: "Take the post-test" }).click();
    await page.waitForURL(/\/post-test/);
    await expect(page.getByRole("heading", { name: "Post-test", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Start post-test" }).click();
    await page.waitForURL(/\/quiz\/post-test-/, { timeout: 25_000 });
    await expect(page.getByText("1/16")).toBeVisible();
    // No mastery HUD: a measurement, not practice.
    await expect(page.getByTestId("mastery-hud")).toHaveCount(0);

    const postItems: string[] = [];
    for (let i = 0; i < 16; i++) {
      await expect(page.getByTestId("question-type")).toHaveCount(1);
      postItems.push((await page.getByTestId("question-type").getAttribute("data-item-id")) ?? "");
      await answerCurrent(page, true);
    }
    // Form B differs from form A everywhere except the single-item module.
    const same = postItems.filter((id, i) => id === placementItems[i]);
    expect(same.length).toBeLessThanOrEqual(1);

    await expect(page.getByText("Post-test complete")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("post-test-score")).toHaveText("16/16");
    await expect(page.getByText(/At placement you scored 8\/16/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/100% of the ground/)).toBeVisible();

    // The survey, reached from the completion screen.
    await page.getByRole("link", { name: /Rate the course/ }).click();
    await page.waitForURL(/\/survey/);
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    await expect(page.getByText("Statement 1 still needs an answer.")).toBeVisible();
    for (let i = 1; i <= 10; i++) {
      await page
        .getByRole("radiogroup", { name: `Statement ${i}`, exact: true })
        .getByRole("radio", { name: i % 2 ? /^5:/ : /^1:/ })
        .click();
    }
    await page.getByLabel("What helped you learn most?").fill("The real-chart case studies.");
    await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("heading", { name: "Thank you", level: 1 })).toBeVisible({ timeout: 20_000 });

    // Coming back shows it's answered, and the profile now offers a retake.
    await page.goto("/survey");
    await expect(page.getByText(/You.ve answered this before/)).toBeVisible({ timeout: 20_000 });
    await page.goto("/profile");
    await expect(page.getByRole("link", { name: "Retake post-test" })).toBeVisible({ timeout: 20_000 });
  });
});
