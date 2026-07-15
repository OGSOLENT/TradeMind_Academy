import { describe, expect, it } from "vitest";
import type { Item, Kc } from "@/lib/content/types";
import {
  difficultyFor,
  newlyUnlocked,
  nextActionFor,
  nextItem,
  targetKcId,
  unlockedKcIds,
} from "@/lib/routing";

const kcs: Kc[] = [
  { id: "a", courseId: "c", title: "A", prereqIds: [], level: 1, description: "" },
  { id: "b", courseId: "c", title: "B", prereqIds: ["a"], level: 1, description: "" },
  { id: "c", courseId: "c", title: "C", prereqIds: ["b"], level: 1, description: "" },
];

function item(id: string, kcId: string, difficulty: Item["difficulty"]): Item {
  return {
    id,
    kcId,
    type: "mcq",
    difficulty,
    payload: { type: "mcq", question: "q", options: ["1", "2"] },
    answerKey: { type: "mcq", correct: 0 },
    explanation: "",
    isPretestEligible: true,
  };
}

describe("unlockedKcIds — prereq gating at pL ≥ 0.8", () => {
  it("only the root is unlocked with no mastery", () => {
    expect(unlockedKcIds(kcs, {})).toEqual(["a"]);
  });

  it("mastering a prereq unlocks the next KC exactly at 0.8", () => {
    expect(unlockedKcIds(kcs, { a: { pL: 0.79, attempts: 5 } })).toEqual(["a"]);
    expect(unlockedKcIds(kcs, { a: { pL: 0.8, attempts: 5 } })).toEqual(["a", "b"]);
  });

  it("chain: both prereqs mastered unlocks the third", () => {
    expect(
      unlockedKcIds(kcs, { a: { pL: 0.9, attempts: 5 }, b: { pL: 0.85, attempts: 4 } }),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("nextActionFor — decision table", () => {
  it.each([
    [undefined, "lesson"],
    [{ pL: 0.25, attempts: 0 }, "lesson"],
    [{ pL: 0.2, attempts: 3 }, "remediate"],
    [{ pL: 0.39, attempts: 3 }, "remediate"],
    [{ pL: 0.4, attempts: 3 }, "practice"],
    [{ pL: 0.79, attempts: 3 }, "practice"],
    [{ pL: 0.8, attempts: 3 }, "advance"],
    [{ pL: 0.95, attempts: 9 }, "advance"],
  ] as const)("state %o → %s", (state, expected) => {
    expect(nextActionFor(state as never)).toBe(expected);
  });
});

describe("targetKcId — lowest-mastery unlocked KC", () => {
  it("picks the lowest unmastered among unlocked", () => {
    expect(
      targetKcId(kcs, { a: { pL: 0.85, attempts: 5 }, b: { pL: 0.5, attempts: 2 } }),
    ).toBe("b");
  });

  it("returns null when everything is mastered", () => {
    expect(
      targetKcId(kcs, {
        a: { pL: 0.9, attempts: 5 },
        b: { pL: 0.85, attempts: 5 },
        c: { pL: 0.82, attempts: 5 },
      }),
    ).toBeNull();
  });
});

describe("difficulty ladder", () => {
  it.each([
    [0.1, "easy"],
    [0.39, "easy"],
    [0.4, "med"],
    [0.69, "med"],
    [0.7, "hard"],
    [0.95, "hard"],
  ] as const)("pL %d → %s", (pL, expected) => {
    expect(difficultyFor(pL)).toBe(expected);
  });
});

describe("nextItem", () => {
  const pool = [
    item("e1", "a", "easy"),
    item("e2", "a", "easy"),
    item("m1", "a", "med"),
    item("h1", "a", "hard"),
    item("x1", "b", "med"),
  ];

  it("follows the ladder for the current pL", () => {
    const sel = nextItem(pool, "a", 0.5, { usedItemIds: [], consecutiveWrong: 0 });
    expect(sel?.item.id).toBe("m1");
    expect(sel?.reason.difficulty).toBe("med");
  });

  it("never repeats an item within a session", () => {
    const sel = nextItem(pool, "a", 0.5, { usedItemIds: ["m1"], consecutiveWrong: 0 });
    expect(sel?.item.id).not.toBe("m1");
  });

  it("two consecutive wrongs force an easy (remediation) item", () => {
    const sel = nextItem(pool, "a", 0.6, { usedItemIds: [], consecutiveWrong: 2 });
    expect(sel?.item.difficulty).toBe("easy");
    expect(sel?.reason.remediation).toBe(true);
  });

  it("falls back to the nearest rung when preferred difficulty is exhausted", () => {
    const sel = nextItem(pool, "a", 0.5, { usedItemIds: ["m1"], consecutiveWrong: 0 });
    expect(["e1", "e2", "h1"]).toContain(sel?.item.id ?? "");
  });

  it("returns null when the KC pool is exhausted", () => {
    const sel = nextItem(pool, "a", 0.5, {
      usedItemIds: ["e1", "e2", "m1", "h1"],
      consecutiveWrong: 0,
    });
    expect(sel).toBeNull();
  });

  it("exposes the model's predicted P(correct) for the popover", () => {
    const sel = nextItem(pool, "a", 0.25, { usedItemIds: [], consecutiveWrong: 0 });
    expect(sel?.reason.pCorrectPredicted).toBeCloseTo(0.375, 10);
  });
});

describe("newlyUnlocked — ceremony trigger", () => {
  it("detects the KC that just opened", () => {
    const before = { a: { pL: 0.75, attempts: 4 } };
    const after = { a: { pL: 0.82, attempts: 5 } };
    expect(newlyUnlocked(kcs, before, after)).toEqual(["b"]);
  });

  it("empty when nothing changed bands", () => {
    const before = { a: { pL: 0.5, attempts: 4 } };
    const after = { a: { pL: 0.6, attempts: 5 } };
    expect(newlyUnlocked(kcs, before, after)).toEqual([]);
  });
});
