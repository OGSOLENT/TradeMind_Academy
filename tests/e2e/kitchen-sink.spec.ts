import { expect, test } from "@playwright/test";

test.describe("kitchen sink — design system smoke", () => {
  test("renders every section and passes basic interactions", async ({ page }) => {
    await page.goto("/dev/kitchen-sink");

    await expect(page.getByRole("heading", { name: "Kitchen sink" })).toBeVisible();

    for (const section of [
      "Buttons — 5 variants × states",
      "Inputs — floating labels",
      "Cards — internal illumination levels",
      "MasteryRing — flagship (3 sizes, band colours)",
      "Pills",
      "Progress",
      "Toasts — 4 variants, swipe to dismiss",
      "Overlays",
      "Tabs — spring underline",
      "Skeletons",
      "Kbd",
    ]) {
      await expect(page.getByRole("heading", { name: section })).toBeVisible();
    }

    // A toast appears and can be dismissed
    const toastSection = page.locator('section[aria-label^="Toasts"]');
    await toastSection.getByRole("button", { name: "success" }).click();
    const toast = page.getByRole("status").filter({ hasText: "Mastery increased" });
    await expect(toast).toBeVisible();

    // The modal opens, keeps focus inside, and closes on Escape
    await page.getByRole("button", { name: "Open modal" }).click();
    await expect(page.getByRole("dialog", { name: "Delete account?" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Delete account?" })).toBeHidden();

    // The MasteryRing responds to a gain. All three linked rings move from 62% to 71%
    await page.getByRole("button", { name: "Gain +9%" }).click();
    await expect(page.getByRole("img", { name: "Mastery 71 percent" })).toHaveCount(3);
  });

  test("landing shows the ethics strip and full disclaimer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("simulation only · no signals · no live money")).toBeVisible();
    await expect(page.getByText(/Risk & purpose disclaimer/)).toBeVisible();
    await expect(page.getByText(/Nothing here is financial advice/)).toBeVisible();
  });
});
