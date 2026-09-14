import { describe, expect, it } from "vitest";
import { WALKTHROUGHS } from "@/lib/walkthroughs";
import { CASE_STUDIES } from "@/lib/case-studies";
import { build } from "@/lib/walkthroughs/synth";
import type { Anno } from "@/lib/walkthroughs/types";

/**
 * The walkthroughs are teaching material, so the thing to test is that
 * every chart actually shows what its captions claim. The synth has to put
 * the close on each control point and honour every forced candle, and no
 * step may point at a bar that doesn't exist or a price miles off the
 * chart. A caption that says "bar 40 closes below L2" is checked by the
 * spec author; a bar index outside the series is checked here.
 */

function bars(a: Anno): number[] {
  switch (a.kind) {
    case "hline":
      return [a.from ?? 0, a.to ?? 0];
    case "zone":
    case "band":
    case "bracket":
      return [a.from, a.to];
    case "vline":
    case "marker":
      return [a.bar];
    case "note":
      return a.bar !== undefined ? [a.bar] : [];
    case "arrow":
      return [a.from[0], a.to[0]];
    case "path":
      return a.points.map((p) => p[0]);
  }
}

describe("synthetic series", () => {
  it("passes through its control points and keeps candles consistent", () => {
    const s = build({
      seed: 1,
      bars: 20,
      points: [
        [0, 100],
        [10, 110],
        [19, 105],
      ],
      vol: 0.01,
    });
    expect(s).toHaveLength(20);
    expect(s[0]!.c).toBeCloseTo(100, 6);
    expect(s[10]!.c).toBeCloseTo(110, 6);
    expect(s[19]!.c).toBeCloseTo(105, 6);
    for (const c of s) {
      expect(c.h).toBeGreaterThanOrEqual(Math.max(c.o, c.c));
      expect(c.l).toBeLessThanOrEqual(Math.min(c.o, c.c));
    }
  });

  it("is deterministic for a seed and honours forced candles", () => {
    const a = build({
      seed: 7,
      bars: 12,
      points: [
        [0, 50],
        [11, 60],
      ],
    });
    const b = build({
      seed: 7,
      bars: 12,
      points: [
        [0, 50],
        [11, 60],
      ],
    });
    expect(a).toEqual(b);
    const f = build({
      seed: 7,
      bars: 12,
      points: [
        [0, 50],
        [11, 60],
      ],
      force: { 5: { o: 52, c: 58, h: 58.5, l: 51 } },
    });
    expect(f[5]).toEqual({ o: 52, c: 58, h: 58.5, l: 51 });
    // The next bar opens where the forced bar closed.
    expect(f[6]!.o).toBe(58);
  });
});

describe("walkthrough specs", () => {
  const all = Object.values(WALKTHROUGHS);

  it("cover every lesson that has no recording, and the recorded core", () => {
    // 25 for the unrecorded lessons 26 to 48, 11 for the fractal model,
    // 10 for the recorded foundations, 2 for the instruments module.
    expect(all).toHaveLength(48);
  });

  it.each(all.map((w) => [w.id, w] as const))(
    "%s: every step points inside the chart",
    (_id, w) => {
      const n = w.candles.length;
      let lo = Infinity;
      let hi = -Infinity;
      for (const c of w.candles) {
        lo = Math.min(lo, c.l);
        hi = Math.max(hi, c.h);
      }
      const slack = (hi - lo) * 0.6;
      expect(w.steps.length).toBeGreaterThanOrEqual(3);
      for (const step of w.steps) {
        expect(step.caption.length).toBeGreaterThan(40);
        for (const a of step.annos) {
          for (const b of bars(a)) {
            expect(b, `${w.id}: ${a.kind} bar ${b}`).toBeGreaterThanOrEqual(0);
            expect(b, `${w.id}: ${a.kind} bar ${b}`).toBeLessThan(n);
          }
          const prices =
            a.kind === "hline" || a.kind === "bracket" || a.kind === "marker"
              ? [a.price]
              : a.kind === "note"
                ? a.price !== undefined
                  ? [a.price]
                  : []
                : a.kind === "zone"
                  ? [a.low, a.high]
                  : a.kind === "arrow"
                    ? [a.from[1], a.to[1]]
                    : a.kind === "path"
                      ? a.points.map((p) => p[1])
                      : [];
          for (const p of prices) {
            expect(p, `${w.id}: ${a.kind} price ${p}`).toBeGreaterThan(lo - slack);
            expect(p, `${w.id}: ${a.kind} price ${p}`).toBeLessThan(hi + slack);
          }
          if (a.kind === "zone") expect(a.high).toBeGreaterThan(a.low);
        }
      }
      if (w.overlay) expect(w.overlay.values).toHaveLength(n);
    },
  );

  it("markers sit on the candle they describe", () => {
    // A marker's price should be within the candle's range (or just past a
    // wick it labels), otherwise the dot floats away from the bar.
    for (const w of Object.values(WALKTHROUGHS)) {
      for (const step of w.steps) {
        for (const a of step.annos) {
          if (a.kind !== "marker") continue;
          const c = w.candles[a.bar]!;
          const range = c.h - c.l || 1;
          expect(
            a.price,
            `${w.id}: "${a.label}" at bar ${a.bar} (${c.l.toFixed(1)}–${c.h.toFixed(1)})`,
          ).toBeGreaterThan(c.l - range * 1.5 - 3);
          expect(
            a.price,
            `${w.id}: "${a.label}" at bar ${a.bar} (${c.l.toFixed(1)}–${c.h.toFixed(1)})`,
          ).toBeLessThan(c.h + range * 1.5 + 3);
        }
      }
    }
  });
});

describe("real-chart case studies", () => {
  const all = Object.values(CASE_STUDIES);

  it("exist for the sixteen concepts and carry their source", () => {
    expect(all).toHaveLength(16);
    for (const w of all) {
      expect(w.source?.kind).toBe("real");
      expect(w.source?.provider).toBeTruthy();
      expect(w.source?.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(w.frame).toContain("futures");
    }
  });

  it.each(all.map((w) => [w.id, w] as const))("%s: annotations sit inside the real bars", (_id, w) => {
    const n = w.candles.length;
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of w.candles) {
      lo = Math.min(lo, c.l);
      hi = Math.max(hi, c.h);
    }
    for (const step of w.steps) {
      expect(step.caption.length).toBeGreaterThan(40);
      for (const a of step.annos) {
        for (const b of bars(a)) {
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThan(n);
        }
        if (a.kind === "marker") {
          const c = w.candles[a.bar]!;
          // Real markers are placed on actual highs and lows, so they sit exactly on the bar.
          expect(a.price).toBeGreaterThanOrEqual(c.l - (hi - lo) * 0.02);
          expect(a.price).toBeLessThanOrEqual(c.h + (hi - lo) * 0.02);
        }
      }
    }
    if (w.overlay) expect(w.overlay.values).toHaveLength(n);
  });
});
