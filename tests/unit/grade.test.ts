import { describe, expect, it } from "vitest";
import type { AnswerKey } from "@/lib/content/types";
import { grade, type LearnerAnswer } from "@/lib/quiz/grade";

describe("grade", () => {
  it("mcq", () => {
    expect(grade({ type: "mcq", selected: 1 }, { type: "mcq", correct: 1 })).toBe(true);
    expect(grade({ type: "mcq", selected: 0 }, { type: "mcq", correct: 1 })).toBe(false);
  });

  it("multi is order-insensitive and exact", () => {
    const key: AnswerKey = { type: "multi", correct: [1, 3] };
    expect(grade({ type: "multi", selected: [3, 1] }, key)).toBe(true);
    expect(grade({ type: "multi", selected: [1] }, key)).toBe(false);
    expect(grade({ type: "multi", selected: [1, 2, 3] }, key)).toBe(false);
  });

  it("numeric honours tolerance", () => {
    const key: AnswerKey = { type: "numeric", value: 42, tolerance: 0.5 };
    expect(grade({ type: "numeric", value: 42.5 }, key)).toBe(true);
    expect(grade({ type: "numeric", value: 42.51 }, key)).toBe(false);
  });

  it("ordering must match exactly", () => {
    const key: AnswerKey = { type: "ordering", order: [0, 1, 2, 3] };
    expect(grade({ type: "ordering", order: [0, 1, 2, 3] }, key)).toBe(true);
    expect(grade({ type: "ordering", order: [1, 0, 2, 3] }, key)).toBe(false);
  });

  it("annotation checks time and price zone membership", () => {
    const key: AnswerKey = {
      type: "annotation",
      zone: { from: "2024-01-04", to: "2024-01-07", priceLow: 98, priceHigh: 104 },
    };
    expect(grade({ type: "annotation", time: "2024-01-05", price: 100 }, key)).toBe(true);
    expect(grade({ type: "annotation", time: "2024-01-09", price: 100 }, key)).toBe(false);
    expect(grade({ type: "annotation", time: "2024-01-05", price: 96 }, key)).toBe(false);
  });

  it("tf-confidence grades the truth value (confidence is logged, not graded)", () => {
    const key: AnswerKey = { type: "tf-confidence", value: true };
    expect(grade({ type: "tf-confidence", value: true, confidence: 50 }, key)).toBe(true);
    expect(grade({ type: "tf-confidence", value: false, confidence: 100 }, key)).toBe(false);
  });
});

describe("an answer of the wrong type", () => {
  // The quiz can only produce an answer shaped for the question on screen,
  // but the grader must never crash or award a mark if that ever fails.
  const keys: AnswerKey[] = [
    { type: "mcq", correct: 0 },
    { type: "multi", correct: [0] },
    { type: "numeric", value: 3, tolerance: 0.5 },
    { type: "ordering", order: [0, 1] },
    { type: "annotation", zone: { from: "2024-03-01", to: "2024-03-05", priceLow: 1, priceHigh: 2 } },
    { type: "tf-confidence", value: true },
  ];
  const wrongFor = (k: AnswerKey): LearnerAnswer =>
    k.type === "mcq" ? { type: "tf-confidence", value: true, confidence: 1 } : { type: "mcq", selected: 0 };

  it.each(keys.map((k) => [k.type, k] as const))("grades a %s key given another type as wrong", (_t, key) => {
    expect(grade(wrongFor(key), key)).toBe(false);
  });
});
