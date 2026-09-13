import { build, timeLabels } from "./synth";
import type { Anno, Walkthrough } from "./types";

/** Module 15: Execution & Review. Lessons 46 to 48. */

export const tradeManagement: Walkthrough = {
  id: "trade-management",
  title: "Trade management: partials, break-even and trailing",
  frame: "5-minute bars, index future, one long trade from entry to exit",
  candles: build({
    seed: 46,
    bars: 60,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 4994], [6, 5002], [10, 4996], [14, 5000], [18, 5006], [22, 5011], [26, 5004], [30, 5012],
      [34, 5013], [38, 5020], [42, 5024], [46, 5031], [50, 5026], [55, 5034], [59, 5030],
    ],
    force: {
      14: { o: 4999, c: 5001, h: 5002, l: 4998 },
      22: { h: 5012 },
      26: { l: 5004 },
      34: { l: 5012 },
      46: { h: 5032 },
    },
  }),
  xLabels: timeLabels(60, 9.5, 5, 12),
  steps: [
    {
      title: "The trade as planned",
      caption:
        "Long at 5000. Stop at 4990, so one R is ten points. Target at 5030, three R. All three numbers exist before the entry, and the management rules below are decided now too, not while the position is open.",
      annos: [
        { kind: "marker", bar: 14, price: 5000, label: "entry 5000", tone: "mastery", place: "below" },
        { kind: "hline", price: 4990, from: 14, to: 24, label: "stop 4990 (1R = 10 pts)", tone: "danger", dashed: true },
        { kind: "hline", price: 5030, from: 14, to: 59, label: "target 5030 (3R)", tone: "mastery", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "Partial at one R",
      caption:
        "At 10:20 price reaches 5010, one R. Take a third off. That partial does two things: it pays for the trade if the rest is stopped out, and it makes it easier to hold the remainder without flinching.",
      annos: [
        { kind: "hline", price: 5010, from: 14, to: 24, label: "1R", tone: "accent", dashed: true },
        { kind: "marker", bar: 22, price: 5012, label: "partial: one third off", tone: "accent" },
      ],
    },
    {
      title: "Stop to break-even after displacement",
      caption:
        "Once price has displaced away from the entry, the stop moves to 5000. The trade can no longer lose. Doing this too early, before the displacement, gets you taken out on the normal pullback; here the pullback to 5004 at 10:40 holds above the new stop with room to spare.",
      annos: [
        { kind: "hline", price: 5000, from: 24, to: 34, label: "stop to break-even", tone: "warning", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 26, price: 5004, label: "holds above BE", tone: "warning", place: "above" },
      ],
    },
    {
      title: "Trail under structure",
      caption:
        "From then on the stop follows the higher lows, not a fixed number of points. The higher low at 11:20 is 5012, so the stop goes under it at 5010. A structure-based trail only moves when the market gives it a reason to.",
      annos: [
        { kind: "marker", bar: 34, price: 5012, label: "HL 5012", tone: "neutral", place: "below" },
        { kind: "hline", price: 5010, from: 38, to: 46, label: "trail under the higher low", tone: "warning", dashed: true },
      ],
    },
    {
      title: "The exit",
      caption:
        "Price reaches the 5030 target at 12:20 and the rest comes off. One third at 1R, two thirds at 3R: 2.33R on the trade. The rules did the managing; the job during the trade was to follow them.",
      annos: [
        { kind: "marker", bar: 46, price: 5032, label: "target hit: exit the rest", tone: "mastery" },
        { kind: "note", at: "tl", text: "1/3 at 1R + 2/3 at 3R = 2.33R\nNever moved the stop against the trade.", tone: "mastery" },
      ],
    },
  ],
};

/** A fixed sequence of outcomes for the two review walkthroughs. W = 2R, L = -1R. */
function tradeMarkers(bars: number[], results: ("W" | "L")[], candles: { h: number; l: number }[]): Anno[] {
  return bars.map((bar, i) => {
    const win = results[i] === "W";
    return {
      kind: "marker",
      bar,
      price: win ? candles[bar]!.h : candles[bar]!.l,
      label: win ? "+2R" : "−1R",
      tone: win ? "mastery" : "danger",
      place: win ? "above" : "below",
    };
  });
}

function cumulative(results: ("W" | "L")[], bars: number[], total: number): number[] {
  const out: number[] = [];
  let r = 0;
  let next = 0;
  for (let i = 0; i < total; i++) {
    if (next < bars.length && i >= bars[next]!) {
      r += results[next] === "W" ? 2 : -1;
      next++;
    }
    out.push(r);
  }
  return out;
}

const JOURNAL_BARS = [4, 10, 16, 22, 27, 33, 38, 44, 50, 56, 62, 68];
const JOURNAL_RESULTS: ("W" | "L")[] = ["W", "L", "L", "W", "L", "W", "L", "L", "W", "L", "W", "L"];
const journalCandles = build({
  seed: 47,
  bars: 72,
  vol: 0.0012,
  wick: 0.0012,
  points: [[0, 5000], [12, 5030], [24, 5010], [36, 5040], [48, 5020], [60, 5050], [71, 5036]],
});

export const journalBacktest: Walkthrough = {
  id: "journal-backtest",
  title: "The journal and the backtest",
  frame: "1-hour bars, one setup taken twelve times, cumulative R below",
  candles: journalCandles,
  overlay: { label: "cumulative R", values: cumulative(JOURNAL_RESULTS, JOURNAL_BARS, 72), tone: "accent", unit: "R" },
  steps: [
    {
      title: "Twelve trades, one setup",
      caption:
        "Every marker is the same setup taken by the same rules. Five winners at two R, seven losers at one R. Looked at one at a time they tell you nothing: a loss says nothing about the rule, and neither does a win.",
      annos: tradeMarkers(JOURNAL_BARS, JOURNAL_RESULTS, journalCandles),
    },
    {
      title: "What the journal records",
      caption:
        "Each row in the journal is the same fields: date and session, the setup name, the entry, stop and target as planned, the result in R, a grade for execution (did you follow the plan, regardless of the result) and a screenshot. The grade is the column that improves you; the R column only improves the statistics.",
      annos: [
        { kind: "note", at: "tl", text: "date · session · setup · entry/stop/target · R · grade A/B/C · screenshot", tone: "accent" },
      ],
    },
    {
      title: "The curve",
      caption:
        "The line underneath is cumulative R: five times two, minus seven, is plus three. A 42 per cent win rate with two-to-one reward is a profitable rule, and it still spent most of the sample under water. The journal is where you find that out without paying for it.",
      annos: [
        { kind: "note", at: "br", text: "5 × 2R − 7 × 1R = +3R over 12 trades\nWin rate 42%. Expectancy +0.25R per trade.", tone: "mastery" },
      ],
    },
    {
      title: "The backtest",
      caption:
        "Twelve is not a sample. Before a rule earns real money it wants fifty to a hundred trades, taken by the written rule on past data, logged in exactly the same fields. If the backtest and the live journal disagree, the live execution is what changed.",
      annos: [
        { kind: "note", at: "bl", text: "Backtest first: 50+ samples, same fields.\nThen trade it small. Then compare the two.", tone: "warning" },
      ],
    },
  ],
};

const PSY_BARS = [3, 7, 10, 14, 17, 20, 23, 26, 29, 33, 37, 40, 43, 47, 50, 53, 57, 60, 64, 68];
const PSY_RESULTS: ("W" | "L")[] = ["W", "L", "L", "W", "L", "L", "L", "L", "L", "W", "W", "L", "L", "W", "L", "W", "L", "W", "W", "L"];
const psyCandles = build({
  seed: 48,
  bars: 72,
  vol: 0.0012,
  wick: 0.0012,
  points: [[0, 5020], [12, 5000], [24, 5030], [36, 5010], [48, 5044], [60, 5024], [71, 5050]],
});

export const psychology: Walkthrough = {
  id: "psychology-probabilities",
  title: "Thinking in probabilities",
  frame: "1-hour bars, twenty trades of a 40% win-rate setup at 2R, cumulative R below",
  candles: psyCandles,
  overlay: { label: "cumulative R", values: cumulative(PSY_RESULTS, PSY_BARS, 72), tone: "accent", unit: "R" },
  steps: [
    {
      title: "Twenty coin flips with an edge",
      caption:
        "Eight winners at two R, twelve losers at one R. Each trade is a weighted coin: 40 per cent heads. The setup has an edge, and no single trade shows it.",
      annos: tradeMarkers(PSY_BARS, PSY_RESULTS, psyCandles),
    },
    {
      title: "The losing streak",
      caption:
        "Trades five to nine are five losses in a row. With a 40 per cent win rate the chance of five straight losses is about 8 per cent, so over twenty trades it is more likely than not to happen at least once. It is not evidence the setup is broken. It is what the setup looks like sometimes.",
      annos: [
        { kind: "band", from: 16, to: 30, label: "five losses in a row: expected", tone: "danger", labelAt: "bottom" },
        { kind: "note", at: "br", text: "P(5 losses in a row) = 0.6⁵ ≈ 8% per run.\nOver 20 trades: happens more often than not.", tone: "warning" },
      ],
    },
    {
      title: "The arithmetic",
      caption:
        "Eight times two minus twelve is plus four R over twenty trades: 0.2R per trade. That number is the only one that matters, and it only exists over the sample. Risking one per cent a trade, that is a four per cent gain with a five-loss streak inside it.",
      annos: [
        { kind: "note", at: "tl", text: "8 × 2R − 12 × 1R = +4R\nExpectancy = +0.2R per trade", tone: "mastery" },
      ],
    },
    {
      title: "What the curve teaches",
      caption:
        "The line below spends its first half below zero and ends at plus four. If you had stopped after trade nine, the setup would have 'failed'. If you had doubled size after trade eleven, the next two losses would have hurt. Fixed risk, the same size every time, is what lets the edge show up.",
      annos: [
        { kind: "note", bar: 40, price: 4992, text: "Same size every trade. Judge the rule\nby the sample, not by the last trade.", tone: "accent" },
      ],
    },
  ],
};

export const execution = [tradeManagement, journalBacktest, psychology];
