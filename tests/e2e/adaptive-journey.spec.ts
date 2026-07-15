import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 4 done-criterion: placement → routed lesson → topic test → mastery
 * event → unlocked next KC. The full adaptive loop, end to end.
 * Requires emulators + seed (self-skips otherwise).
 */

async function emulatorUp(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:9099/", { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Answer the on-screen question correctly (answer keys are seeded fixtures). */
async function answerCorrectly(page: Page): Promise<void> {
  await expect(page.getByTestId("question-type")).toHaveCount(1);
  const type = await page.getByTestId("question-type").textContent();
  switch (type?.trim()) {
    case "mcq":
      await page.getByRole("radio", { name: /option B/ }).click();
      break;
    case "multi":
      await page.getByRole("checkbox", { name: /option B/ }).click();
      await page.getByRole("checkbox", { name: /option D/ }).click();
      break;
    case "numeric":
      await page.getByRole("spinbutton").fill("42");
      break;
    case "ordering":
      break; // seeded key = initial order
    case "annotation": {
      const pane = page.locator(".cursor-crosshair");
      const box = await pane.boundingBox();
      if (!box) throw new Error("annotation chart not visible");
      for (const fx of [0.35, 0.45, 0.3, 0.55]) {
        await pane.click({ position: { x: box.width * fx, y: box.height * 0.5 } });
        if (await page.getByText(/Marker: /).isVisible()) break;
      }
      break;
    }
    case "tf-confidence":
      await page.getByRole("radio", { name: "True" }).click();
      break;
    default:
      throw new Error(`Unknown question type: ${type}`);
  }
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("button", { name: /Continue|Finish session/ }).click();
}

test.describe("the adaptive loop — dissertation core journey", () => {
  test.beforeEach(async () => {
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
  });

  test("placement → lesson → topic test → mastery → unlock", async ({ page }) => {
    test.setTimeout(120_000);

    // ---- Sign up + consent ------------------------------------------------
    await page.goto("/sign-up");
    await page
      .getByLabel("Email address")
      .fill(`journey-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`);
    await page.getByLabel("Password").fill("a-long-strong-passphrase-3!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByRole("button", { name: "I consent — start learning" }).click();

    // ---- Placement test ----------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /map what you already know/i }),
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Start placement" }).click();
    await page.waitForURL(/\/quiz\/placement-/);
    await expect(page.getByText("1/8")).toBeVisible();

    for (let i = 0; i < 8; i++) await answerCorrectly(page);

    // ---- Model-initialization moment ---------------------------------------
    await expect(page.getByText("Your starting map.")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Continue to dashboard" }).click();
    await page.waitForURL(/dashboard/);

    // ---- Dashboard routes to the target KC ---------------------------------
    await expect(page.getByRole("heading", { name: "Candlestick anatomy" })).toBeVisible({
      timeout: 15_000,
    });

    // ---- Routed lesson ------------------------------------------------------
    await page.getByRole("link", { name: "Review lesson" }).click();
    await page.waitForURL(/lesson\/kc-candlestick-anatomy-lesson/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Candlestick anatomy" }),
    ).toBeVisible();

    // ---- Topic test (adaptive practice) -------------------------------------
    await page.goto("/practice");
    await page.waitForURL(/\/quiz\/practice-/);
    await expect(page.getByTestId("mastery-hud")).toBeVisible();

    // "Why this question?" popover shows real model values.
    await page.getByRole("button", { name: "Why this question?" }).click();
    await expect(page.getByText("The model's reasoning")).toBeVisible();
    await expect(page.getByText("Current mastery estimate")).toBeVisible();
    await page.keyboard.press("Escape");

    // Answer until the session completes (pool-limited sessions end early).
    for (let i = 0; i < 10; i++) {
      if (await page.getByText("Session complete").isVisible()) break;
      const summaryOrQuestion = await Promise.race([
        page
          .getByTestId("question-type")
          .first()
          .waitFor({ timeout: 10_000 })
          .then(() => "question" as const),
        page
          .getByText(/mastered$/)
          .first()
          .waitFor({ timeout: 10_000 })
          .then(() => "celebration" as const)
          .catch(() => "question" as const),
      ]).catch(() => "done" as const);
      if (summaryOrQuestion === "celebration") break;
      if (await page.getByText("Session complete").isVisible()) break;
      await answerCorrectly(page);
    }

    // ---- Mastery event: the ONE big ceremony --------------------------------
    await expect(page.getByRole("status", { name: /mastered/ })).toBeVisible({
      timeout: 15_000,
    });

    // ---- Session summary shows the delta and the unlock ----------------------
    await expect(page.getByText("Session complete")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/New topic unlocked: market structure/)).toBeVisible();

    // ---- Skill tree: next KC unlocked + ceremony -----------------------------
    await page.getByRole("link", { name: "See your map" }).click();
    await page.waitForURL(/skill-tree/);
    await expect(
      page.getByRole("button", { name: /Candlestick anatomy: mastered/ }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /Market structure: available/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Support & resistance: locked/ }),
    ).toBeVisible();
  });
});
