import { build } from "./synth";
import type { Walkthrough } from "./types";

/** Module 13: Higher-Timeframe Context. Lessons 44 and 45. */

export const ipdaRanges: Walkthrough = {
  id: "ipda-ranges",
  title: "IPDA data ranges: 20, 40 and 60 days",
  frame: "daily bars, index future, the last 64 sessions",
  candles: build({
    seed: 44,
    bars: 64,
    vol: 0.0025,
    wick: 0.003,
    points: [
      [0, 5040], [4, 5000], [8, 5130], [14, 5060], [20, 4950], [26, 5020], [30, 5080], [34, 5030],
      [38, 4990], [44, 5020], [50, 5050], [56, 5010], [63, 5030],
    ],
    force: {
      8: { h: 5132 },
      20: { l: 4948 },
      30: { h: 5082 },
      38: { l: 4988 },
      50: { h: 5052 },
      56: { l: 5008 },
    },
  }),
  xLabels: { 3: "60 days ago", 23: "40 days ago", 43: "20 days ago", 63: "today" },
  steps: [
    {
      title: "The 20-day range",
      caption:
        "Count back twenty sessions from today. The highest high in that window is 5052 and the lowest low is 5008. Those two prices are the nearest liquidity the algorithm is expected to refer to: the 20-day IPDA range.",
      annos: [
        { kind: "bracket", from: 44, to: 63, price: 5142, label: "20 days", tone: "mastery" },
        { kind: "hline", price: 5052, from: 44, to: 63, label: "20-day high 5052", tone: "mastery", dashed: true, labelAt: "start" },
        { kind: "hline", price: 5008, from: 44, to: 63, label: "20-day low 5008", tone: "mastery", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "The 40-day range",
      caption:
        "Forty sessions back widens the window. Now the highest high is 5082 and the lowest low is 4988. Both sit outside the 20-day levels, which is the point: each range is a layer of liquidity behind the one inside it.",
      annos: [
        { kind: "bracket", from: 24, to: 63, price: 5152, label: "40 days", tone: "accent" },
        { kind: "hline", price: 5082, from: 24, to: 63, label: "40-day high 5082", tone: "accent", dashed: true },
        { kind: "hline", price: 4988, from: 24, to: 63, label: "40-day low 4988", tone: "accent", dashed: true },
      ],
    },
    {
      title: "The 60-day range",
      caption:
        "Sixty sessions back is the outer layer: 5132 above and 4948 below. Beyond this the data is old enough that the algorithm is assumed not to be referencing it for the current delivery.",
      annos: [
        { kind: "bracket", from: 4, to: 63, price: 5162, label: "60 days", tone: "neutral" },
        { kind: "hline", price: 5132, from: 4, to: 63, label: "60-day high 5132", tone: "neutral", dashed: true },
        { kind: "hline", price: 4948, from: 4, to: 63, label: "60-day low 4948", tone: "neutral", dashed: true },
      ],
    },
    {
      title: "Reading the ladder",
      caption:
        "Price is at 5030, inside all three ranges. The nearest untaken high is the 20-day at 5052, so that is the first draw if the bias is up; behind it sit 5082 and 5132. Downwards, 5008, then 4988, then 4948. The ranges turn 'where is price going?' into a short ordered list.",
      annos: [
        { kind: "arrow", from: [63, 5034], to: [63, 5050], label: "first draw", tone: "mastery" },
        { kind: "note", at: "br", text: "Up: 5052 → 5082 → 5132\nDown: 5008 → 4988 → 4948", tone: "accent" },
      ],
    },
  ],
};

const DXY = [
  103.2, 103.25, 103.3, 103.4, 103.45, 103.55, 103.6, 103.7, 103.75, 103.85, 103.9, 104.0, 104.05, 104.15,
  104.2, 104.1, 104.15, 104.2, 104.1, 104.05, 104.12, 104.0, 103.9, 103.8, 103.75, 103.65, 103.6, 103.5,
  103.45, 103.4, 103.3, 103.25, 103.2, 103.1, 103.05, 103.0, 102.95, 102.9, 102.85, 102.8, 102.75, 102.7,
  102.65, 102.6, 102.55, 102.5, 102.45, 102.4,
];

export const correlations: Walkthrough = {
  id: "correlations",
  title: "Correlations: the dollar, the indices and risk",
  frame: "1-hour bars, index future above, the dollar index below",
  candles: build({
    seed: 45,
    bars: 48,
    vol: 0.0007,
    wick: 0.0008,
    points: [
      [0, 5040], [6, 5024], [10, 5012], [14, 4998], [17, 5006], [20, 4992], [24, 5008], [30, 5024],
      [36, 5040], [42, 5056], [47, 5062],
    ],
    force: {
      14: { l: 4996 },
      20: { o: 4996, c: 4993, h: 4998, l: 4988 },
      21: { o: 4993, c: 5002, h: 5004, l: 4992 },
    },
  }),
  overlay: { label: "DXY (dollar index)", values: DXY, tone: "warning" },
  steps: [
    {
      title: "The inverse relationship",
      caption:
        "For the first twenty bars the dollar index climbs from 103.2 to 104.2 and the equity index falls from 5040 to 4992. A rising dollar is risk-off; indices tend to fall with it. Not always, not perfectly, but often enough to be the first thing to check.",
      annos: [
        { kind: "arrow", from: [2, 5036], to: [18, 5000], label: "index down while the dollar rises", tone: "danger" },
      ],
    },
    {
      title: "The divergence",
      caption:
        "At bar 20 the index makes a lower low, 4988 under the 4996 low from bar 14. The dollar should be making a higher high at the same time. It is not: 104.12 against 104.2. One market confirmed the move and the other refused. That is SMT divergence between correlated markets.",
      annos: [
        { kind: "marker", bar: 14, price: 4996, label: "low 4996", tone: "neutral", place: "below" },
        { kind: "marker", bar: 20, price: 4988, label: "lower low 4988", tone: "mastery", place: "below" },
        { kind: "note", at: "br", text: "Index: lower low.\nDollar: no new high (104.12 < 104.2).\nThe dollar didn't confirm the sell-off.", tone: "warning" },
      ],
    },
    {
      title: "Risk-on",
      caption:
        "The dollar rolls over and the index rallies from 4992 to 5062 as it falls. The divergence at bar 20 was the tell, and the inverse correlation then did the rest of the work in the same direction.",
      annos: [{ kind: "arrow", from: [22, 5000], to: [46, 5058], label: "risk-on: dollar down, index up", tone: "mastery" }],
    },
    {
      title: "How to use it",
      caption:
        "Correlation is context, not a signal. It tells you whether the story behind a move holds together: an index sweep with the dollar confirming is cleaner than one it contradicts. The framework (bias, liquidity, displacement) comes first; correlation adds or removes confidence in it.",
      annos: [
        { kind: "note", at: "tl", text: "Does the dollar agree with the move?\nYes → more confidence. No → wait.", tone: "accent" },
      ],
    },
  ],
};

export const htfContext = [ipdaRanges, correlations];
