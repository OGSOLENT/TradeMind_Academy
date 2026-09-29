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
  | { kind: "note"; text: string; tone?: Tone; at?: "tl" | "tr" | "bl" | "br"; bar?: number; price?: number };

export interface Step {
  title: string;
  caption: string;
  annos: Anno[];
}

export interface Walkthrough {
  id: string;
  title: string;
  frame: string;
  candles: Candle[];
  xLabels?: Record<number, string>;
  /** An extra line drawn in a lower panel: a second market, an equity curve. */
  overlay?: { label: string; values: number[]; tone?: Tone; unit?: string };
  steps: Step[];
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
