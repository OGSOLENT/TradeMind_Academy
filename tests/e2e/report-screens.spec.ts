import { test } from "@playwright/test";
import { answerCurrent, emulatorUp, signUpAndConsent } from "./helpers";

/**
 * Report figure capture. This isn't a test of behaviour. It walks the real
 * adaptive journey and saves the screens the dissertation reproduces as
 * figures, so the figures always match the current artefact rather than
 * some July build.
 *
 *   npm run figures:capture
 *
 * It only runs when asked (CAPTURE_FIGURES=1). It used to run with every
 * browser-test pass, rewriting 24 screenshots of about 7 MB each every
 * time, and each rewrite that got committed added another copy to the git
 * history. That is most of how the repository reached 947 MB.
 */
const OUT = "docs/report-figures";

test.describe("report figures", () => {
  test.beforeEach(async () => {
    test.skip(process.env.CAPTURE_FIGURES !== "1", "Figure capture runs only when asked: npm run figures:capture");
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
  });

  test("capture", async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/01-landing.png` });

    await page.goto("/sign-up");
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/02-sign-up.png` });

    await signUpAndConsent(page, { placement: true });
    await page.goBack();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/03-consent.png` }).catch(() => {});
    await page.goForward();
    await page.waitForURL(/\/quiz\/placement-/);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/04-placement.png` });

    // A mixed placement, ten right and five wrong, so the starting map isn't flat.
    const pattern = [true, true, false, true, true, false, true, false, true, true, false, true, true, false, true, true];
    for (const c of pattern) await answerCurrent(page, c);
    await page.getByText("Your starting map.").waitFor({ timeout: 20_000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/05-init-moment.png` });
    await page.getByRole("button", { name: "Continue to dashboard" }).click();
    await page.waitForURL(/dashboard/);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/06-dashboard.png` });

    await page.goto("/skill-tree");
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/07-skill-tree.png` });

    await page.goto("/lesson/kc-candle-anatomy");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/08-lesson.png` });

    await page.goto("/practice");
    await page.waitForURL(/\/quiz\/practice-/);
    await page.getByTestId("mastery-hud").waitFor();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/09-quiz.png` });
    await page.getByRole("button", { name: "Why this question?" }).click();
    await page.getByText("The model's reasoning").waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/10-why-this-question.png` });
    await page.keyboard.press("Escape");

    // One wrong answer, to capture the amber feedback state.
    const type = await page.getByTestId("question-type").getAttribute("data-item-id");
    if (type) {
      // answerCurrent submits AND continues. Capturing the feedback by submitting
      // manually depends on the renderer, so instead I capture the post-answer
      // HUD after a wrong answer.
      await answerCurrent(page, false);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/11-after-wrong.png` });
    }
    for (let i = 0; i < 10; i++) {
      if (await page.getByText("Session complete").isVisible()) break;
      if ((await page.getByTestId("question-type").count()) === 0) break;
      await answerCurrent(page, true);
    }
    await page.getByText("Session complete").waitFor({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/12-session-summary.png` });

    const reviewLink = page.getByRole("link", { name: /Review answers/ });
    if (await reviewLink.count()) {
      await reviewLink.first().click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/13-answer-review.png` });
    }

    await page.goto("/skill-tree");
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/14-skill-tree-after.png` });

    await page.goto("/settings");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/15-settings.png` });

    await page.goto("/dev/kitchen-sink");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/16-kitchen-sink.png` });
  });
});
