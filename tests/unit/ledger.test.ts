import { describe, expect, it } from "vitest";
import {
  applyPlacement,
  emptyDoc,
  HISTORY_LIMIT,
  kindOf,
  masteryDiffers,
  mergePractice,
  rebuildMastery,
  replayPractice,
  type LoggedSession,
} from "@/lib/mastery/ledger";
import { DEFAULT_PARAMS, MASTERY_THRESHOLD, updateMastery } from "@/lib/bkt";

/*
 * The mastery document is a cache of the response log. These tests pin the
 * rebuild to hand-worked arithmetic (default parameters pL0 0.25, pT 0.12,
 * pG 0.2, pS 0.1), and prove the rebuild agrees with the live write it
 * replaces, so repairing a learner's model can never change it unless it
 * was actually wrong.
 *
 *   one correct from 0.25:  0.225 / 0.375 = 0.6,    0.6 + 0.4 x 0.12  = 0.648
 *   one wrong   from 0.25:  0.025 / 0.625 = 0.04,   0.04 + 0.96 x 0.12 = 0.1552
 */

const KCS = ["kc-a", "kc-b", "kc-c"];
const ans = (kcId: string, correct: boolean, ts: number) => ({ kcId, correct, ts });

describe("kindOf", () => {
  it("maps every session type to how it touches the model", () => {
    expect(kindOf("placement")).toBe("placement");
    expect(kindOf("post-test")).toBe("assessment");
    for (const t of ["topic-test", "lesson-check", "review"]) expect(kindOf(t)).toBe("practice");
  });
});

describe("applyPlacement", () => {
  it("initialises every KC from the placement answers, by hand-worked values", () => {
    const doc = applyPlacement(KCS, [ans("kc-a", true, 1), ans("kc-b", false, 2)], 100);
    expect(doc.kcs["kc-a"]!.pL).toBeCloseTo(0.648, 12);
    expect(doc.kcs["kc-b"]!.pL).toBeCloseTo(0.1552, 12);
    // No answer for kc-c, so it keeps the prior.
    expect(doc.kcs["kc-c"]!.pL).toBe(DEFAULT_PARAMS.pL0);
    expect(doc.kcs["kc-a"]!.attempts).toBe(1);
    expect(doc.kcs["kc-c"]!.attempts).toBe(0);
    expect(doc.history).toEqual([]);
  });

  it("stamps masteredAt only for a KC placed at or above the threshold", () => {
    const strong = applyPlacement(["kc-a"], [ans("kc-a", true, 1), ans("kc-a", true, 2)], 50);
    expect(strong.kcs["kc-a"]!.pL).toBeGreaterThanOrEqual(MASTERY_THRESHOLD);
    expect(strong.kcs["kc-a"]!.masteredAt).toBe(50);
    const weak = applyPlacement(["kc-a"], [ans("kc-a", false, 1)], 50);
    expect(weak.kcs["kc-a"]!.masteredAt).toBeNull();
  });
});

describe("mergePractice", () => {
  it("updates only the KCs a session touched, and adds to their attempts", () => {
    const start = applyPlacement(KCS, [ans("kc-a", true, 1)], 10);
    const next = mergePractice(start, { "kc-a": 0.9 }, { "kc-a": 3 }, 20);
    expect(next.kcs["kc-a"]).toEqual({ pL: 0.9, attempts: 4, lastSeen: 20, masteredAt: 20 });
    expect(next.kcs["kc-b"]).toEqual(start.kcs["kc-b"]);
    expect(next.history).toEqual([{ ts: 20, kcId: "kc-a", pL: 0.9 }]);
  });

  it("never clears masteredAt once set, matching the one-off mastery ceremony", () => {
    let doc = mergePractice(emptyDoc(), { "kc-a": 0.85 }, { "kc-a": 1 }, 5);
    doc = mergePractice(doc, { "kc-a": 0.5 }, { "kc-a": 1 }, 9);
    expect(doc.kcs["kc-a"]!.masteredAt).toBe(5);
  });

  it("keeps the history to its cap, newest last", () => {
    let doc = emptyDoc();
    for (let i = 0; i < HISTORY_LIMIT + 25; i++) doc = mergePractice(doc, { "kc-a": 0.5 }, { "kc-a": 1 }, i);
    expect(doc.history).toHaveLength(HISTORY_LIMIT);
    expect(doc.history.at(-1)!.ts).toBe(HISTORY_LIMIT + 24);
  });
});

describe("replayPractice", () => {
  it("applies answers in the order they were given, not the order they were stored", () => {
    const start = applyPlacement(KCS, [ans("kc-a", true, 1)], 10);
    const inOrder = replayPractice(start, [ans("kc-a", true, 1), ans("kc-a", false, 2)]);
    const shuffled = replayPractice(start, [ans("kc-a", false, 2), ans("kc-a", true, 1)]);
    expect(shuffled).toEqual(inOrder);
    const expected = updateMastery(updateMastery(0.648, true).pL, false).pL;
    expect(inOrder.after["kc-a"]).toBeCloseTo(expected, 12);
    expect(inOrder.attempts["kc-a"]).toBe(2);
  });
});

describe("rebuildMastery", () => {
  const placement: LoggedSession = { id: "p", type: "placement", answers: [ans("kc-a", true, 1), ans("kc-b", false, 2)] };
  const practice: LoggedSession = { id: "q", type: "topic-test", answers: [ans("kc-a", true, 10), ans("kc-a", true, 11)] };
  const postTest: LoggedSession = { id: "t", type: "post-test", answers: [ans("kc-a", false, 20), ans("kc-b", false, 21)] };

  it("folds placement then practice to the hand-worked value", () => {
    const doc = rebuildMastery(KCS, [practice, placement]);
    expect(doc.kcs["kc-a"]!.pL).toBeCloseTo(0.979988841449, 10);
    expect(doc.kcs["kc-a"]!.attempts).toBe(3);
    expect(doc.kcs["kc-b"]!.pL).toBeCloseTo(0.1552, 12);
  });

  it("ignores the post-test, which measures and never moves the model", () => {
    expect(rebuildMastery(KCS, [placement, practice, postTest])).toEqual(rebuildMastery(KCS, [placement, practice]));
  });

  it("orders sessions by when they were answered, however they are passed in", () => {
    expect(rebuildMastery(KCS, [practice, placement])).toEqual(rebuildMastery(KCS, [placement, practice]));
  });

  it("gives the empty model when there is nothing in the log", () => {
    expect(rebuildMastery(KCS, [])).toEqual(emptyDoc());
    expect(rebuildMastery(KCS, [{ id: "x", type: "topic-test", answers: [] }])).toEqual(emptyDoc());
  });

  it("agrees with the live write, session by session, so a repair only changes a model that was wrong", () => {
    // What the live app does: apply placement, then each practice session
    // from the document as it stood when that session began.
    let live = applyPlacement(KCS, placement.answers, 2);
    const second: LoggedSession = { id: "r", type: "lesson-check", answers: [ans("kc-b", true, 30), ans("kc-b", true, 31)] };
    for (const s of [practice, second]) {
      const { after, attempts } = replayPractice(live, s.answers);
      live = mergePractice(live, after, attempts, Math.max(...s.answers.map((a) => a.ts)));
    }
    const rebuilt = rebuildMastery(KCS, [second, placement, practice]);
    expect(masteryDiffers(live.kcs, rebuilt.kcs)).toBe(false);
  });

  it("recovers a session whose write was lost", () => {
    // Session `practice` completed but its mastery write failed; the next
    // session started from the stale document. The rebuild puts it back.
    const stale = applyPlacement(KCS, placement.answers, 2);
    const rebuilt = rebuildMastery(KCS, [placement, practice]);
    expect(masteryDiffers(stale.kcs, rebuilt.kcs)).toBe(true);
    expect(rebuilt.kcs["kc-a"]!.pL).toBeGreaterThan(stale.kcs["kc-a"]!.pL);
  });
});

describe("masteryDiffers", () => {
  const base = { a: { pL: 0.5, attempts: 2 } };
  it("is false for the same model", () => expect(masteryDiffers(base, { a: { pL: 0.5, attempts: 2 } })).toBe(false));
  it("sees a changed estimate", () => expect(masteryDiffers(base, { a: { pL: 0.51, attempts: 2 } })).toBe(true));
  it("sees changed attempts", () => expect(masteryDiffers(base, { a: { pL: 0.5, attempts: 3 } })).toBe(true));
  it("sees a missing KC either way", () => {
    expect(masteryDiffers(base, {})).toBe(true);
    expect(masteryDiffers({}, base)).toBe(true);
  });
  it("tolerates floating-point noise", () =>
    expect(masteryDiffers(base, { a: { pL: 0.5 + 1e-12, attempts: 2 } })).toBe(false));
});
