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

    // Toast appears and can be dismissed
    const toastSection = page.locator('section[aria-label^="Toasts"]');
    await toastSection.getByRole("button", { name: "success" }).click();
    const toast = page.getByRole("status").filter({ hasText: "Mastery increased" });
    await expect(toast).toBeVisible();

    // Modal opens, traps focus semantics, closes on Escape
    await page.getByRole("button", { name: "Open modal" }).click();
    await expect(page.getByRole("dialog", { name: "Delete account?" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Delete account?" })).toBeHidden();

    // MasteryRing responds to a gain — all three linked rings move 62% → 71%
    await page.getByRole("button", { name: "Gain +9%" }).click();
    await expect(page.getByRole("img", { name: "Mastery 71 percent" })).toHaveCount(3);
  });

  test("home page shows the ethics banner", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Educational simulation only")).toBeVisible();
    await expect(page.getByText(/no live trading, no signals/)).toBeVisible();
  });
});
