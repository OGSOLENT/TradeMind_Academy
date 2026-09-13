import { expect, type Page } from "@playwright/test";

/**
 * The shared E2E helpers.
 *
 * Answers get looked up from the seeded Firestore item rather than hardcoded,
 * so these tests keep passing when I change the curriculum copy. The quiz
 * page exposes the current item id via data-item-id on the question-type
 * badge, which is what makes that possible.
 */

const FIRESTORE = "http://localhost:8080/v1/projects/demo-trademind/databases/(default)/documents";

export async function emulatorUp(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:9099/", { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Firestore REST values come back as typed wrappers. This unwraps the ones I need. */
type RestValue = Record<string, unknown>;
function unwrap(v: RestValue): unknown {
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("stringValue" in v) return v.stringValue;
  if ("arrayValue" in v) {
    const arr = (v.arrayValue as { values?: RestValue[] }).values ?? [];
    return arr.map(unwrap);
  }
  if ("mapValue" in v) {
    const fields = (v.mapValue as { fields?: Record<string, RestValue> }).fields ?? {};
    return Object.fromEntries(Object.entries(fields).map(([k, val]) => [k, unwrap(val)]));
  }
  return null;
}

export interface AnswerKey {
  type: string;
  correct?: number | number[];
  value?: number | boolean;
  tolerance?: number;
  order?: number[];
  zone?: { from: string; to: string; priceLow: number; priceHigh: number };
}

export async function fetchAnswerKey(itemId: string): Promise<AnswerKey> {
  const res = await fetch(`${FIRESTORE}/items/${itemId}`, {
    headers: { Authorization: "Bearer owner" },
  });
  if (!res.ok) throw new Error(`Could not load item ${itemId}: ${res.status}`);
  const body = (await res.json()) as { fields: Record<string, RestValue> };
  return unwrap(body.fields.answerKey as RestValue) as AnswerKey;
}

/**
 * Answer whatever question is on screen. `correct: false` deliberately gets
 * it wrong where the type allows, which is how I exercise the remediation
 * path.
 */
export async function answerCurrent(page: Page, correct = true): Promise<void> {
  // Card transitions briefly render two cards, so wait for things to settle.
  await expect(page.getByTestId("question-type")).toHaveCount(1);
  const badge = page.getByTestId("question-type");
  const type = (await badge.textContent())?.trim();
  const itemId = await badge.getAttribute("data-item-id");
  if (!itemId) throw new Error("question-type badge is missing data-item-id");
  const key = await fetchAnswerKey(itemId);

  switch (type) {
    case "mcq": {
      const idx = Number(key.correct ?? 0);
      const pick = correct ? idx : (idx + 1) % (await page.getByRole("radio").count());
      await page.getByRole("radio").nth(pick).click();
      break;
    }
    case "multi": {
      const idxs = (key.correct as number[]) ?? [];
      const picks = correct ? idxs : [idxs[0] ?? 0];
      for (const i of picks) await page.getByRole("checkbox").nth(i).click();
      break;
    }
    case "numeric": {
      const v = Number(key.value ?? 0);
      await page.getByRole("spinbutton").fill(String(correct ? v : v + 10));
      break;
    }
    case "ordering":
      // The seeded keys use the presented order, so submitting as-is is correct.
      break;
    case "annotation": {
      const pane = page.locator(".cursor-crosshair");
      const box = await pane.boundingBox();
      if (!box) throw new Error("annotation chart not visible");
      for (const fx of [0.35, 0.45, 0.3, 0.55, 0.5]) {
        await pane.click({ position: { x: box.width * fx, y: box.height * 0.5 } });
        if (await page.getByText(/Marker: /).isVisible()) break;
      }
      break;
    }
    case "tf-confidence": {
      const v = Boolean(key.value);
      const want = correct ? v : !v;
      await page.getByRole("radio", { name: want ? "True" : "False" }).click();
      break;
    }
    default:
      throw new Error(`Unknown question type on screen: ${type}`);
  }

  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("button", { name: /Continue|Finish session/ }).click();
}

/** Sign up, consent, skip placement. The shortest path into the app. */
export async function signUpAndConsent(page: Page, opts: { placement?: boolean } = {}) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill("a-long-strong-passphrase-3!");
  await page.getByRole("checkbox", { name: /18 or older/ }).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "I consent — start learning" }).click({ timeout: 25_000 });

  if (opts.placement) {
    await page.getByRole("button", { name: "Start placement" }).click({ timeout: 25_000 });
    await page.waitForURL(/\/quiz\/placement-/, { timeout: 25_000 });
  } else {
    await page
      .getByRole("button", { name: /Skip — start from scratch/ })
      .click({ timeout: 25_000 });
    await page.waitForURL(/dashboard/, { timeout: 25_000 });
  }
  return email;
}
