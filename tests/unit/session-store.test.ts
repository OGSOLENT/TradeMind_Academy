import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Item, Kc } from "@/lib/content/types";
import { updateMastery } from "@/lib/bkt";

/*
 * The quiz session is the state machine at the centre of the tutor: it
 * decides every next question, grades every answer, moves the learner
 * model, and writes each answer to the research log. Until the September
 * audit it had no unit tests at all and was covered only by browser tests.
 * The logger is replaced with a recorder so every logged event can be
 * checked field by field.
 */

const logged = vi.hoisted(() => [] as Array<Record<string, unknown>>);
vi.mock("@/lib/logging", () => ({
  getLogger: () => ({ enqueue: (e: Record<string, unknown>) => logged.push(e) }),
}));

import { isAssessment, useQuizSession } from "@/lib/quiz/session-store";

const kc = (id: string, prereqIds: string[] = []): Kc => ({
  id,
  courseId: "c",
  title: id,
  prereqIds,
  level: 1,
  description: "",
});

const mcq = (id: string, kcId: string, difficulty: Item["difficulty"], correct = 0): Item => ({
  id,
  kcId,
  type: "mcq",
  difficulty,
  payload: { type: "mcq", question: id, options: ["w", "x", "y", "z"] },
  answerKey: { type: "mcq", correct },
  explanation: "",
  isPretestEligible: false,
});

const right = (it: Item) => ({ type: "mcq" as const, selected: (it.answerKey as { correct: number }).correct });
const wrong = (it: Item) => ({ type: "mcq" as const, selected: ((it.answerKey as { correct: number }).correct + 1) % 4 });

const store = () => useQuizSession.getState();
const current = () => store().items[store().currentIndex]!;

const KCS = [kc("a"), kc("b", ["a"])];
const POOL = [
  mcq("a-e1", "a", "easy"),
  mcq("a-e2", "a", "easy"),
  mcq("a-m1", "a", "med"),
  mcq("a-m2", "a", "med"),
  mcq("a-h1", "a", "hard"),
  mcq("b-m1", "b", "med"),
];

beforeEach(() => {
  logged.length = 0;
  store().reset();
});
afterEach(() => vi.useRealTimers());

describe("isAssessment", () => {
  it("is true only for the two measurement sessions", () => {
    expect(isAssessment("placement")).toBe(true);
    expect(isAssessment("post-test")).toBe(true);
    for (const t of ["topic-test", "lesson-check", "review"] as const) expect(isAssessment(t)).toBe(false);
  });
});

describe("a fixed session (placement)", () => {
  const items = [mcq("p1", "a", "med"), mcq("p2", "b", "med")];

  it("starts at the first item with the whole sequence as its length", () => {
    store().startFixed("u1", "s1", "placement", items, { a: 0.25, b: 0.25 });
    expect(store().targetLength).toBe(2);
    expect(current().id).toBe("p1");
    expect(store().masteryAtStart).toEqual({ a: 0.25, b: 0.25 });
  });

  it("grades and logs every answer but never moves the model", () => {
    store().startFixed("u1", "s1", "placement", items, { a: 0.25, b: 0.25 });
    store().submit(current(), right(current()));
    const rec = store().answers["p1"]!;
    expect(rec.correct).toBe(true);
    expect(rec.pLAfter).toBe(rec.pLBefore);
    expect(store().mastery.a).toBe(0.25);
    expect(logged[0]).toMatchObject({ uid: "u1", sessionId: "s1", itemId: "p1", kcId: "a", correct: true, pLBefore: 0.25, pLAfter: 0.25 });
  });

  it("advances through the sequence and completes after the last item", () => {
    store().startFixed("u1", "s1", "post-test", items, { a: 0.9, b: 0.9 });
    store().submit(current(), right(current()));
    store().next();
    expect(current().id).toBe("p2");
    expect(store().phase).toBe("answering");
    store().submit(current(), wrong(current()));
    store().next();
    expect(store().phase).toBe("complete");
    expect(store().mastery).toEqual({ a: 0.9, b: 0.9 });
  });
});

describe("an adaptive session (practice)", () => {
  it("opens on the weakest unlocked KC and records why", () => {
    // b is locked until a is mastered, so the session has to start on a.
    store().startAdaptive("u1", "s2", POOL, KCS, { a: 0.5, b: 0.1 }, 5);
    expect(current().kcId).toBe("a");
    expect(current().difficulty).toBe("med");
    expect(store().reasons[current().id]).toMatchObject({ kcId: "a", remediation: false });
  });

  it("moves the model by exactly one BKT step per answer and logs both sides", () => {
    store().startAdaptive("u1", "s2", POOL, KCS, { a: 0.5, b: 0.1 }, 5);
    const it1 = current();
    store().submit(it1, right(it1));
    const expected = updateMastery(0.5, true).pL;
    expect(store().mastery.a).toBeCloseTo(expected, 12);
    expect(logged[0]).toMatchObject({ pLBefore: 0.5, correct: true });
    expect(logged[0]!.pLAfter as number).toBeCloseTo(expected, 12);
  });

  it("ignores a second submission of the same item, so the log can't double-count", () => {
    store().startAdaptive("u1", "s2", POOL, KCS, { a: 0.5, b: 0.1 }, 5);
    const it1 = current();
    store().submit(it1, right(it1));
    store().submit(it1, wrong(it1));
    expect(logged).toHaveLength(1);
    expect(store().answers[it1.id]!.correct).toBe(true);
  });

  it("forces remediation after two wrong answers in a row, and clears it on a right one", () => {
    store().startAdaptive("u1", "s2", POOL, KCS, { a: 0.6, b: 0.1 }, 5);
    for (let i = 0; i < 2; i++) {
      store().submit(current(), wrong(current()));
      store().next();
    }
    expect(store().consecutiveWrong.a).toBe(2);
    expect(store().reasons[current().id]!.remediation).toBe(true);
    expect(current().difficulty).toBe("easy");
    store().submit(current(), right(current()));
    expect(store().consecutiveWrong.a).toBe(0);
  });

  it("never asks the same item twice in a session", () => {
    store().startAdaptive("u1", "s2", POOL, KCS, { a: 0.5, b: 0.1 }, 5);
    const seen: string[] = [];
    while (store().phase !== "complete") {
      seen.push(current().id);
      store().submit(current(), wrong(current()));
      store().next();
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("completes at its target length", () => {
    store().startAdaptive("u1", "s2", POOL, KCS, { a: 0.5, b: 0.1 }, 3);
    for (let i = 0; i < 3; i++) {
      store().submit(current(), right(current()));
      store().next();
    }
    expect(store().phase).toBe("complete");
    expect(store().items).toHaveLength(3);
  });

  it("completes early when the pool runs out, rather than hanging", () => {
    const tiny = [mcq("a-only", "a", "med")];
    store().startAdaptive("u1", "s2", tiny, [kc("a")], { a: 0.3 }, 10);
    store().submit(current(), wrong(current()));
    store().next();
    expect(store().phase).toBe("complete");
  });

  it("ends cleanly instead of hanging when started with no modules at all", () => {
    store().startAdaptive("u1", "s2", POOL, [], {}, 5);
    expect(store().items).toEqual([]);
    store().next();
    expect(store().phase).toBe("complete");
  });

  it("falls back to another KC when the target KC has no items left", () => {
    // a is mastered so b unlocks, but b is the target and has one item;
    // after it, a still has items and should be offered rather than stopping.
    const pool = [mcq("b-1", "b", "med"), mcq("a-1", "a", "hard")];
    store().startAdaptive("u1", "s2", pool, KCS, { a: 0.85, b: 0.3 }, 2);
    expect(current().kcId).toBe("b");
    store().submit(current(), right(current()));
    store().next();
    expect(store().phase).toBe("answering");
    expect(current().id).toBe("a-1");
  });
});

describe("timing and reset", () => {
  it("logs latency from the moment the item was shown", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    store().startFixed("u1", "s3", "placement", [mcq("t1", "a", "med")], { a: 0.25 });
    store().markShown();
    vi.setSystemTime(1_004_500);
    store().submit(current(), right(current()));
    expect(logged[0]).toMatchObject({ latencyMs: 4500, ts: 1_004_500 });
  });

  it("reset clears the session so a stale one can't be resumed", () => {
    store().startFixed("u1", "s4", "placement", [mcq("r1", "a", "med")], { a: 0.25 });
    store().reset();
    expect(store().sessionId).toBeNull();
    expect(store().items).toEqual([]);
    expect(store().answers).toEqual({});
  });

  it("refuses to log an answer when no session is running", () => {
    store().submit(mcq("x", "a", "med"), { type: "mcq", selected: 0 });
    expect(logged).toHaveLength(0);
  });
});
