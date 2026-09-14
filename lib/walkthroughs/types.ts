/**
 * Walkthroughs: the visual aid for lessons that don't have a recording,
 * and honestly a better one for structure concepts. Each is a synthetic
 * chart built so the thing being taught is exactly where the caption says
 * it is, plus a sequence of steps that lay annotations on top one at a
 * time. The learner steps through at their own pace, every step has a
 * caption, and the whole thing reads out as text for screen readers.
 *
 * Coordinates are (bar index, price). Bars are whatever the spec says they
 * are (5-minute, hourly, daily); the chart doesn't care, the captions do.
 */

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export type Tone = "accent" | "mastery" | "warning" | "danger" | "neutral";

export type Anno =
  /** A horizontal level, optionally only across a range of bars. */
  | { kind: "hline"; price: number; from?: number; to?: number; label?: string; tone?: Tone; dashed?: boolean; labelAt?: "start" | "end" }
  /** A price box across a range of bars: FVGs, order blocks, ranges, sessions' price extents. */
  | { kind: "zone"; from: number; to: number; low: number; high: number; label?: string; tone?: Tone; labelAt?: "top" | "bottom" | "inside" | "top-end" | "bottom-end" }
  /** A vertical time window across the full height: a session, a macro, a phase. */
  | { kind: "band"; from: number; to: number; label?: string; tone?: Tone; labelAt?: "top" | "bottom" }
  /** A single vertical line: an open, a news release. */
  | { kind: "vline"; bar: number; label?: string; tone?: Tone; labelAt?: "top" | "bottom" }
  /** A dot and label pinned to a candle: swing points, entries, exits. */
  | { kind: "marker"; bar: number; price: number; label: string; tone?: Tone; place?: "above" | "below" }
  /** An arrow between two points, for "price goes here next". */
  | { kind: "arrow"; from: [number, number]; to: [number, number]; label?: string; tone?: Tone }
  /** A polyline through points: the structure line, the curve of a model. */
  | { kind: "path"; points: [number, number][]; label?: string; tone?: Tone; dashed?: boolean; labelAt?: "start" | "end" }
  /** A horizontal measuring bracket: a lookback window, a range's length. */
  | { kind: "bracket"; from: number; to: number; price: number; label: string; tone?: Tone }
  /** A small callout box with a sentence in it. Pinned to a corner of the plot, or to a bar and price. */
  | { kind: "note"; text: string; tone?: Tone; at?: "tl" | "tr" | "bl" | "br"; bar?: number; price?: number };

export interface Step {
  title: string;
  /** One or two sentences. This is what the screen reader gets, so it has to carry the step on its own. */
  caption: string;
  annos: Anno[];
}

export interface Walkthrough {
  id: string;
  title: string;
  /** What the bars are and what market it pretends to be. Shown under the title. */
  frame: string;
  candles: Candle[];
  /** Labels along the x axis, keyed by bar index. Times for intraday charts, days for daily ones. */
  xLabels?: Record<number, string>;
  /** An extra line drawn in a lower panel: a second market, an equity curve. */
  overlay?: { label: string; values: number[]; tone?: Tone; unit?: string };
  steps: Step[];
  /**
   * Set on the real-chart case studies: where the bars came from and when.
   * Absent on the synthetic walkthroughs, which is how the renderer knows
   * which pill to show.
   */
  source?: {
    kind: "real";
    symbol: string;
    interval: string;
    from: string;
    to: string;
    provider: string;
    retrieved: string;
  };
}
