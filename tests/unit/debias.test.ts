import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { debiasItems } from "@/lib/content/debias";
import type { Item, Level1Content } from "@/lib/content/types";
import { pickAssessment } from "@/lib/assessment";

const content: Level1Content = JSON.parse(readFileSync("content/level1.json", "utf8"));
const items = content.items;

const mcq = items.filter((i) => i.answerKey.type === "mcq");
const multi = items.filter((i) => i.answerKey.type === "multi");
const ordering = items.filter((i) => i.answerKey.type === "ordering");

describe("the shipped bank carries no positional tell", () => {
  it("spreads the multiple-choice answer evenly, so guessing one position can't beat chance", () => {
    const counts = [0, 0, 0, 0];
    for (const i of mcq) if (i.answerKey.type === "mcq") counts[i.answerKey.correct]! += 1;
    const expected = mcq.length / 4;
    for (const c of counts) {
      // Within one item of even. The authored bank was 46 of 55 on option 2.
      expect(Math.abs(c - expected)).toBeLessThanOrEqual(1);
    }
  });

  it("no ordering item arrives already in its answer order", () => {
    for (const i of ordering) {
      if (i.answerKey.type !== "ordering") continue;
      const identity = i.answerKey.order.every((v, k) => v === k);
      expect(identity, `${i.id} is correct before the learner touches it`).toBe(false);
    }
  });

  it("no single multi-select option appears in every answer", () => {
    const counts = new Map<number, number>();
    for (const i of multi) {
      if (i.answerKey.type !== "multi") continue;
      for (const c of i.answerKey.correct) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    for (const [, n] of counts) expect(n).toBeLessThan(multi.length);
  });

  it("every answer key still points inside its own options", () => {
    for (const i of items) {
      if (i.payload.type === "mcq" && i.answerKey.type === "mcq") {
        expect(i.answerKey.correct).toBeGreaterThanOrEqual(0);
        expect(i.answerKey.correct).toBeLessThan(i.payload.options.length);
      }
      if (i.payload.type === "multi" && i.answerKey.type === "multi") {
        expect(i.answerKey.correct.length).toBeGreaterThan(0);
        for (const c of i.answerKey.correct) expect(c).toBeLessThan(i.payload.options.length);
      }
      if (i.payload.type === "ordering" && i.answerKey.type === "ordering") {
        expect([...i.answerKey.order].sort((a, b) => a - b)).toEqual(
          i.payload.entries.map((_, k) => k),
        );
      }
    }
  });
});

describe("the assessment forms stay unseen", () => {
  it("no post-test question is given away as a lesson's inline check", () => {
    const eligible = items.filter((i) => i.isPretestEligible);
    const formB = new Set(pickAssessment(content.kcs, eligible, "B").map((i) => i.id));
    const checks = new Set(
      content.lessons.flatMap((l) =>
        l.blocks.filter((b) => b.kind === "checkQuestion").map((b) => (b as { itemId: string }).itemId),
      ),
    );
    const leaked = [...checks].filter((id) => formB.has(id));
    expect(leaked, `these post-test items are shown, with the answer, inside a lesson`).toEqual([]);
  });

  it("every lesson still has a check question", () => {
    for (const l of content.lessons) {
      expect(l.blocks.some((b) => b.kind === "checkQuestion"), `${l.id} has no check`).toBe(true);
    }
  });
});

describe("debiasItems", () => {
  const sample: Item[] = [
    {
      id: "kc-x-item-1", kcId: "kc-x", type: "mcq", difficulty: "med",
      payload: { type: "mcq", question: "q", options: ["wrong a", "RIGHT", "wrong b", "wrong c"] },
      answerKey: { type: "mcq", correct: 1 }, explanation: "", isPretestEligible: true,
    },
    {
      id: "kc-x-item-2", kcId: "kc-x", type: "multi", difficulty: "med",
      payload: { type: "multi", question: "q", options: ["A", "B", "C", "D"] },
      answerKey: { type: "multi", correct: [0, 2] }, explanation: "", isPretestEligible: false,
    },
    {
      id: "kc-x-item-3", kcId: "kc-x", type: "ordering", difficulty: "med",
      payload: { type: "ordering", question: "q", entries: ["first", "second", "third", "fourth"] },
      answerKey: { type: "ordering", order: [0, 1, 2, 3] }, explanation: "", isPretestEligible: false,
    },
  ];

  it("keeps the correct answer's meaning while moving where it sits", () => {
    const [m, mu, o] = debiasItems(sample);
    if (m!.payload.type !== "mcq" || m!.answerKey.type !== "mcq") throw new Error("shape");
    expect(m!.payload.options[m!.answerKey.correct]).toBe("RIGHT");
    const authored = sample[0]!.payload;
    if (authored.type !== "mcq") throw new Error("shape");
    expect([...m!.payload.options].sort()).toEqual([...authored.options].sort());

    if (mu!.payload.type !== "multi" || mu!.answerKey.type !== "multi") throw new Error("shape");
    expect(mu!.answerKey.correct.map((k) => (mu!.payload as { options: string[] }).options[k]).sort())
      .toEqual(["A", "C"]);

    if (o!.payload.type !== "ordering" || o!.answerKey.type !== "ordering") throw new Error("shape");
    expect(o!.answerKey.order.map((k) => (o!.payload as { entries: string[] }).entries[k]))
      .toEqual(["first", "second", "third", "fourth"]);
    expect(o!.answerKey.order.every((v, k) => v === k)).toBe(false);
  });

  it("is deterministic, so a rebuild matches the seeded database", () => {
    expect(JSON.stringify(debiasItems(sample))).toBe(JSON.stringify(debiasItems(sample)));
  });
});
