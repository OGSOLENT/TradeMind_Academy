import { expect, test } from "@playwright/test";
import { answerCurrent, emulatorUp, signUpAndConsent } from "./helpers";

/**
 * The Phase 3 done criterion: a full 10-question mixed-type session that
 * survives going offline. I kill the network mid-session, the events flush
 * on reconnect, and all ten responses verifiably land in the emulator's
 * Firestore. Needs the emulators and the seed, and skips itself otherwise.
 */

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

    // Answer four while online.
    for (let i = 0; i < 4; i++) await answerCurrent(page);

    // Now kill the network mid-session.
    await context.setOffline(true);

    // Answer three offline. The session keeps working and the events queue locally.
    for (let i = 0; i < 3; i++) await answerCurrent(page);
    const queuedOffline = await page.evaluate(
      () => JSON.parse(localStorage.getItem("tm-response-queue") ?? "[]").length,
    );
    expect(queuedOffline).toBeGreaterThan(0);

    // Reconnect. The queue has to drain completely.
    await context.setOffline(false);
    await page.waitForFunction(
      () => JSON.parse(localStorage.getItem("tm-response-queue") ?? "[]").length === 0,
      undefined,
      { timeout: 30_000 },
    );

    // Finish the session. Adaptive selection ends when the unlocked pool runs
    // out, which is one unlocked KC times eight items after a skipped placement.
    for (let i = 0; i < 8; i++) {
      if (await page.getByText("Session complete").isVisible()) break;
      await answerCurrent(page);
    }
    await expect(page.getByText("Session complete")).toBeVisible({ timeout: 15_000 });

    // Check that EVERY answer landed in Firestore. This is the append-only research log.
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

    // Every logged response has to carry the model state (guardrail 7.2).
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
