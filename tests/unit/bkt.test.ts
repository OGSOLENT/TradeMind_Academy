import { describe, expect, it } from "vitest";
import {
  DEFAULT_PARAMS,
  MASTERY_THRESHOLD,
  REMEDIATION_THRESHOLD,
  initialiseFromPlacement,
  masteryBand,
  predictCorrect,
  updateMastery,
} from "@/lib/bkt";

/**
 * Fixtures I worked out by hand (defaults pL0=0.25, pT=0.12, pG=0.20, pS=0.10):
 *
 * CORRECT from 0.25:
 *   num = 0.25·0.9 = 0.225 ; den = 0.225 + 0.75·0.2 = 0.375
 *   pL|e = 0.6 ; pL' = 0.6 + 0.4·0.12 = 0.648
 * WRONG from 0.25:
 *   num = 0.25·0.1 = 0.025 ; den = 0.025 + 0.75·0.8 = 0.625
 *   pL|e = 0.04 ; pL' = 0.04 + 0.96·0.12 = 0.1552
 * PREDICT at 0.25: 0.25·0.9 + 0.75·0.2 = 0.375
 */
describe("updateMastery — hand-computed fixtures", () => {
  it("correct answer from the prior 0.25 → 0.648", () => {
    const { pL, pCorrectPredicted } = updateMastery(0.25, true);
    expect(pL).toBeCloseTo(0.648, 10);
    expect(pCorrectPredicted).toBeCloseTo(0.375, 10);
  });

  it("wrong answer from the prior 0.25 → 0.1552", () => {
    const { pL } = updateMastery(0.25, false);
    expect(pL).toBeCloseTo(0.1552, 10);
  });

  it("second correct from 0.648 → 0.92512…", () => {
    // num = 0.648·0.9 = 0.5832 ; den = 0.5832 + 0.352·0.2 = 0.6536
    // pL|e = 0.892289… ; pL' = pL|e + (1-pL|e)·0.12 = 0.905214…
    const { pL } = updateMastery(0.648, true);
    expect(pL).toBeCloseTo(0.9052145, 6);
  });

  it("predictCorrect uses the prior, not the posterior", () => {
    expect(predictCorrect(0.25)).toBeCloseTo(0.375, 10);
    expect(predictCorrect(1)).toBeCloseTo(0.9, 10); // 1·(1-pS)
    expect(predictCorrect(0)).toBeCloseTo(0.2, 10); // pG
  });

  it("stays within [0,1] under long streaks", () => {
    let pL = DEFAULT_PARAMS.pL0;
    for (let i = 0; i < 50; i++) pL = updateMastery(pL, true).pL;
    expect(pL).toBeGreaterThan(0.99);
    expect(pL).toBeLessThanOrEqual(1);
    for (let i = 0; i < 50; i++) pL = updateMastery(pL, false).pL;
    expect(pL).toBeGreaterThanOrEqual(0);
    // pT keeps a floor under it. pL' stays at or above pT even after endless wrongs
    expect(pL).toBeGreaterThanOrEqual(DEFAULT_PARAMS.pT - 1e-12);
  });
});

describe("threshold crossings (report-canonical 0.8 / 0.4)", () => {
  it("constants are exact", () => {
    expect(MASTERY_THRESHOLD).toBe(0.8);
    expect(REMEDIATION_THRESHOLD).toBe(0.4);
  });

  it("a streak of correct answers crosses 0.8 within a few items", () => {
    let pL = DEFAULT_PARAMS.pL0;
    let steps = 0;
    while (pL < MASTERY_THRESHOLD && steps < 10) {
      pL = updateMastery(pL, true).pL;
      steps++;
    }
    expect(steps).toBeLessThanOrEqual(3); // 0.25 → 0.648 → 0.905
  });

  it("a streak of wrong answers stays below 0.4", () => {
    let pL = DEFAULT_PARAMS.pL0;
    for (let i = 0; i < 10; i++) {
      pL = updateMastery(pL, false).pL;
      expect(pL).toBeLessThan(REMEDIATION_THRESHOLD);
    }
  });

  it("masteryBand boundaries are inclusive/exclusive exactly per spec", () => {
    expect(masteryBand(0.8)).toBe("mastered");
    expect(masteryBand(0.7999999)).toBe("practice");
    expect(masteryBand(0.4)).toBe("practice");
    expect(masteryBand(0.3999999)).toBe("remediate");
  });
});

describe("initialiseFromPlacement", () => {
  it("kcs without evidence keep the default prior", () => {
    const out = initialiseFromPlacement([], ["a", "b"]);
    expect(out).toEqual({ a: 0.25, b: 0.25 });
  });

  it("evidence sequences run the full update per KC", () => {
    const out = initialiseFromPlacement(
      [
        { kcId: "a", correct: true },
        { kcId: "a", correct: true },
        { kcId: "b", correct: false },
      ],
      ["a", "b", "c"],
    );
    expect(out.a).toBeCloseTo(0.9052145, 6);
    expect(out.b).toBeCloseTo(0.1552, 10);
    expect(out.c).toBe(0.25);
  });
});
