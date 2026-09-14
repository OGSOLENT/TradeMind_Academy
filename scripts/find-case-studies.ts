/**
 * Cuts the real-chart case studies out of the bars scripts/fetch-bars.ts
 * pulled, and writes them as walkthrough specs.
 *
 *   npx tsx scripts/find-case-studies.ts
 *
 * Each detector below encodes one concept from the lessons as a rule over
 * real bars (a Candle 2 closure is "the low trades below the previous bar's
 * low and the close is back above it", and so on), scores every instance
 * it finds, and keeps the cleanest one. The annotations and the captions
 * are then generated from the bars the rule matched, with the real dates
 * and prices, so the caption can't say something the chart doesn't show.
 * Everything is marked with the symbol, interval, dates and source.
 *
 * The output is lib/case-studies/data/<id>.json plus an index that the
 * lesson page imports. The walkthrough renderer draws them exactly as it
 * draws the synthetic ones; the "Real chart" pill and the source line are
 * the only differences.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Anno, Candle, Step, Walkthrough } from "../lib/walkthroughs/types";

interface Bar extends Candle {
  t: number;
}
interface ET {
  y: number;
  mo: number;
  d: number;
  hh: number;
  mm: number;
  dow: number; // 0 Sunday
  key: string; // yyyy-mm-dd in ET
}
interface Raw {
  symbol: string;
  interval: string;
  retrieved: string;
  source: string;
  bars: Bar[];
}

// ---- Time in New York ----------------------------------------------------

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hour12: false,
});
const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const etCache = new Map<number, ET>();
function et(t: number): ET {
  const hit = etCache.get(t);
  if (hit) return hit;
  const parts = Object.fromEntries(fmt.formatToParts(new Date(t * 1000)).map((p) => [p.type, p.value]));
  const hh = Number(parts.hour) % 24;
  const out: ET = {
    y: Number(parts.year),
    mo: Number(parts.month),
    d: Number(parts.day),
    hh,
    mm: Number(parts.minute),
    dow: DOW[parts.weekday!] ?? 0,
    key: `${parts.year}-${parts.month}-${parts.day}`,
  };
  etCache.set(t, out);
  return out;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hhmm = (b: Bar) => {
  const e = et(b.t);
  return `${String(e.hh).padStart(2, "0")}:${String(e.mm).padStart(2, "0")}`;
};
const dateOf = (b: Bar) => {
  const e = et(b.t);
  return `${DAYS[e.dow]} ${e.d} ${MONTHS[e.mo - 1]} ${e.y}`;
};
const shortDate = (b: Bar) => {
  const e = et(b.t);
  return `${e.d} ${MONTHS[e.mo - 1]}`;
};
const px = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Session day: the futures day that starts at 18:00 ET the evening before. */
function sessionKey(b: Bar): string {
  const e = et(b.t);
  if (e.hh >= 18) {
    const next = new Date(Date.UTC(e.y, e.mo - 1, e.d + 1));
    return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  }
  return e.key;
}

// ---- Loading and cleaning ------------------------------------------------

function load(file: string): Raw {
  const raw = JSON.parse(readFileSync(`content/bars/${file}.json`, "utf8")) as Raw;
  const ranges = raw.bars.map((b) => b.h - b.l).sort((a, b) => a - b);
  const median = ranges[Math.floor(ranges.length / 2)] ?? 1;
  // Bad ticks show up as absurd ranges; drop them rather than let a detector
  // mistake one for a sweep.
  raw.bars = raw.bars.filter((b) => b.h - b.l <= median * 25 && b.h >= b.l && b.h >= Math.max(b.o, b.c) && b.l <= Math.min(b.o, b.c));
  return raw;
}
function avgRange(bars: Bar[], i: number, n = 20): number {
  let s = 0;
  let k = 0;
  for (let j = Math.max(0, i - n); j < i; j++) {
    s += bars[j]!.h - bars[j]!.l;
    k++;
  }
  return k ? s / k : 1;
}
/**
 * A window is usable when its bars are consecutive (no weekend or holiday
 * gap inside it, other than the daily maintenance break) and nothing in it
 * is a freak bar that would squash the rest of the chart. The NWOG detector
 * is the one that wants a gap, and it doesn't use this.
 */
function cleanWindow(bars: Bar[], a: number, b: number, interval: string): boolean {
  const maxGap = interval === "1h" ? 2.5 * 3600 : interval === "5m" ? 70 * 60 : 4 * 86400;
  let sum = 0;
  let n = 0;
  let biggest = 0;
  for (let i = a; i <= b && i < bars.length; i++) {
    if (i > a && bars[i]!.t - bars[i - 1]!.t > maxGap) return false;
    const r = bars[i]!.h - bars[i]!.l;
    sum += r;
    n++;
    biggest = Math.max(biggest, r);
  }
  return n > 0 && biggest <= (sum / n) * 5;
}
/** Intraday examples read better in the New York cash session, so they get a nudge. */
function rthBonus(bar: Bar): number {
  const e = et(bar.t);
  return e.dow >= 1 && e.dow <= 5 && e.hh >= 8 && e.hh < 16 ? 3 : 0;
}
function maxHigh(bars: Bar[], a: number, b: number): { v: number; i: number } {
  let v = -Infinity;
  let at = a;
  for (let i = a; i <= b && i < bars.length; i++) if (bars[i]!.h > v) {
    v = bars[i]!.h;
    at = i;
  }
  return { v, i: at };
}
function minLow(bars: Bar[], a: number, b: number): { v: number; i: number } {
  let v = Infinity;
  let at = a;
  for (let i = a; i <= b && i < bars.length; i++) if (bars[i]!.l < v) {
    v = bars[i]!.l;
    at = i;
  }
  return { v, i: at };
}
/** Aggregate 5-minute bars into n-bar candles aligned to the session. */
function aggregate(bars: Bar[], n: number): Bar[] {
  const out: Bar[] = [];
  for (let i = 0; i + n <= bars.length; i += n) {
    const chunk = bars.slice(i, i + n);
    // Only merge bars that are actually consecutive (no gap across a break).
    if (chunk[n - 1]!.t - chunk[0]!.t > 300 * (n - 1) * 1.5) continue;
    out.push({
      t: chunk[0]!.t,
      o: chunk[0]!.o,
      h: Math.max(...chunk.map((b) => b.h)),
      l: Math.min(...chunk.map((b) => b.l)),
      c: chunk[n - 1]!.c,
    });
  }
  return out;
}

// ---- Building a spec from a window ---------------------------------------

interface Found {
  id: string;
  score: number;
  build(): Walkthrough;
}

function labelsFor(bars: Bar[], every: number, intraday: boolean): Record<number, string> {
  const out: Record<number, string> = {};
  for (let i = 0; i < bars.length; i += every) out[i] = intraday ? hhmm(bars[i]!) : shortDate(bars[i]!);
  return out;
}

function spec(
  raw: Raw,
  window: Bar[],
  id: string,
  title: string,
  frameNote: string,
  steps: Step[],
  intraday: boolean,
  every: number,
): Walkthrough {
  const first = window[0]!;
  const last = window[window.length - 1]!;
  const sameDay = et(first.t).key === et(last.t).key;
  const span = sameDay ? dateOf(first) : `${dateOf(first)} to ${dateOf(last)}`;
  const interval = raw.interval === "1h" ? "1-hour" : raw.interval === "1d" ? "daily" : raw.interval === "5m" ? "5-minute" : raw.interval;
  return {
    id,
    title,
    frame: `${raw.symbol.replace("=F", "")} futures, ${frameNote || interval + " bars"}, ${span}`,
    candles: window.map(({ o, h, l, c }) => ({ o, h, l, c })),
    xLabels: labelsFor(window, every, intraday),
    steps,
    source: {
      kind: "real",
      symbol: raw.symbol,
      interval: raw.interval,
      from: dateOf(first),
      to: dateOf(last),
      provider: raw.source,
      retrieved: raw.retrieved,
    },
  };
}

// ---- Detectors -----------------------------------------------------------

/** Lesson 5. The low trades below the previous bar's low and closes back above it, after a decline, with follow-through. */
function findCandle2(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (let i = 8; i < b.length - 12; i++) {
    const c1 = b[i - 1]!;
    const c2 = b[i]!;
    if (!(c2.l < c1.l && c2.c > c1.l && c2.c > c2.o)) continue;
    const ar = avgRange(b, i);
    const decline = b[i - 6]!.c - c1.c;
    if (decline < ar * 1.5) continue;
    const sweep = c1.l - c2.l;
    if (sweep < ar * 0.1 || sweep > ar * 1.2) continue;
    const wickShare = (c2.h - c2.l) > 0 ? (Math.min(c2.o, c2.c) - c2.l) / (c2.h - c2.l) : 0;
    const c3 = b[i + 1]!;
    if (!(c3.c > c2.h)) continue;
    const follow = maxHigh(b, i + 1, i + 8).v - c2.c;
    if (follow < ar * 2.5) continue;
    const score = follow / ar + wickShare * 2 - Math.abs(sweep / ar - 0.4);
    if (!cleanWindow(b, Math.max(0, i - 18), i + 9, raw.interval)) continue;
    out.push({
      id: "real-candle-2",
      score,
      build: () => {
        const start = Math.max(0, i - 18);
        const w = b.slice(start, i + 10);
        const k = i - start;
        const hi = maxHigh(b, i + 1, i + 8);
        return spec(raw, w, "real-candle-2", "A Candle 2 closure on a real chart", "", [
          {
            title: "Candle 1",
            caption: `${dateOf(c1)}, the ${hhmm(c1)} bar. Price has been falling for several bars and this one closes at ${px(c1.c)} with its low at ${px(c1.l)}. That low is Candle 1's low, and the sell stops sit beneath it.`,
            annos: [
              { kind: "marker", bar: k - 1, price: c1.l, label: "C1", tone: "neutral", place: "below" },
              { kind: "hline", price: c1.l, from: k - 6, to: k + 1, label: `C1 low ${px(c1.l)}`, tone: "neutral", dashed: true, labelAt: "start" },
            ],
          },
          {
            title: "The sweep and the close",
            caption: `The ${hhmm(c2)} bar trades below it to ${px(c2.l)}, ${px(sweep)} points under the low, and closes at ${px(c2.c)}: back above Candle 1's low and above its own open. That is the Candle 2 closure, on a real ${raw.interval === "1h" ? "hourly" : "5-minute"} bar.`,
            annos: [
              { kind: "marker", bar: k, price: c2.l, label: `swept to ${px(c2.l)}`, tone: "danger", place: "below" },
              { kind: "marker", bar: k, price: c2.h, label: `closes ${px(c2.c)}, back inside`, tone: "mastery" },
            ],
          },
          {
            title: "Confirmation and expansion",
            caption: `The next bar closes at ${px(c3.c)}, above Candle 2's high of ${px(c2.h)}, and within ${hi.i - i} bars price reaches ${px(hi.v)}: ${px(hi.v - c2.c)} points above the closure. The pattern from Lesson 5, exactly as it printed.`,
            annos: [
              { kind: "marker", bar: k + 1, price: c3.h, label: "Candle 3 confirms", tone: "mastery" },
              { kind: "arrow", from: [k + 2, c3.c], to: [hi.i - start, hi.v], label: "expansion", tone: "mastery" },
            ],
          },
        ], raw.interval !== "1d", raw.interval === "1h" ? 6 : 6);
      },
    });
  }
  return out;
}

/** Lesson 6. Candle 2 closes below Candle 1's low; Candle 3 closes back above it. */
function findCandle3(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (let i = 8; i < b.length - 12; i++) {
    const c1 = b[i - 2]!;
    const c2 = b[i - 1]!;
    const c3 = b[i]!;
    if (!(c2.c < c1.l && c3.c > c1.l && c3.c > c3.o)) continue;
    const ar = avgRange(b, i);
    if (b[i - 7]!.c - c1.c < ar * 1.5) continue;
    const follow = maxHigh(b, i + 1, i + 8).v - c3.c;
    if (follow < ar * 2.5) continue;
    if (!(b[i + 1]!.c > c3.h)) continue;
    if (!cleanWindow(b, Math.max(0, i - 18), i + 9, raw.interval)) continue;
    out.push({
      id: "real-candle-3",
      score: follow / ar,
      build: () => {
        const start = Math.max(0, i - 18);
        const w = b.slice(start, i + 10);
        const k = i - start;
        const hi = maxHigh(b, i + 1, i + 8);
        return spec(raw, w, "real-candle-3", "A Candle 3 closure on a real chart", "", [
          {
            title: "Candle 2 closes below",
            caption: `${dateOf(c1)}. Candle 1, the ${hhmm(c1)} bar, has its low at ${px(c1.l)}. The ${hhmm(c2)} bar trades below it and closes below it too, at ${px(c2.c)}. On its own that's continuation, not a Candle 2 closure.`,
            annos: [
              { kind: "hline", price: c1.l, from: k - 2, to: k + 1, label: `C1 low ${px(c1.l)}`, tone: "neutral", dashed: true, labelAt: "start" },
              { kind: "marker", bar: k - 1, price: c2.l, label: `C2 closes below, at ${px(c2.c)}`, tone: "danger", place: "below" },
            ],
          },
          {
            title: "Candle 3 closes back above",
            caption: `The ${hhmm(c3)} bar opens at ${px(c3.o)} and closes at ${px(c3.c)}, back above Candle 1's low. The reclaim took one bar longer: the Candle 3 closure from Lesson 6.`,
            annos: [{ kind: "marker", bar: k, price: c3.h, label: `C3 closes ${px(c3.c)}`, tone: "mastery" }],
          },
          {
            title: "What followed",
            caption: `The sellers from the ${hhmm(c2)} close are trapped below a bar that closed against them. Price reaches ${px(hi.v)} within ${hi.i - i} bars, ${px(hi.v - c3.c)} points above the closure.`,
            annos: [
              { kind: "zone", from: k - 1, to: k + 1, low: c2.l, high: c1.l, label: "trapped sellers", tone: "danger", labelAt: "bottom-end" },
              { kind: "arrow", from: [k + 1, c3.c], to: [hi.i - start, hi.v], label: "expansion", tone: "mastery" },
            ],
          },
        ], true, 6);
      },
    });
  }
  return out;
}

/** Lesson 7. A run of down-close bars; the level is the first bar's open; a close above it is the CISD. */
function findCisd(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (let s = 10; s < b.length - 30; s++) {
    if (!(b[s]!.c < b[s]!.o)) continue;
    let e = s;
    while (e + 1 < b.length && b[e + 1]!.c < b[e + 1]!.o) e++;
    const runLen = e - s + 1;
    if (runLen < 3 || runLen > 8) continue;
    const level = b[s]!.o;
    const ar = avgRange(b, s);
    if (b[s]!.o - b[e]!.c < ar * 1.5) continue;
    // The first close back above the run's open, within 10 bars of the run ending.
    let k = -1;
    for (let j = e + 1; j <= e + 10 && j < b.length; j++) {
      if (b[j]!.c > level) {
        k = j;
        break;
      }
      if (b[j]!.l < b[e]!.l - ar * 1.5) break; // kept falling, not this one
    }
    if (k < 0) continue;
    const low = minLow(b, s, k);
    const follow = maxHigh(b, k + 1, k + 12).v - b[k]!.c;
    if (follow < ar * 2) continue;
    if (minLow(b, k + 1, k + 12).v < low.v) continue;
    if (!cleanWindow(b, Math.max(0, s - 12), k + 13, raw.interval)) continue;
    out.push({
      id: "real-cisd",
      score: follow / ar + runLen * 0.2 + rthBonus(b[k]!),
      build: () => {
        const start = Math.max(0, s - 12);
        const w = b.slice(start, k + 14);
        const ks = s - start;
        const ke = e - start;
        const kk = k - start;
        const hi = maxHigh(b, k + 1, k + 12);
        return spec(raw, w, "real-cisd", "CISD on a real chart", "", [
          {
            title: "The down-close run",
            caption: `${dateOf(b[s]!)}. From ${hhmm(b[s]!)} to ${hhmm(b[e]!)}, ${runLen} consecutive bars close lower. Delivery is down, and every bounce inside that run was a pullback.`,
            annos: [{ kind: "band", from: ks, to: ke, label: `${runLen} down-close bars`, tone: "danger" }],
          },
          {
            title: "The level",
            caption: `The first bar of the run opened at ${px(level)}. That opening price is the CISD level: nothing has changed until a bar closes back above it.`,
            annos: [{ kind: "hline", price: level, from: ks, to: kk + 2, label: `open of the run ${px(level)}`, tone: "warning", dashed: true, labelAt: "start" }],
          },
          {
            title: "The close through it",
            caption: `At ${hhmm(b[k]!)} a bar closes at ${px(b[k]!.c)}, above ${px(level)}. Change in the state of delivery. The low of the run, ${px(low.v)} at ${hhmm(b[low.i]!)}, is now a protected low.`,
            annos: [
              { kind: "marker", bar: kk, price: b[k]!.h, label: `CISD: closes ${px(b[k]!.c)}`, tone: "mastery" },
              { kind: "marker", bar: low.i - start, price: low.v, label: `protected low ${px(low.v)}`, tone: "mastery", place: "below" },
            ],
          },
          {
            title: "It held",
            caption: `The protected low was never traded through in the ${hi.i - k} bars that followed, and price reached ${px(hi.v)}, ${px(hi.v - b[k]!.c)} points above the CISD close. Same rule as Lesson 7, on a bar that actually printed.`,
            annos: [{ kind: "arrow", from: [kk + 1, b[k]!.c], to: [hi.i - start, hi.v], label: "new delivery", tone: "mastery" }],
          },
        ], true, 6);
      },
    });
  }
  return out;
}

/** Lesson 7a. A three-bar gap left by a displacement bar, returned to and held. */
function findFvg(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (let i = 10; i < b.length - 40; i++) {
    const a = b[i - 1]!;
    const m = b[i]!;
    const z = b[i + 1]!;
    if (!(a.h < z.l && m.c > m.o)) continue;
    const gap = z.l - a.h;
    const ar = avgRange(b, i);
    if (gap < ar * 0.3) continue;
    if (m.c - m.o < ar * 1.3) continue;
    // Return into the gap within 40 bars, holding above its low, then a new high.
    let ret = -1;
    for (let j = i + 2; j <= i + 40 && j < b.length; j++) {
      if (b[j]!.l < a.h) {
        ret = -1;
        break;
      }
      if (b[j]!.l <= z.l && b[j]!.c >= a.h) {
        ret = j;
        break;
      }
    }
    if (ret < 0) continue;
    const after = maxHigh(b, ret + 1, ret + 16);
    if (after.v < z.h) continue;
    if (!cleanWindow(b, Math.max(0, i - 10), after.i + 5, raw.interval)) continue;
    out.push({
      id: "real-fvg",
      score: (m.c - m.o) / ar + gap / ar + (after.v - b[ret]!.c) / ar + rthBonus(b[i]!),
      build: () => {
        const start = Math.max(0, i - 10);
        const w = b.slice(start, Math.min(b.length, after.i + 6));
        const k = i - start;
        const kr = ret - start;
        const ce = (a.h + z.l) / 2;
        return spec(raw, w, "real-fvg", "A fair value gap on a real chart", "", [
          {
            title: "Three bars",
            caption: `${dateOf(m)}. The ${hhmm(m)} bar opens at ${px(m.o)} and closes at ${px(m.c)}, a body of ${px(m.c - m.o)} points. The bar before it topped at ${px(a.h)}; the bar after it bottomed at ${px(z.l)}. Nothing traded between those two prices on the way up.`,
            annos: [
              { kind: "marker", bar: k - 1, price: a.h, label: `${hhmm(a)} high ${px(a.h)}`, tone: "neutral" },
              { kind: "marker", bar: k + 1, price: z.l, label: `${hhmm(z)} low ${px(z.l)}`, tone: "neutral", place: "below" },
            ],
          },
          {
            title: "The gap",
            caption: `${px(a.h)} to ${px(z.l)}: a bullish fair value gap of ${px(gap)} points, left by one-sided buying. The midpoint, ${px(ce)}, is its consequent encroachment.`,
            annos: [
              { kind: "zone", from: k - 1, to: w.length - 1, low: a.h, high: z.l, label: `bullish FVG ${px(a.h)} to ${px(z.l)}`, tone: "mastery", labelAt: "top-end" },
              { kind: "hline", price: ce, from: k - 1, to: w.length - 1, label: "CE", tone: "mastery", dashed: true },
            ],
          },
          {
            title: "The return",
            caption: `${ret - i} bars later, at ${hhmm(b[ret]!)}, price trades down into the gap to ${px(b[ret]!.l)} and closes at ${px(b[ret]!.c)}, inside or above it. The gap held.`,
            annos: [{ kind: "marker", bar: kr, price: b[ret]!.l, label: `into the gap, ${hhmm(b[ret]!)}`, tone: "mastery", place: "below" }],
          },
          {
            title: "Support",
            caption: `From that return price reaches ${px(after.v)} at ${hhmm(b[after.i]!)}, above the high of the bar that finished the gap. The imbalance was rebalanced and the move resumed, which is what Lesson 7a says a gap that holds should do.`,
            annos: [{ kind: "arrow", from: [kr + 1, b[ret]!.c], to: [after.i - start, after.v], label: "support held", tone: "mastery" }],
          },
        ], true, 6);
      },
    });
  }
  return out;
}

/** Lesson 11. The last down-close bar before a displacement leg, later returned to and held. */
function findOrderBlock(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (let i = 10; i < b.length - 50; i++) {
    const ob = b[i]!;
    if (!(ob.c < ob.o)) continue;
    // Displacement: the next three bars all close up and travel far.
    const u1 = b[i + 1]!;
    const u2 = b[i + 2]!;
    const u3 = b[i + 3]!;
    if (!(u1.c > u1.o && u2.c > u2.o && u3.c > u3.o)) continue;
    const ar = avgRange(b, i);
    const leg = u3.c - ob.c;
    if (leg < ar * 3.5) continue;
    // A return into the block that holds, within 40 bars, then a new high.
    let ret = -1;
    let peak = u3.h;
    for (let j = i + 4; j <= i + 40 && j < b.length; j++) {
      peak = Math.max(peak, b[j]!.h);
      if (b[j]!.l < ob.l) {
        ret = -1;
        break;
      }
      if (b[j]!.l <= ob.h && b[j]!.c >= ob.l) {
        ret = j;
        break;
      }
    }
    if (ret < 0) continue;
    const after = maxHigh(b, ret + 1, ret + 16);
    if (after.v < peak) continue;
    if (!cleanWindow(b, Math.max(0, i - 8), after.i + 5, raw.interval)) continue;
    out.push({
      id: "real-order-block",
      score: leg / ar + (after.v - b[ret]!.c) / ar + rthBonus(b[i]!),
      build: () => {
        const start = Math.max(0, i - 8);
        const w = b.slice(start, Math.min(b.length, after.i + 6));
        const k = i - start;
        const kr = ret - start;
        return spec(raw, w, "real-order-block", "An order block on a real chart", "", [
          {
            title: "The last down-close bar",
            caption: `${dateOf(ob)}. The ${hhmm(ob)} bar closes down, ${px(ob.o)} to ${px(ob.c)}. It's the last bar to close lower before the move that follows, which makes it the candidate order block.`,
            annos: [{ kind: "marker", bar: k, price: ob.l, label: `${hhmm(ob)}: last down-close`, tone: "neutral", place: "below" }],
          },
          {
            title: "Displacement",
            caption: `The next three bars all close up and carry price from ${px(ob.c)} to ${px(u3.c)}: ${px(leg)} points, about ${(leg / ar).toFixed(1)} times the recent average bar range. That's the displacement that makes the down-close bar before it an order block.`,
            annos: [
              { kind: "band", from: k + 1, to: k + 3, label: "displacement", tone: "mastery" },
              { kind: "zone", from: k, to: w.length - 1, low: ob.l, high: ob.h, label: `bullish order block ${px(ob.l)} to ${px(ob.h)}`, tone: "accent", labelAt: "bottom-end" },
            ],
          },
          {
            title: "The return",
            caption: `At ${hhmm(b[ret]!)}, ${ret - i} bars later, price trades back into the block, to ${px(b[ret]!.l)}, and closes at ${px(b[ret]!.c)} without breaking its low. The mean threshold, the block's midpoint at ${px((ob.l + ob.h) / 2)}, is the line Lesson 11 watches.`,
            annos: [
              { kind: "hline", price: (ob.l + ob.h) / 2, from: k, to: w.length - 1, label: "mean threshold", tone: "accent", dashed: true, labelAt: "start" },
              { kind: "marker", bar: kr, price: b[ret]!.l, label: `return, ${hhmm(b[ret]!)}`, tone: "mastery", place: "below" },
            ],
          },
          {
            title: "It held",
            caption: `From the block price reaches ${px(after.v)} at ${hhmm(b[after.i]!)}, a new high above the displacement's peak. The block did what Lesson 11 says it should: the orders that started the move were still there.`,
            annos: [{ kind: "arrow", from: [kr + 1, b[ret]!.c], to: [after.i - start, after.v], label: "new high", tone: "mastery" }],
          },
        ], true, 6);
      },
    });
  }
  return out;
}

/** Lesson 3. Equal highs, then a bar that trades through them and closes back below, then a decline. */
function findEqualHighs(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  const isSwingHigh = (i: number) => {
    for (let j = i - 3; j <= i + 3; j++) if (j !== i && j >= 0 && j < b.length && b[j]!.h >= b[i]!.h) return false;
    return true;
  };
  for (let i = 10; i < b.length - 40; i++) {
    if (!isSwingHigh(i)) continue;
    for (let j = i + 5; j <= i + 40 && j < b.length - 20; j++) {
      if (!isSwingHigh(j)) continue;
      const tol = b[i]!.h * 0.0006;
      if (Math.abs(b[i]!.h - b[j]!.h) > tol) continue;
      const top = Math.max(b[i]!.h, b[j]!.h);
      // The run: a bar within 30 bars trading above both and closing below.
      let k = -1;
      for (let m = j + 3; m <= j + 30 && m < b.length; m++) {
        if (b[m]!.c > top + tol) break;
        if (b[m]!.h > top + tol * 0.5 && b[m]!.c < top) {
          k = m;
          break;
        }
      }
      if (k < 0) continue;
      const ar = avgRange(b, k);
      const drop = b[k]!.c - minLow(b, k + 1, k + 12).v;
      if (drop < ar * 2.5) continue;
      if (!cleanWindow(b, Math.max(0, i - 8), minLow(b, k + 1, k + 12).i + 4, raw.interval)) continue;
      out.push({
        id: "real-liquidity",
        score: drop / ar - Math.abs(b[i]!.h - b[j]!.h) / tol,
        build: () => {
          const start = Math.max(0, i - 8);
          const lo = minLow(b, k + 1, k + 12);
          const w = b.slice(start, Math.min(b.length, lo.i + 5));
          return spec(raw, w, "real-liquidity", "Equal highs run on a real chart", "", [
            {
              title: "Equal highs",
              caption: `${dateOf(b[i]!)}. Two swing highs, ${px(b[i]!.h)} at ${hhmm(b[i]!)} and ${px(b[j]!.h)} at ${hhmm(b[j]!)}, within ${px(Math.abs(b[i]!.h - b[j]!.h))} points of each other. Above them sit the stops of everyone who sold those highs and the buy orders of everyone waiting for a breakout.`,
              annos: [
                { kind: "hline", price: top, from: i - start, to: k - start, label: `equal highs ${px(top)}`, tone: "danger", dashed: true, labelAt: "start" },
                { kind: "marker", bar: i - start, price: b[i]!.h, label: "1st", tone: "neutral", place: "below" },
                { kind: "marker", bar: j - start, price: b[j]!.h, label: "2nd", tone: "neutral", place: "below" },
              ],
            },
            {
              title: "The run",
              caption: `At ${hhmm(b[k]!)} the ${hhmm(b[k]!)} bar trades up to ${px(b[k]!.h)}, through both highs, and closes at ${px(b[k]!.c)}, back below them. The stops were taken and nothing was left above to keep price there.`,
              annos: [{ kind: "marker", bar: k - start, price: b[k]!.h, label: `run to ${px(b[k]!.h)}, closes below`, tone: "danger" }],
            },
            {
              title: "What followed",
              caption: `From the run price falls to ${px(lo.v)} at ${hhmm(b[lo.i]!)}: ${px(b[k]!.c - lo.v)} points down in ${lo.i - k} bars. The level wasn't resistance; it was a destination, and once reached it was done.`,
              annos: [{ kind: "arrow", from: [k - start + 1, b[k]!.c], to: [lo.i - start, lo.v], label: "after the liquidity was taken", tone: "danger" }],
            },
          ], true, 6);
        },
      });
    }
  }
  return out;
}

/** Lesson 26. Two higher highs and higher lows, a BOS, then a displaced close below the last higher low. */
function findBosChoch(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  const swingHigh = (i: number) => [1, 2].every((d) => i - d >= 0 && i + d < b.length && b[i]!.h > b[i - d]!.h && b[i]!.h > b[i + d]!.h);
  const swingLow = (i: number) => [1, 2].every((d) => i - d >= 0 && i + d < b.length && b[i]!.l < b[i - d]!.l && b[i]!.l < b[i + d]!.l);
  for (let i = 10; i < b.length - 40; i++) {
    if (!swingLow(i)) continue;
    // L1 (i) < H1 < L2 < H2 (BOS through H1) < L3? then CHoCH below L2.
    const h1 = [...Array(10).keys()].map((d) => i + 1 + d).find((j) => j < b.length && swingHigh(j));
    if (!h1) continue;
    const l2 = [...Array(10).keys()].map((d) => h1 + 1 + d).find((j) => j < b.length && swingLow(j) && b[j]!.l > b[i]!.l);
    if (!l2) continue;
    const bos = [...Array(10).keys()].map((d) => l2 + 1 + d).find((j) => j < b.length && b[j]!.c > b[h1]!.h);
    if (!bos) continue;
    const h2 = [...Array(8).keys()].map((d) => bos + d).find((j) => j < b.length && swingHigh(j) && b[j]!.h > b[h1]!.h);
    if (!h2) continue;
    const brk = [...Array(14).keys()].map((d) => h2 + 1 + d).find((j) => j < b.length && b[j]!.c < b[l2]!.l);
    if (!brk) continue;
    const ar = avgRange(b, brk);
    const body = b[brk]!.o - b[brk]!.c;
    if (body < ar * 1.2) continue;
    if (minLow(b, h2, brk - 1).v < b[l2]!.l) continue;
    const drop = b[brk]!.c - minLow(b, brk + 1, brk + 10).v;
    if (drop < ar * 1.5) continue;
    if (!cleanWindow(b, Math.max(0, i - 6), minLow(b, brk + 1, brk + 10).i + 3, raw.interval)) continue;
    out.push({
      id: "real-bos-choch",
      score: body / ar + drop / ar,
      build: () => {
        const start = Math.max(0, i - 6);
        const lo = minLow(b, brk + 1, brk + 10);
        const w = b.slice(start, Math.min(b.length, lo.i + 4));
        const r = (j: number) => j - start;
        return spec(raw, w, "real-bos-choch", "BOS and CHoCH on a real chart", "", [
          {
            title: "Swing points",
            caption: `${dateOf(b[i]!)} to ${dateOf(b[brk]!)}. A low at ${px(b[i]!.l)} (${hhmm(b[i]!)}), a high at ${px(b[h1]!.h)}, a higher low at ${px(b[l2]!.l)}, a higher high at ${px(b[h2]!.h)}. The uptrend's structure, marked from the bars.`,
            annos: [
              { kind: "path", points: [[r(i), b[i]!.l], [r(h1), b[h1]!.h], [r(l2), b[l2]!.l], [r(h2), b[h2]!.h]], tone: "neutral", dashed: true },
              { kind: "marker", bar: r(i), price: b[i]!.l, label: "L1", tone: "neutral", place: "below" },
              { kind: "marker", bar: r(h1), price: b[h1]!.h, label: "H1", tone: "neutral" },
              { kind: "marker", bar: r(l2), price: b[l2]!.l, label: "L2 (HL)", tone: "neutral", place: "below" },
              { kind: "marker", bar: r(h2), price: b[h2]!.h, label: "H2 (HH)", tone: "neutral" },
            ],
          },
          {
            title: "Break of Structure",
            caption: `At ${hhmm(b[bos]!)} a bar closes at ${px(b[bos]!.c)}, above H1 (${px(b[h1]!.h)}). Break of Structure: the trend confirming itself.`,
            annos: [
              { kind: "hline", price: b[h1]!.h, from: r(h1), to: r(bos), tone: "mastery", dashed: true },
              { kind: "marker", bar: r(bos), price: b[bos]!.h, label: "BOS", tone: "mastery" },
            ],
          },
          {
            title: "Change of Character",
            caption: `At ${hhmm(b[brk]!)} a bar opens at ${px(b[brk]!.o)} and closes at ${px(b[brk]!.c)}, below the last higher low at ${px(b[l2]!.l)}. A body of ${px(body)} points, ${(body / ar).toFixed(1)} times the recent average: displacement. That's a CHoCH delivered as a Market Structure Shift.`,
            annos: [
              { kind: "hline", price: b[l2]!.l, from: r(l2), to: r(brk), tone: "danger", dashed: true },
              { kind: "marker", bar: r(brk), price: b[brk]!.l, label: `CHoCH with displacement`, tone: "danger", place: "below" },
            ],
          },
          {
            title: "What followed",
            caption: `Price fell to ${px(lo.v)} within ${lo.i - brk} bars. The break through external structure with displacement was the reversal; the earlier BOS was the continuation. Lesson 26's two breaks, on one real sequence.`,
            annos: [{ kind: "arrow", from: [r(brk) + 1, b[brk]!.c], to: [r(lo.i), lo.v], label: "continuation down", tone: "danger" }],
          },
        ], true, 8);
      },
    });
  }
  return out;
}

/** Lesson 33. A weekend gap between Friday's close and Sunday's open, returned to. */
function findNwog(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (let i = 1; i < b.length - 40; i++) {
    const prev = b[i - 1]!;
    const cur = b[i]!;
    if (cur.t - prev.t < 40 * 3600) continue; // a weekend
    const gap = cur.o - prev.c;
    const ar = avgRange(b, i - 1, 30);
    if (Math.abs(gap) < ar * 0.8) continue;
    const lo = Math.min(prev.c, cur.o);
    const hi = Math.max(prev.c, cur.o);
    const ce = (lo + hi) / 2;
    // Price leaves the gap area and then returns to the midpoint within 40 bars.
    let ret = -1;
    let left = false;
    for (let j = i; j <= i + 40 && j < b.length; j++) {
      if (gap > 0 ? b[j]!.l > hi + ar : b[j]!.h < lo - ar) left = true;
      if (left && b[j]!.l <= ce && b[j]!.h >= ce) {
        ret = j;
        break;
      }
    }
    if (ret < 0) continue;
    // A reaction after the return: moves back in the gap's direction.
    const react = gap > 0 ? maxHigh(b, ret + 1, ret + 10).v - b[ret]!.c : b[ret]!.c - minLow(b, ret + 1, ret + 10).v;
    if (react < ar * 1.5) continue;
    out.push({
      id: "real-nwog",
      score: Math.abs(gap) / ar + react / ar,
      build: () => {
        const start = Math.max(0, i - 8);
        const end = Math.min(b.length, ret + 12);
        const w = b.slice(start, end);
        const r = (j: number) => j - start;
        return spec(raw, w, "real-nwog", "A New Week Opening Gap on a real chart", "", [
          {
            title: "Friday close, Sunday open",
            caption: `The week ended ${dateOf(prev)} with the ${hhmm(prev)} bar closing at ${px(prev.c)}. Trading reopened ${dateOf(cur)} at ${hhmm(cur)} with the first print at ${px(cur.o)}: a gap of ${px(Math.abs(gap))} points ${gap > 0 ? "up" : "down"}.`,
            annos: [
              { kind: "vline", bar: r(i), label: `${DAYS[et(cur.t).dow]} ${hhmm(cur)} open`, tone: "accent" },
              { kind: "marker", bar: r(i - 1), price: prev.c, label: `close ${px(prev.c)}`, tone: "neutral", place: gap > 0 ? "below" : "above" },
              { kind: "marker", bar: r(i), price: cur.o, label: `open ${px(cur.o)}`, tone: "neutral", place: gap > 0 ? "above" : "below" },
            ],
          },
          {
            title: "The gap and its midpoint",
            caption: `The New Week Opening Gap is ${px(lo)} to ${px(hi)}, carried forward. Its consequent encroachment is the midpoint, ${px(ce)}.`,
            annos: [
              { kind: "zone", from: r(i - 1), to: w.length - 1, low: lo, high: hi, label: "NWOG", tone: "accent", labelAt: gap > 0 ? "bottom-end" : "top-end" },
              { kind: "hline", price: ce, from: r(i - 1), to: w.length - 1, label: "CE", tone: "accent", dashed: true },
            ],
          },
          {
            title: "The return",
            caption: `${ret - i} bars later, at ${hhmm(b[ret]!)} on ${dateOf(b[ret]!)}, price trades back to the midpoint and reacts: ${px(react)} points ${gap > 0 ? "up" : "down"} from it over the next bars. The gap was the draw, then the level.`,
            annos: [{ kind: "marker", bar: r(ret), price: gap > 0 ? b[ret]!.l : b[ret]!.h, label: `reaction at CE, ${hhmm(b[ret]!)}`, tone: "mastery", place: gap > 0 ? "below" : "above" }],
          },
        ], true, 8);
      },
    });
  }
  return out;
}

/** Group 5-minute bars by session day (18:00 ET start). */
function byDay(b: Bar[]): Map<string, number[]> {
  const days = new Map<string, number[]>();
  b.forEach((bar, i) => {
    const key = sessionKey(bar);
    if (!days.has(key)) days.set(key, []);
    days.get(key)!.push(i);
  });
  return days;
}
const inWindow = (bar: Bar, fromH: number, fromM: number, toH: number, toM: number) => {
  const e = et(bar.t);
  const m = e.hh * 60 + e.mm;
  return m >= fromH * 60 + fromM && m < toH * 60 + toM;
};

/** Lesson 35. The Asian range, a London-open sweep of its low, and the reversal. */
function findJudas(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (const [, idx] of byDay(b)) {
    const asia = idx.filter((i) => {
      const e = et(b[i]!.t);
      return e.hh >= 19 || e.hh < 0;
    });
    const asia2 = idx.filter((i) => et(b[i]!.t).hh >= 0 && et(b[i]!.t).hh < 2 || et(b[i]!.t).hh >= 19);
    const asiaIdx = asia2.length ? asia2 : asia;
    if (asiaIdx.length < 40) continue;
    const aLow = Math.min(...asiaIdx.map((i) => b[i]!.l));
    const aHigh = Math.max(...asiaIdx.map((i) => b[i]!.h));
    const london = idx.filter((i) => inWindow(b[i]!, 2, 0, 4, 0));
    if (!london.length) continue;
    const ar = avgRange(b, london[0]!, 60);
    const sweep = london.find((i) => b[i]!.l < aLow - avgRange(b, london[0]!, 60) * 0.25);
    if (!sweep) continue;
    // Close back above the Asian low within 6 bars, then displacement up.
    const back = [...Array(6).keys()].map((d) => sweep + d).find((j) => j < b.length && b[j]!.c > aLow);
    if (!back) continue;
    const later = idx.filter((i) => i > back && inWindow(b[i]!, 2, 0, 6, 0));
    if (!later.length) continue;
    const hi = maxHigh(b, back + 1, later[later.length - 1]!);
    const move = hi.v - aLow;
    if (move < (aHigh - aLow) * 0.8 || move < ar * 4) continue;
    if (minLow(b, back + 1, hi.i).v < b[sweep]!.l) continue;
    if (!cleanWindow(b, asiaIdx[Math.max(0, asiaIdx.length - 36)]!, hi.i + 7, raw.interval)) continue;
    out.push({
      id: "real-judas",
      score: move / ar - (b[sweep]!.l < aLow - ar * 1.5 ? 2 : 0),
      build: () => {
        const start = asiaIdx[Math.max(0, asiaIdx.length - 36)]!;
        const end = Math.min(b.length, hi.i + 8);
        const w = b.slice(start, end);
        const r = (j: number) => j - start;
        const londonOpen = idx.find((i) => inWindow(b[i]!, 2, 0, 2, 5)) ?? london[0]!;
        return spec(raw, w, "real-judas", "A Judas swing on a real chart", "5-minute bars, Asia into London", [
          {
            title: "The Asian range",
            caption: `${dateOf(b[londonOpen]!)}. Overnight, price ranged between ${px(aLow)} and ${px(aHigh)}. That range's low has sell stops under it.`,
            annos: [
              { kind: "zone", from: 0, to: r(londonOpen), low: aLow, high: aHigh, label: "Asian range", tone: "neutral" },
              { kind: "hline", price: aLow, from: 0, to: r(back) + 2, label: `Asia low ${px(aLow)}`, tone: "neutral", dashed: true, labelAt: "start" },
            ],
          },
          {
            title: "London opens",
            caption: `London comes in at 02:00 ET. Watch what the first move does to the Asian low.`,
            annos: [{ kind: "vline", bar: r(londonOpen), label: "02:00 London", tone: "accent" }],
          },
          {
            title: "The Judas swing",
            caption: `At ${hhmm(b[sweep]!)} price trades below the Asian low to ${px(b[sweep]!.l)}. By ${hhmm(b[back]!)} a bar closes back above it at ${px(b[back]!.c)}. The stops were taken and the breakout sellers were in; the move was a swing to be reversed.`,
            annos: [
              { kind: "marker", bar: r(sweep), price: b[sweep]!.l, label: `sweep to ${px(b[sweep]!.l)}`, tone: "danger", place: "below" },
              { kind: "marker", bar: r(back), price: b[back]!.h, label: "closes back inside", tone: "mastery" },
            ],
          },
          {
            title: "The real direction",
            caption: `From there price ran to ${px(hi.v)} by ${hhmm(b[hi.i]!)}: ${px(hi.v - aLow)} points above the Asian low, without ever trading back below the sweep. The London session's true direction was up, and the sweep set its low.`,
            annos: [{ kind: "arrow", from: [r(back) + 1, b[back]!.c], to: [r(hi.i), hi.v], label: "the session's true direction", tone: "mastery" }],
          },
        ], true, 12);
      },
    });
  }
  return out;
}

/** Lesson 38. In the 10:00 to 11:00 window: a sweep of the 09:30 to 10:00 low, displacement leaving a gap, the AM high reached. */
function findSilverBullet(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (const [, idx] of byDay(b)) {
    const open = idx.filter((i) => inWindow(b[i]!, 9, 30, 10, 0));
    const win = idx.filter((i) => inWindow(b[i]!, 10, 0, 11, 0));
    if (open.length < 5 || win.length < 10) continue;
    const oLow = Math.min(...open.map((i) => b[i]!.l));
    const oHigh = Math.max(...open.map((i) => b[i]!.h));
    const ar = avgRange(b, win[0]!, 60);
    const sweep = win.find((i) => b[i]!.l < oLow);
    if (!sweep) continue;
    // Displacement bar leaving a bullish gap inside the window, after the sweep.
    let disp = -1;
    for (let j = sweep + 1; j < win[win.length - 1]! - 1; j++) {
      const a = b[j - 1]!;
      const m = b[j]!;
      const z = b[j + 1]!;
      if (m.c > m.o && m.c - m.o > ar * 1.2 && a.h < z.l) {
        disp = j;
        break;
      }
    }
    if (disp < 0) continue;
    const gapLo = b[disp - 1]!.h;
    const gapHi = b[disp + 1]!.l;
    // The AM high taken by 11:15.
    const late = idx.filter((i) => i > disp && inWindow(b[i]!, 10, 0, 11, 15));
    const hit = late.find((i) => b[i]!.h >= oHigh);
    if (!hit) continue;
    if (minLow(b, disp + 2, hit).v < b[sweep]!.l) continue;
    if (!cleanWindow(b, open[0]!, hit + 5, raw.interval)) continue;
    out.push({
      id: "real-silver-bullet",
      score: (oHigh - b[sweep]!.l) / ar,
      build: () => {
        const start = open[0]!;
        const end = Math.min(b.length, hit + 6);
        const w = b.slice(start, end);
        const r = (j: number) => j - start;
        const winStart = win[0]!;
        const winEnd = win[win.length - 1]!;
        return spec(raw, w, "real-silver-bullet", "A Silver Bullet on a real chart", "5-minute bars, New York morning", [
          {
            title: "The window and the levels",
            caption: `${dateOf(b[winStart]!)}. From 09:30 to 10:00 price ranged between ${px(oLow)} and ${px(oHigh)}. The 10:00 to 11:00 window opens with those two levels marked: sellside under ${px(oLow)}, buyside above ${px(oHigh)}.`,
            annos: [
              { kind: "band", from: r(winStart), to: r(winEnd), label: "Silver Bullet 10:00 to 11:00", tone: "accent" },
              { kind: "hline", price: oHigh, from: 0, to: r(hit), label: `buyside ${px(oHigh)}`, tone: "neutral", dashed: true, labelAt: "start" },
              { kind: "hline", price: oLow, from: 0, to: r(sweep) + 1, label: `sellside ${px(oLow)}`, tone: "neutral", dashed: true, labelAt: "start" },
            ],
          },
          {
            title: "The sweep",
            caption: `At ${hhmm(b[sweep]!)} price trades below the opening range low to ${px(b[sweep]!.l)}. The sell stops are taken inside the window: the first requirement.`,
            annos: [{ kind: "marker", bar: r(sweep), price: b[sweep]!.l, label: `sweep to ${px(b[sweep]!.l)}`, tone: "danger", place: "below" }],
          },
          {
            title: "Displacement and the gap",
            caption: `At ${hhmm(b[disp]!)} a bar closes ${px(b[disp]!.c - b[disp]!.o)} points up and leaves a gap between ${px(gapLo)} and ${px(gapHi)}. A fair value gap formed inside the window after a sweep: the Silver Bullet.`,
            annos: [
              { kind: "marker", bar: r(disp), price: b[disp]!.h, label: "displacement", tone: "mastery" },
              { kind: "zone", from: r(disp) - 1, to: r(hit), low: gapLo, high: gapHi, label: "FVG", tone: "mastery", labelAt: "bottom-end" },
            ],
          },
          {
            title: "The target",
            caption: `The opening-range high at ${px(oHigh)} is reached at ${hhmm(b[hit]!)}, ${hit - disp} bars after the displacement${inWindow(b[hit]!, 10, 0, 11, 0) ? " and still inside the window" : ", just after the window closed"}. Stop under the sweep low; target the buyside; both were on the chart before the entry.`,
            annos: [
              { kind: "hline", price: b[sweep]!.l - ar * 0.2, from: r(disp), to: r(hit), label: "stop", tone: "danger", dashed: true },
              { kind: "marker", bar: r(hit), price: b[hit]!.h, label: `buyside reached, ${hhmm(b[hit]!)}`, tone: "mastery" },
            ],
          },
        ], true, 6);
      },
    });
  }
  return out;
}

/** Lesson 12. A day that runs the previous day's low before the open and reaches the previous day's high later. Drawn on 15-minute bars. */
function findPdhPdl(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  const days = [...byDay(b).entries()];
  for (let d = 1; d < days.length; d++) {
    const [, prev] = days[d - 1]!;
    const [, cur] = days[d]!;
    const minBars = raw.interval === "1h" ? 18 : 150;
    if (prev.length < minBars || cur.length < minBars) continue;
    const pdh = Math.max(...prev.map((i) => b[i]!.h));
    const pdl = Math.min(...prev.map((i) => b[i]!.l));
    const eq = (pdh + pdl) / 2;
    const morning = cur.filter((i) => inWindow(b[i]!, 0, 0, 11, 30));
    const sweep = morning.find((i) => b[i]!.l < pdl);
    if (!sweep) continue;
    const back = [...Array(12).keys()].map((k) => sweep + k).find((j) => j < b.length && b[j]!.c > pdl);
    if (!back) continue;
    const after = cur.filter((i) => i > back && inWindow(b[i]!, 0, 0, 16, 0));
    const hit = after.find((i) => b[i]!.h >= pdh);
    if (!hit) continue;
    if (minLow(b, back, hit).v < b[sweep]!.l - avgRange(b, sweep, 60)) continue;
    out.push({
      id: "real-pdh-pdl",
      score: (pdh - pdl) / avgRange(b, cur[0]!, 60) + (10 - et(b[sweep]!.t).hh),
      build: () => {
        const dayBars = cur.filter((i) => inWindow(b[i]!, 0, 0, 16, 0));
        const five = dayBars.map((i) => b[i]!);
        const w = raw.interval === "1h" ? five : aggregate(five, 3);
        const at = (i: number) => {
          const t = b[i]!.t;
          let best = 0;
          w.forEach((bar, k) => {
            if (bar.t <= t) best = k;
          });
          return best;
        };
        const eqCross = w.findIndex((bar, k) => k > at(back) && bar.c > eq);
        return spec(raw, w, "real-pdh-pdl", "PDH, PDL and equilibrium on a real day", `${raw.interval === "1h" ? "1-hour" : "15-minute"} bars, 00:00 to 16:00 ET`, [
          {
            title: "Yesterday's three lines",
            caption: `${dateOf(b[cur[0]!]!)}. The previous session's high was ${px(pdh)}, its low ${px(pdl)}, and the midpoint, equilibrium, ${px(eq)}. Marked before the day opened.`,
            annos: [
              { kind: "hline", price: pdh, label: `PDH ${px(pdh)}`, tone: "danger", dashed: true, labelAt: "start" },
              { kind: "hline", price: pdl, label: `PDL ${px(pdl)}`, tone: "mastery", dashed: true, labelAt: "start" },
              { kind: "hline", price: eq, label: `EQ ${px(eq)}`, tone: "accent", dashed: true, labelAt: "start" },
            ],
          },
          {
            title: "The run on the PDL",
            caption: `At ${hhmm(b[sweep]!)} price traded through the previous day's low to ${px(b[sweep]!.l)} and by ${hhmm(b[back]!)} had closed back above it. The stops under yesterday's low were the first draw of the day.`,
            annos: [{ kind: "marker", bar: at(sweep), price: b[sweep]!.l, label: `PDL swept, ${hhmm(b[sweep]!)}`, tone: "danger", place: "below" }],
          },
          {
            title: "Discount to premium",
            caption: eqCross >= 0 ? `Price crossed equilibrium at ${hhmm(w[eqCross]!)} and was in premium from there: the half of yesterday's range where you look to sell, not to buy.` : `Price climbed back through the range towards the previous day's high.`,
            annos: eqCross >= 0 ? [{ kind: "marker", bar: eqCross, price: w[eqCross]!.c, label: `crosses EQ, ${hhmm(w[eqCross]!)}`, tone: "accent" }] : [],
          },
          {
            title: "The PDH",
            caption: `The previous day's high at ${px(pdh)} was reached at ${hhmm(b[hit]!)}. Low run in the morning, high reached in the afternoon: the three lines told you where the orders were, and the day went to both.`,
            annos: [{ kind: "marker", bar: at(hit), price: b[hit]!.h, label: `PDH reached, ${hhmm(b[hit]!)}`, tone: "danger" }],
          },
        ], true, raw.interval === "1h" ? 2 : 8);
      },
    });
  }
  return out;
}

/** Lesson 34. The 00:00 open, a low below it before New York, the high after, a close near the high. */
function findPowerOfThree(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (const [, idx] of byDay(b)) {
    const day = idx.filter((i) => inWindow(b[i]!, 0, 0, 16, 0));
    if (day.length < 180) continue;
    const open = b[day[0]!]!.o;
    const lo = minLow(b, day[0]!, day[day.length - 1]!);
    const hi = maxHigh(b, day[0]!, day[day.length - 1]!);
    const close = b[day[day.length - 1]!]!.c;
    const eLo = et(b[lo.i]!.t);
    const eHi = et(b[hi.i]!.t);
    if (!(lo.v < open && eLo.hh >= 2 && eLo.hh < 9)) continue;
    if (!(eHi.hh >= 9)) continue;
    const range = hi.v - lo.v;
    if ((close - lo.v) / range < 0.7) continue;
    const ar = avgRange(b, day[0]!, 60);
    if (range < ar * 8) continue;
    out.push({
      id: "real-power-of-three",
      score: (close - lo.v) / range + (open - lo.v) / range,
      build: () => {
        const w = aggregate(day.map((i) => b[i]!), 3);
        const at = (i: number) => {
          const t = b[i]!.t;
          let best = 0;
          w.forEach((bar, k) => {
            if (bar.t <= t) best = k;
          });
          return best;
        };
        const acc = w.findIndex((bar) => et(bar.t).hh >= 2);
        const dist = w.findIndex((bar) => et(bar.t).hh >= 8 && et(bar.t).mm >= 30);
        return spec(raw, w, "real-power-of-three", "Power of Three on a real day", "15-minute bars, 00:00 to 16:00 ET", [
          {
            title: "The open",
            caption: `${dateOf(b[day[0]!]!)}. The true day opens at midnight ET at ${px(open)}. Everything the day does is read against that price.`,
            annos: [
              { kind: "hline", price: open, label: `00:00 open ${px(open)}`, tone: "accent", dashed: true, labelAt: "start" },
              { kind: "band", from: 0, to: Math.max(1, acc), label: "accumulation", tone: "neutral", labelAt: "bottom" },
            ],
          },
          {
            title: "Manipulation",
            caption: `The low of the day, ${px(lo.v)}, printed at ${hhmm(b[lo.i]!)}: ${px(open - lo.v)} points below the open, before New York. Anyone who sold that break was short at the low.`,
            annos: [
              { kind: "band", from: Math.max(1, acc), to: Math.max(2, dist), label: "manipulation", tone: "danger" },
              { kind: "marker", bar: at(lo.i), price: lo.v, label: `low ${px(lo.v)} at ${hhmm(b[lo.i]!)}`, tone: "danger", place: "below" },
            ],
          },
          {
            title: "Distribution",
            caption: `The high of the day, ${px(hi.v)}, printed at ${hhmm(b[hi.i]!)}, and the day closed at ${px(close)}, in the top ${Math.round((1 - (close - lo.v) / range) * 100)}% of its range. The real move came after the manipulation, as the model says.`,
            annos: [
              { kind: "band", from: Math.max(2, dist), to: w.length - 1, label: "distribution", tone: "mastery" },
              { kind: "marker", bar: at(hi.i), price: hi.v, label: `high ${px(hi.v)} at ${hhmm(b[hi.i]!)}`, tone: "mastery" },
            ],
          },
          {
            title: "The daily candle",
            caption: `Open ${px(open)}, low ${px(lo.v)}, high ${px(hi.v)}, close ${px(close)}. A bullish daily candle whose lower wick was the morning manipulation. That is Power of Three, on a day that happened.`,
            annos: [{ kind: "note", at: "tl", text: `O ${px(open)}  L ${px(lo.v)}  H ${px(hi.v)}  C ${px(close)}`, tone: "accent" }],
          },
        ], true, 8);
      },
    });
  }
  return out;
}

/** Lesson 22. Weekly candles from daily bars: a week whose low forms on Monday or Tuesday under the prior week's low, closing near its high. */
function findExpansionWeek(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  // Group daily bars into ISO-ish weeks by ET date (Mon to Fri).
  const weeks: number[][] = [];
  let cur: number[] = [];
  for (let i = 0; i < b.length; i++) {
    const e = et(b[i]!.t);
    if (e.dow === 1 && cur.length) {
      weeks.push(cur);
      cur = [];
    }
    cur.push(i);
  }
  if (cur.length) weeks.push(cur);
  for (let wk = 1; wk < weeks.length; wk++) {
    const prev = weeks[wk - 1]!;
    const week = weeks[wk]!;
    if (prev.length < 4 || week.length < 5) continue;
    const prevLow = Math.min(...prev.map((i) => b[i]!.l));
    const lo = minLow(b, week[0]!, week[week.length - 1]!);
    const hi = maxHigh(b, week[0]!, week[week.length - 1]!);
    const open = b[week[0]!]!.o;
    const close = b[week[week.length - 1]!]!.c;
    const lowDay = lo.i - week[0]!;
    if (lowDay > 1) continue;
    if (lo.v >= prevLow) continue;
    const range = hi.v - lo.v;
    if ((close - lo.v) / range < 0.75) continue;
    if (close <= open) continue;
    out.push({
      id: "real-expansion-week",
      score: (close - lo.v) / range + range / avgRange(b, week[0]!, 20),
      build: () => {
        const w = b.slice(prev[0]!, week[week.length - 1]! + 1);
        const r = (j: number) => j - prev[0]!;
        const labels: Record<number, string> = {};
        w.forEach((bar, k) => (labels[k] = DAYS[et(bar.t).dow]!));
        const s = spec(raw, w, "real-expansion-week", "An expansion week on a real chart", "daily bars, two weeks", [
          {
            title: "Last week's low",
            caption: `The week of ${dateOf(b[prev[0]!]!)} made its low at ${px(prevLow)}. The sell stops under that low are where the new week looks first.`,
            annos: [{ kind: "hline", price: prevLow, from: 0, to: r(lo.i) + 1, label: `last week's low ${px(prevLow)}`, tone: "neutral", dashed: true, labelAt: "start" }],
          },
          {
            title: "The low forms early",
            caption: `${DAYS[et(b[lo.i]!.t).dow]} ${shortDate(b[lo.i]!)} ran below it to ${px(lo.v)} and closed at ${px(b[lo.i]!.c)}. The low of the week was in by ${lowDay === 0 ? "Monday" : "Tuesday"}.`,
            annos: [
              { kind: "band", from: r(week[0]!), to: r(lo.i), label: "the weekly low forms", tone: "danger" },
              { kind: "marker", bar: r(lo.i), price: lo.v, label: `low ${px(lo.v)}`, tone: "danger", place: "below" },
            ],
          },
          {
            title: "Expansion",
            caption: `The week then expanded: the high, ${px(hi.v)}, printed on ${DAYS[et(b[hi.i]!.t).dow]}, and the week closed at ${px(close)}, in the top ${Math.round((1 - (close - lo.v) / range) * 100)}% of its ${px(range)}-point range.`,
            annos: [
              { kind: "band", from: r(lo.i) + 1, to: w.length - 1, label: "expansion", tone: "mastery" },
              { kind: "marker", bar: r(hi.i), price: hi.v, label: `high ${px(hi.v)}`, tone: "mastery" },
            ],
          },
          {
            title: "The weekly candle",
            caption: `Open ${px(open)}, low ${px(lo.v)}, high ${px(hi.v)}, close ${px(close)}: a bullish weekly candle whose wick was the early-week sweep of last week's low. Lesson 22's shape, on real daily bars.`,
            annos: [{ kind: "note", at: "bl", text: `Weekly: O ${px(open)}  L ${px(lo.v)}  H ${px(hi.v)}  C ${px(close)}`, tone: "accent" }],
          },
        ], false, 1);
        s.xLabels = labels;
        return s;
      },
    });
  }
  return out;
}

/** Lesson 49. C1 low, C2 sweeps and closes back above, C3 closes above C2's high, C4 opens in C3's upper half and expands. */
function findCandleCount(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  for (let i = 8; i < b.length - 12; i++) {
    const c1 = b[i]!;
    const c2 = b[i + 1]!;
    const c3 = b[i + 2]!;
    const c4 = b[i + 3]!;
    if (!(c2.l < c1.l && c2.c > c1.l)) continue;
    if (!(c3.c > c2.h)) continue;
    const mid3 = (c3.h + c3.l) / 2;
    if (!(c4.o >= mid3 && c4.l >= mid3 && c4.c > c3.h)) continue;
    const ar = avgRange(b, i);
    if (b[i - 5]!.c - c1.c < ar) continue;
    const follow = maxHigh(b, i + 4, i + 8).v - c4.c;
    if (!cleanWindow(b, Math.max(0, i - 14), i + 9, raw.interval)) continue;
    out.push({
      id: "real-candle-count",
      score: (c4.c - c2.l) / ar + follow / ar,
      build: () => {
        const start = Math.max(0, i - 14);
        const w = b.slice(start, Math.min(b.length, i + 10));
        const r = (j: number) => j - start;
        return spec(raw, w, "real-candle-count", "C1 to C4 on a real chart", "", [
          {
            title: "Candle 1",
            caption: `${dateOf(c1)}. The ${hhmm(c1)} bar closes at ${px(c1.c)} with its low at ${px(c1.l)}, in a decline. Candle 1.`,
            annos: [{ kind: "marker", bar: r(i), price: c1.l, label: `C1 low ${px(c1.l)}`, tone: "neutral", place: "below" }],
          },
          {
            title: "Candle 2",
            caption: `The ${hhmm(c2)} bar trades to ${px(c2.l)}, below Candle 1's low, and closes at ${px(c2.c)}, back above it. Sweep and close back: Candle 2.`,
            annos: [{ kind: "marker", bar: r(i + 1), price: c2.l, label: `C2: ${px(c2.l)}, closes ${px(c2.c)}`, tone: "danger", place: "below" }],
          },
          {
            title: "Candle 3",
            caption: `The ${hhmm(c3)} bar closes at ${px(c3.c)}, above Candle 2's high of ${px(c2.h)}. Its range is ${px(c3.l)} to ${px(c3.h)}, so its equilibrium is ${px(mid3)}.`,
            annos: [
              { kind: "marker", bar: r(i + 2), price: c3.h, label: `C3 closes ${px(c3.c)}`, tone: "mastery" },
              { kind: "hline", price: mid3, from: r(i + 2), to: r(i + 4), label: `C3 equilibrium ${px(mid3)}`, tone: "warning", dashed: true, labelAt: "end" },
            ],
          },
          {
            title: "Candle 4",
            caption: `The ${hhmm(c4)} bar opens at ${px(c4.o)}, in Candle 3's upper half, never trades below ${px(mid3)} (its low is ${px(c4.l)}), and closes at ${px(c4.c)}, above Candle 3's high. Expanding out of the upper half of Candle 3: the count as written in Lesson 49.`,
            annos: [
              { kind: "zone", from: r(i + 3), to: r(i + 3), low: mid3, high: c3.h, label: "C3 upper half", tone: "mastery", labelAt: "bottom-end" },
              { kind: "marker", bar: r(i + 3), price: c4.h, label: `C4 closes ${px(c4.c)}`, tone: "mastery" },
            ],
          },
        ], true, 6);
      },
    });
  }
  return out;
}

/** Lesson 20. ES makes a lower low while NQ makes a higher low (or the reverse), then both rally. */
function findSmt(es: Raw, nq: Raw): Found[] {
  const a = es.bars;
  const byT = new Map(nq.bars.map((bar) => [bar.t, bar]));
  const out: Found[] = [];
  const isLow = (bars: Bar[], i: number, n = 6) => {
    for (let j = i - n; j <= i + n; j++) if (j !== i && j >= 0 && j < bars.length && bars[j]!.l <= bars[i]!.l) return false;
    return true;
  };
  for (let i = 30; i < a.length - 40; i++) {
    if (!isLow(a, i)) continue;
    // The previous swing low within 40 bars.
    let p = -1;
    for (let j = i - 8; j >= i - 40 && j >= 0; j--) if (isLow(a, j)) {
      p = j;
      break;
    }
    if (p < 0) continue;
    if (!(a[i]!.l < a[p]!.l)) continue; // ES lower low
    const n1 = byT.get(a[p]!.t);
    const n2 = byT.get(a[i]!.t);
    if (!n1 || !n2) continue;
    // NQ's low around the same bars, using ±2 bars.
    const nqLowAround = (t: number) => {
      let v = Infinity;
      for (let d = -2; d <= 2; d++) {
        const bar = byT.get(t + d * 300);
        if (bar) v = Math.min(v, bar.l);
      }
      return v;
    };
    const nl1 = nqLowAround(a[p]!.t);
    const nl2 = nqLowAround(a[i]!.t);
    if (!(nl2 > nl1)) continue; // NQ higher low: divergence
    const ar = avgRange(a, i, 60);
    const rally = maxHigh(a, i + 1, i + 24).v - a[i]!.c;
    if (rally < ar * 4) continue;
    if (minLow(a, i + 1, i + 24).v < a[i]!.l) continue;
    if (!cleanWindow(a, Math.max(0, p - 10), i + 25, es.interval)) continue;
    out.push({
      id: "real-smt",
      score: rally / ar + (a[p]!.l - a[i]!.l) / ar + rthBonus(a[i]!),
      build: () => {
        const start = Math.max(0, p - 10);
        const end = Math.min(a.length, i + 26);
        const w = a.slice(start, end);
        const r = (j: number) => j - start;
        const overlay = w.map((bar) => byT.get(bar.t)?.c ?? NaN);
        // Fill any missing NQ bars with the previous value so the line is continuous.
        for (let k = 0; k < overlay.length; k++) if (Number.isNaN(overlay[k]!)) overlay[k] = k ? overlay[k - 1]! : overlay.find((v) => !Number.isNaN(v))!;
        const hi = maxHigh(a, i + 1, i + 24);
        const s = spec(es, w, "real-smt", "SMT divergence on real charts", "5-minute bars, ES above and NQ below", [
          {
            title: "Two markets, two lows",
            caption: `${dateOf(a[p]!)}. ES makes a low at ${px(a[p]!.l)} at ${hhmm(a[p]!)}. NQ's low around the same bars is ${px(nl1)}. Both should move together.`,
            annos: [{ kind: "marker", bar: r(p), price: a[p]!.l, label: `ES low ${px(a[p]!.l)}`, tone: "neutral", place: "below" }],
          },
          {
            title: "The divergence",
            caption: `At ${hhmm(a[i]!)} ES makes a lower low, ${px(a[i]!.l)}. NQ, underneath, holds a higher low: ${px(nl2)} against ${px(nl1)}. One market swept; the other refused to confirm. SMT.`,
            annos: [
              { kind: "marker", bar: r(i), price: a[i]!.l, label: `ES lower low ${px(a[i]!.l)}`, tone: "mastery", place: "below" },
              { kind: "note", at: "tr", text: `ES: ${px(a[p]!.l)} → ${px(a[i]!.l)} (lower low)\nNQ: ${px(nl1)} → ${px(nl2)} (higher low)`, tone: "warning" },
            ],
          },
          {
            title: "Both rally",
            caption: `From the divergence ES rallies to ${px(hi.v)} by ${hhmm(a[hi.i]!)}, ${px(hi.v - a[i]!.c)} points, and NQ goes with it. The sweep that only one market made was the tell, as Lesson 20 describes.`,
            annos: [{ kind: "arrow", from: [r(i) + 1, a[i]!.c], to: [r(hi.i), hi.v], label: "both markets up", tone: "mastery" }],
          },
        ], true, 8);
        s.overlay = { label: "NQ (Nasdaq future)", values: overlay, tone: "warning" };
        return s;
      },
    });
  }
  return out;
}

/** Lesson 28. A leg from a swing low to a swing high, a retrace into the 62 to 79% band that holds, then a new high. */
function findOte(raw: Raw): Found[] {
  const b = raw.bars;
  const out: Found[] = [];
  const isLow = (i: number) => [1, 2, 3].every((d) => i - d >= 0 && i + d < b.length && b[i]!.l < b[i - d]!.l && b[i]!.l < b[i + d]!.l);
  const isHigh = (i: number) => [1, 2, 3].every((d) => i - d >= 0 && i + d < b.length && b[i]!.h > b[i - d]!.h && b[i]!.h > b[i + d]!.h);
  for (let i = 10; i < b.length - 60; i++) {
    if (!isLow(i)) continue;
    const hIdx = [...Array(24).keys()].map((d) => i + 4 + d).find((j) => j < b.length && isHigh(j));
    if (!hIdx) continue;
    const L = b[i]!.l;
    const H = b[hIdx]!.h;
    const ar = avgRange(b, i, 30);
    if (H - L < ar * 4) continue;
    if (minLow(b, i + 1, hIdx).v < L) continue;
    const oteHi = H - 0.62 * (H - L);
    const oteLo = H - 0.79 * (H - L);
    let ret = -1;
    for (let j = hIdx + 1; j <= hIdx + 30 && j < b.length; j++) {
      if (b[j]!.l < oteLo - ar * 0.3) {
        ret = -1;
        break;
      }
      if (b[j]!.l <= oteHi && b[j]!.l >= oteLo - ar * 0.3) {
        ret = j;
        break;
      }
    }
    if (ret < 0) continue;
    const after = maxHigh(b, ret + 1, ret + 30);
    if (after.v <= H) continue;
    if (minLow(b, ret, after.i).v < oteLo - ar * 0.3) continue;
    if (!cleanWindow(b, Math.max(0, i - 6), after.i + 4, raw.interval)) continue;
    out.push({
      id: "real-ote",
      score: (H - L) / ar + (after.v - H) / ar,
      build: () => {
        const start = Math.max(0, i - 6);
        const w = b.slice(start, Math.min(b.length, after.i + 5));
        const r = (j: number) => j - start;
        const eq = (H + L) / 2;
        return spec(raw, w, "real-ote", "Premium, discount and the OTE on a real chart", "", [
          {
            title: "The dealing range",
            caption: `${dateOf(b[i]!)}. A swing low at ${px(L)} (${hhmm(b[i]!)}) and a swing high at ${px(H)} (${hhmm(b[hIdx]!)}): a range of ${px(H - L)} points.`,
            annos: [
              { kind: "marker", bar: r(i), price: L, label: `low ${px(L)}`, tone: "neutral", place: "below" },
              { kind: "marker", bar: r(hIdx), price: H, label: `high ${px(H)}`, tone: "neutral" },
              { kind: "hline", price: H, from: r(hIdx), to: w.length - 1, tone: "neutral", dashed: true },
            ],
          },
          {
            title: "Equilibrium, premium, discount",
            caption: `Halfway is ${px(eq)}. Above it the range is premium; below it, discount. The retrace that follows is read against that line.`,
            annos: [
              { kind: "hline", price: eq, from: r(i), to: w.length - 1, label: `equilibrium ${px(eq)}`, tone: "accent", dashed: true, labelAt: "start" },
              { kind: "zone", from: r(hIdx), to: w.length - 1, low: eq, high: H, label: "premium", tone: "danger", labelAt: "inside" },
              { kind: "zone", from: r(hIdx), to: w.length - 1, low: L, high: eq, label: "discount", tone: "mastery", labelAt: "bottom-end" },
            ],
          },
          {
            title: "Into the OTE",
            caption: `The 62 to 79% retracement of the leg is ${px(oteHi)} down to ${px(oteLo)}. At ${hhmm(b[ret]!)} price trades into that band, to ${px(b[ret]!.l)}, and holds above the low.`,
            annos: [
              { kind: "zone", from: r(hIdx) + 1, to: r(ret) + 4, low: oteLo, high: oteHi, label: "OTE 62% to 79%", tone: "mastery", labelAt: "bottom" },
              { kind: "marker", bar: r(ret), price: b[ret]!.l, label: `into the OTE, ${hhmm(b[ret]!)}`, tone: "mastery", place: "below" },
            ],
          },
          {
            title: "The new high",
            caption: `From the OTE price reaches ${px(after.v)} at ${hhmm(b[after.i]!)}, above the old high at ${px(H)}. Bought in discount, sold the buyside above the range: Lesson 28, on bars that traded.`,
            annos: [{ kind: "arrow", from: [r(ret) + 1, b[ret]!.c], to: [r(after.i), after.v], label: "target above the old high", tone: "mastery" }],
          },
        ], true, 6);
      },
    });
  }
  return out;
}

// ---- Run --------------------------------------------------------------------

function best(found: Found[]): Walkthrough | null {
  if (!found.length) return null;
  found.sort((x, y) => y.score - x.score);
  return found[0]!.build();
}

function main() {
  const es5 = load("ESF-5m");
  const es1h = load("ESF-1h");
  const es1d = load("ESF-1d");
  const nq5 = load("NQF-5m");

  const studies: (Walkthrough | null)[] = [
    best(findCandle2(es1h)),
    best(findCandle3(es1h)),
    best(findCisd(es5)),
    best(findFvg(es5)),
    best(findOrderBlock(es5)),
    best(findEqualHighs(es1h)),
    best(findBosChoch(es1h)),
    best(findNwog(es1h)),
    best(findJudas(es5)),
    best(findSilverBullet(es5)),
    best(findPdhPdl(es5)) ?? best(findPdhPdl(es1h)),
    best(findPowerOfThree(es5)),
    best(findExpansionWeek(es1d)),
    best(findCandleCount(es1h)),
    best(findSmt(es5, nq5)),
    best(findOte(es1h)),
  ];

  mkdirSync("lib/case-studies/data", { recursive: true });
  const ids: string[] = [];
  for (const s of studies) {
    if (!s) continue;
    writeFileSync(`lib/case-studies/data/${s.id}.json`, JSON.stringify(s));
    ids.push(s.id);
    console.log(`${s.id.padEnd(24)} ${s.candles.length} bars  ${s.source?.from} → ${s.source?.to}`);
  }
  const index = `// Generated by scripts/find-case-studies.ts. Don't edit by hand.
import type { Walkthrough } from "../walkthroughs/types";
${ids.map((id, i) => `import cs${i} from "./data/${id}.json";`).join("\n")}

const ALL = [${ids.map((_, i) => `cs${i}`).join(", ")}] as unknown as Walkthrough[];

export const CASE_STUDIES: Record<string, Walkthrough> = Object.fromEntries(ALL.map((w) => [w.id, w]));

export function getCaseStudy(id: string): Walkthrough | null {
  return CASE_STUDIES[id] ?? null;
}
`;
  writeFileSync("lib/case-studies/index.ts", index);
  const missing = ["real-candle-2", "real-candle-3", "real-cisd", "real-fvg", "real-order-block", "real-liquidity", "real-bos-choch", "real-nwog", "real-judas", "real-silver-bullet", "real-pdh-pdl", "real-power-of-three", "real-expansion-week", "real-candle-count", "real-smt", "real-ote"].filter((id) => !ids.includes(id));
  console.log(`\n${ids.length} case studies written${missing.length ? `; no clean instance found for: ${missing.join(", ")}` : ""}`);
}

main();
