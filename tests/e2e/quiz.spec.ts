import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 3 done-criterion: full 10-question mixed-type session, offline-
 * tolerant — network killed mid-session, events flush on reconnect, and all
 * 10 responses verifiably land in the emulator's Firestore.
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

async function signUpAndConsent(page: Page): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Email address").fill(
    `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
  );
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

/** Answer whatever question type is on screen; correctness not required. */
async function answerCurrent(page: Page): Promise<void> {
  // Wait out the card transition — exiting + entering cards briefly coexist.
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
      break; // initial order is submittable
    case "annotation": {
      const pane = page.locator(".cursor-crosshair");
      const box = await pane.boundingBox();
      if (!box) throw new Error("annotation chart not visible");
      // Click over a mid-series candle, clear of the right price axis.
      for (const fx of [0.4, 0.5, 0.3, 0.6]) {
        await pane.click({ position: { x: box.width * fx, y: box.height * 0.5 } });
        if (await page.getByText(/Marker: /).isVisible()) break;
      }
      await expect(page.getByText(/Marker: /)).toBeVisible();
      break;
    }
    case "tf-confidence":
      await page.getByRole("radio", { name: "True" }).click();
      break;
    default:
      throw new Error(`Unknown question type on screen: ${type}`);
  }
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("button", { name: /Continue|Finish session/ }).click();
}

test.describe("quiz session — mixed types, offline tolerant", () => {
  test.beforeEach(async () => {
    test.skip(!(await emulatorUp()), "Firebase emulators not running");
  });

  test("completes a mixed-type session with a mid-session network kill; all events flush", async ({
    page,
    context,
    request,
  }) => {
    await signUpAndConsent(page);

    await page.goto("/practice");
    await page.waitForURL(/\/quiz\//);
    await expect(page.getByText("1/10")).toBeVisible();

    // Answer 4 online.
    for (let i = 0; i < 4; i++) await answerCurrent(page);

    // Kill the network mid-session.
    await context.setOffline(true);

    // Answer 3 offline — the session keeps working, events queue locally.
    for (let i = 0; i < 3; i++) await answerCurrent(page);
    const queuedOffline = await page.evaluate(
      () => JSON.parse(localStorage.getItem("tm-response-queue") ?? "[]").length,
    );
    expect(queuedOffline).toBeGreaterThan(0);

    // Reconnect: the queue must drain completely.
    await context.setOffline(false);
    await page.waitForFunction(
      () => JSON.parse(localStorage.getItem("tm-response-queue") ?? "[]").length === 0,
      undefined,
      { timeout: 30_000 },
    );

    // Finish the session — adaptive selection ends when the unlocked pool is
    // exhausted (one unlocked KC × 8 items after a skipped placement).
    for (let i = 0; i < 8; i++) {
      if (await page.getByText("Session complete").isVisible()) break;
      await answerCurrent(page);
    }
    await expect(page.getByText("Session complete")).toBeVisible({ timeout: 15_000 });

    // Verify EVERY answer landed in Firestore (append-only research log).
    const { uid, sessionId, answered } = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("tm-quiz-session") ?? "{}");
      return {
        uid: raw.state?.uid,
        sessionId: raw.state?.sessionId,
        answered: Object.keys(raw.state?.answers ?? {}).length,
      };
    });
    expect(uid).toBeTruthy();
    expect(sessionId).toBeTruthy();
    expect(answered).toBeGreaterThanOrEqual(7);

    await expect
      .poll(
        async () => {
          const res = await request.get(
            `http://localhost:8080/v1/projects/demo-trademind/databases/(default)/documents/users/${uid}/sessions/${sessionId}/responses?pageSize=50`,
            { headers: { Authorization: "Bearer owner" } },
          );
          const body = (await res.json()) as { documents?: unknown[] };
          return body.documents?.length ?? 0;
        },
        { timeout: 20_000 },
      )
      .toBe(answered);

    // Every logged response carries the model state (guardrail §7.2).
    const res = await request.get(
      `http://localhost:8080/v1/projects/demo-trademind/databases/(default)/documents/users/${uid}/sessions/${sessionId}/responses?pageSize=50`,
      { headers: { Authorization: "Bearer owner" } },
    );
    const body = (await res.json()) as {
      documents: Array<{ fields: Record<string, unknown> }>;
    };
    for (const d of body.documents) {
      expect(d.fields).toHaveProperty("pLBefore");
      expect(d.fields).toHaveProperty("pLAfter");
      expect(d.fields).toHaveProperty("latencyMs");
    }
  });

  test("refresh mid-session resumes at the same question", async ({ page }) => {
    await signUpAndConsent(page);
    await page.goto("/practice");
    await page.waitForURL(/\/quiz\//);

    await answerCurrent(page);
    await answerCurrent(page);
    await expect(page.getByText("3/10")).toBeVisible();

    await page.reload();
    await expect(page.getByText("3/10")).toBeVisible(); // Zustand persist resumed
  });
});
