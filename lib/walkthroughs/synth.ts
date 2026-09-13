import type { Candle } from "./types";

/**
 * The synthetic series builder. A walkthrough needs price to do a specific
 * thing at a specific bar (sweep this low at bar 31, close above that high
 * at bar 38, leave a gap between bars 40 and 42), so the series is drawn
 * from a spine of control points and then noised, rather than random-walked
 * and hoped for. Anything the noise might spoil can be forced exactly with
 * `force`. The random source is seeded, so the same spec always draws the
 * same chart and the captions stay true.
 */

export interface SeriesSpec {
  seed: number;
  bars: number;
  /** Control points the close passes through: [bar, price]. Sorted by bar. */
  points: [number, number][];
  /** Noise on the close as a fraction of price. 0.002 is calm, 0.006 is lively. */
  vol?: number;
  /** Wick length as a fraction of price. */
  wick?: number;
  /** Exact overrides for the bars that matter. Applied last. */
  force?: Record<number, Partial<Candle>>;
}

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export function build(spec: SeriesSpec): Candle[] {
  const rand = rng(spec.seed);
  const vol = spec.vol ?? 0.004;
  const wick = spec.wick ?? 0.004;
  const pts = [...spec.points].sort((a, b) => a[0] - b[0]);
  if (pts.length === 0) throw new Error("a series needs control points");

  // The spine: piecewise linear through the control points, flat beyond the ends.
  const spine = (bar: number): number => {
    if (bar <= pts[0]![0]) return pts[0]![1];
    for (let i = 1; i < pts.length; i++) {
      const [b0, p0] = pts[i - 1]!;
      const [b1, p1] = pts[i]!;
      if (bar <= b1) return p0 + ((p1 - p0) * (bar - b0)) / (b1 - b0);
    }
    return pts[pts.length - 1]![1];
  };

  const out: Candle[] = [];
  let prevClose = spine(0);
  for (let i = 0; i < spec.bars; i++) {
    const target = spine(i);
    // Noise shrinks to nothing on a control point, so the close lands on it.
    const onPoint = pts.some(([b]) => b === i);
    const noise = onPoint ? 0 : (rand() - 0.5) * 2 * vol * target;
    const c = target + noise;
    const o = i === 0 ? c - (target - spine(0)) : prevClose + (rand() - 0.5) * 0.3 * vol * target;
    const top = Math.max(o, c);
    const bot = Math.min(o, c);
    const h = top + rand() * wick * target;
    const l = bot - rand() * wick * target;
    out.push({ o, h, l, c });
    prevClose = c;
  }

  if (spec.force) {
    for (const [bar, partial] of Object.entries(spec.force)) {
      const i = Number(bar);
      const cur = out[i];
      if (!cur) continue;
      const next = { ...cur, ...partial };
      // Keep the candle self-consistent whatever was forced.
      next.h = Math.max(next.h, next.o, next.c);
      next.l = Math.min(next.l, next.o, next.c);
      out[i] = next;
      // The next bar opens where this one closed, so a forced close doesn't
      // leave a phantom gap.
      const after = out[i + 1];
      if (after && partial.c !== undefined && !(spec.force[i + 1]?.o !== undefined)) {
        after.o = next.c;
        after.h = Math.max(after.h, after.o);
        after.l = Math.min(after.l, after.o);
      }
    }
  }
  return out;
}

/** Highest high and lowest low over a bar range, for captions and levels. */
export function extent(candles: Candle[], from: number, to: number): { high: number; low: number; highBar: number; lowBar: number } {
  let high = -Infinity;
  let low = Infinity;
  let highBar = from;
  let lowBar = from;
  for (let i = from; i <= to && i < candles.length; i++) {
    const c = candles[i]!;
    if (c.h > high) {
      high = c.h;
      highBar = i;
    }
    if (c.l < low) {
      low = c.l;
      lowBar = i;
    }
  }
  return { high, low, highBar, lowBar };
}

/** Evenly spaced x-axis labels for an intraday chart. */
export function timeLabels(bars: number, startHour: number, minutesPerBar: number, every: number): Record<number, string> {
  const out: Record<number, string> = {};
  for (let i = 0; i < bars; i += every) {
    const mins = startHour * 60 + i * minutesPerBar;
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    out[i] = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return out;
}
