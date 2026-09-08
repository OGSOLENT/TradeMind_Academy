import { expect, test } from "@playwright/test";

/**
 * Phase 2 done-criterion: a user can sign up (18+ gate), give GDPR consent,
 * and read a full seeded lesson with the video placeholder.
 *
 * Requires the Firebase Emulator Suite + seeded content:
 *   npm run emulators   (auth :9099, firestore :8080)
 *   npm run seed
 * The suite self-skips when the emulator isn't reachable (e.g. default CI).
 */

async function emulatorUp(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:9099/", { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

test.describe("auth → consent → lesson journey", () => {
  test.beforeEach(async () => {
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
  });

  test("sign up, consent, read the candlestick lesson", async ({ page }) => {
    const email = `learner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

    await page.goto("/sign-up");
    await page.getByLabel("Display name").fill("Test Learner");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill("correct-horse-battery-staple-9!");

    // The 18+ attestation is a hard gate: submitting without it must fail.
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/18\+\) only/)).toBeVisible();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();

    // Consent screen with real GDPR copy and a real Decline button.
    await expect(page.getByRole("heading", { name: "Research participation & data" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Decline" })).toBeEnabled();
    await page.getByRole("button", { name: "I consent — start learning" }).click();

    // Placement offer comes first (Phase 4); skipping starts at the prior.
    await expect(
      page.getByRole("heading", { name: /map what you already know/i }),
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /Skip — start from scratch/ }).click();
    await page.waitForURL(/dashboard/);

    await page.goto("/lesson/kc-candle-anatomy");

    // Lesson view: real curriculum content, video, figure describe-toggle.
    await expect(
      page.getByRole("heading", { level: 1, name: "Reading a Single Candle" }),
    ).toBeVisible();
    // The lesson plays its real video rather than a placeholder poster.
    await expect(page.locator("video")).toHaveCount(1);
    // Markdown extras the curriculum relies on render.
    await expect(page.locator("table").first()).toBeVisible();
    await expect(page.locator("blockquote").first()).toBeVisible();

    await page.getByRole("button", { name: "Describe this chart" }).click();
    await expect(page.getByText(/Text alternative: a simulated candlestick series/)).toBeVisible();

    // Inline knowledge check → answer correctly → collapses to ✓ chip.
    await page.getByRole("radio", { name: /Open, High, Low, Close/ }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByText(/^Correct\./)).toBeVisible();
    await page.getByRole("button", { name: "Continue reading" }).click();
    await expect(page.getByText(/Check complete/)).toBeVisible();

    await expect(page.getByText("Lesson complete")).toBeVisible();
    // Every lesson in the module is reachable from the footer.
    await expect(page.locator('nav[aria-label="Lessons in this module"] a')).toHaveCount(2);
  });

  test("declining consent signs the user out", async ({ page }) => {
    const email = `decliner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

    await page.goto("/sign-up");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill("another-strong-passphrase-7!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();

    await page.getByRole("button", { name: "Decline" }).click();
    await expect(page).toHaveURL(/\/$/);

    // Learn area must bounce a signed-out visitor back to sign-in.
    await page.goto("/lesson/kc-candle-anatomy");
    await expect(page).toHaveURL(/sign-in/);
  });
});
