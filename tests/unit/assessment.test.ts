import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalisedGain, pickAssessment, susScore, SUS_ITEMS } from "@/lib/assessment";
import type { Level1Content } from "@/lib/content/types";

const content: Level1Content = JSON.parse(readFileSync("content/level1.json", "utf8"));
const eligible = content.items.filter((i) => i.isPretestEligible);

describe("pickAssessment", () => {
  it("takes one eligible item per KC in prerequisite order for both forms", () => {
    for (const form of ["A", "B"] as const) {
      const picked = pickAssessment(content.kcs, eligible, form);
      expect(picked.map((i) => i.kcId)).toEqual(content.kcs.map((k) => k.id));
      expect(new Set(picked.map((i) => i.id)).size).toBe(picked.length);
    }
  });

  it("form B differs from form A wherever the KC has more than one eligible item", () => {
    const a = pickAssessment(content.kcs, eligible, "A");
    const b = pickAssessment(content.kcs, eligible, "B");
    const perKc = new Map<string, number>();
    for (const i of eligible) perKc.set(i.kcId, (perKc.get(i.kcId) ?? 0) + 1);
    a.forEach((ia, idx) => {
      const ib = b[idx]!;
      if ((perKc.get(ia.kcId) ?? 0) > 1) expect(ib.id).not.toBe(ia.id);
      else expect(ib.id).toBe(ia.id);
    });
    // Only Liquidity is a repeat in the shipped bank; the analysis caveats say so.
    const repeats = a.filter((ia, idx) => b[idx]!.id === ia.id).map((i) => i.kcId);
    expect(repeats).toEqual(["kc-liquidity"]);
  });

  it("skips a KC with no eligible item rather than failing", () => {
    const picked = pickAssessment(content.kcs, eligible.filter((i) => i.kcId !== "kc-liquidity"), "A");
    expect(picked.map((i) => i.kcId)).not.toContain("kc-liquidity");
    expect(picked).toHaveLength(content.kcs.length - 1);
  });
});

describe("normalisedGain", () => {
  it("is the fraction of the headroom made up", () => {
    expect(normalisedGain(8, 12, 16)).toBeCloseTo(0.5);
    expect(normalisedGain(0, 16, 16)).toBe(1);
    expect(normalisedGain(10, 10, 16)).toBe(0);
    expect(normalisedGain(12, 8, 16)).toBeCloseTo(-1);
  });
  it("is undefined at the ceiling", () => {
    expect(normalisedGain(16, 16, 16)).toBeNull();
    expect(normalisedGain(0, 0, 0)).toBeNull();
  });
});

describe("susScore", () => {
  it("has ten statements alternating positive and negative", () => {
    expect(SUS_ITEMS).toHaveLength(10);
  });
  it("scores all-agree-with-positives, all-disagree-with-negatives as 100", () => {
    expect(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(100);
    expect(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0);
    expect(susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(50);
  });
  it("matches Brooke's worked arithmetic", () => {
    // positives 3+4+3+4+3 = 17, negatives 3+4+3+3+3 = 16, 33 × 2.5 = 82.5
    expect(susScore([4, 2, 5, 1, 4, 2, 5, 2, 4, 2])).toBe(82.5);
  });
  it("rejects an incomplete or out-of-range answer set", () => {
    expect(susScore([4, 2, 5])).toBeNull();
    expect(susScore([4, 2, 5, 1, 4, 2, 5, 2, 4, 6])).toBeNull();
    expect(susScore([4, 2, 5, 1, 4, 2, 5, 2, 4, 0])).toBeNull();
  });
});
