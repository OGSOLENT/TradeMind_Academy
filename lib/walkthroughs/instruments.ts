import { build, timeLabels } from "./synth";
import type { Candle, Walkthrough } from "./types";

/** Module 16: Markets, Instruments & Funding. Lessons 55 and 58. */

export const tickValue: Walkthrough = {
  id: "tick-value",
  title: "Tick value: the same trade on ES and MES",
  frame: "5-minute bars, E-mini S&P 500 future; one long trade sized two ways",
  candles: build({
    seed: 55,
    bars: 36,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 4996], [6, 5002], [10, 4998], [12, 5000], [16, 5006], [20, 5003], [26, 5011], [32, 5016], [35, 5018],
    ],
    force: {
      12: { o: 4999, c: 5000.25, h: 5001, l: 4998 },
      32: { h: 5016.25 },
    },
  }),
  xLabels: timeLabels(36, 9.5, 5, 6),
  steps: [
    {
      title: "The trade in points",
      caption:
        "Long at 5000.25, stop at 4992.25, target at 5016.25. Eight points of risk for sixteen of reward: a 2R trade. Points are how you plan; dollars are what the contract turns them into.",
      annos: [
        { kind: "marker", bar: 12, price: 5000.25, label: "entry 5000.25", tone: "mastery", place: "below" },
        { kind: "hline", price: 4992.25, from: 12, to: 35, label: "stop 4992.25 (8 pts)", tone: "danger", dashed: true, labelAt: "start" },
        { kind: "hline", price: 5016.25, from: 12, to: 35, label: "target 5016.25 (16 pts)", tone: "mastery", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "One tick",
      caption:
        "ES moves in quarter points. From 5000.00 to 5000.25 is one tick: $12.50 on ES, $1.25 on MES. Four ticks make a point, so a point is $50 on ES and $5 on MES. Every number that follows is built from those two.",
      annos: [
        { kind: "zone", from: 10, to: 14, low: 5000, high: 5000.25, label: "one tick: 0.25 = $12.50 ES / $1.25 MES", tone: "accent", labelAt: "bottom" },
      ],
    },
    {
      title: "The same risk, two sizes",
      caption:
        "Eight points on one ES contract is 8 × $50 = $400. On one MES it's 8 × $5 = $40. Same chart, same stop, a tenth of the money. That is why the micro is where you make your first hundred mistakes.",
      annos: [
        { kind: "note", at: "tr", text: "Risk 8 pts:  1 ES = $400   1 MES = $40\nReward 16 pts:  1 ES = $800   1 MES = $80", tone: "accent" },
      ],
    },
    {
      title: "Sizing from the stop",
      caption:
        "Lesson 3b's rule with real numbers. Risking $100 a trade with an 8-point stop: $100 ÷ $40 per MES = 2 MES contracts (round down). The same $100 can't buy a single ES contract at this stop, and the margin never entered the calculation.",
      annos: [
        { kind: "marker", bar: 32, price: 5016.25, label: "target hit: +$80 per MES", tone: "mastery" },
        { kind: "note", at: "br", text: "$100 risk ÷ ($5 × 8 pts) = 2.5 → 2 MES.\nSize from the stop. Margin is a limit, not a guide.", tone: "mastery" },
      ],
    },
  ],
};

/**
 * The account as daily candles: open and close are the balance at the start
 * and end of each day, high and low are the intraday peak and trough of
 * equity. That's the honest way to draw drawdown rules, because the
 * intraday trailing floor follows the high and the end-of-day floor follows
 * the close.
 */
const EQUITY: Candle[] = [
  { o: 50000, c: 50600, h: 50900, l: 49700 },
  { o: 50600, c: 51100, h: 51300, l: 50300 },
  { o: 51100, c: 50700, h: 51800, l: 50500 },
  { o: 50700, c: 50300, h: 50900, l: 49750 },
  { o: 50300, c: 51000, h: 51200, l: 50100 },
  { o: 51000, c: 51800, h: 52000, l: 50800 },
  { o: 51800, c: 51200, h: 51900, l: 50900 },
  { o: 51200, c: 50600, h: 51300, l: 50250 },
  { o: 50600, c: 51300, h: 51500, l: 50400 },
  { o: 51300, c: 52000, h: 52200, l: 51100 },
  { o: 52000, c: 52600, h: 52800, l: 51800 },
  { o: 52600, c: 53100, h: 53300, l: 52400 },
];

function trailingFloors(): { eod: [number, number][]; intraday: [number, number][] } {
  const eod: [number, number][] = [];
  const intraday: [number, number][] = [];
  let closePeak = 50000;
  let highPeak = 50000;
  EQUITY.forEach((d, i) => {
    highPeak = Math.max(highPeak, d.h);
    intraday.push([i, Math.min(50000, highPeak - 2000)]);
    closePeak = Math.max(closePeak, d.c);
    eod.push([i, Math.min(50000, closePeak - 2000)]);
  });
  return { eod, intraday };
}
const FLOORS = trailingFloors();

export const drawdownTypes: Walkthrough = {
  id: "drawdown-types",
  title: "Three drawdown rules on one account",
  frame: "daily account balance drawn as candles: $50,000 evaluation, $2,000 maximum drawdown",
  candles: EQUITY,
  xLabels: { 0: "day 1", 3: "day 4", 6: "day 7", 9: "day 10", 11: "day 12" },
  steps: [
    {
      title: "The account as candles",
      caption:
        "Each candle is one trading day of the account. Open and close are the balance at the start and end of the day; the wick high is the best the account looked during the day, the wick low the worst. Day 3 closed down $400 after being up $700 intraday.",
      annos: [
        { kind: "marker", bar: 2, price: 51800, label: "day 3 peak: +$1,800", tone: "neutral" },
        { kind: "marker", bar: 2, price: 50700, label: "day 3 close: +$700", tone: "neutral", place: "below" },
      ],
    },
    {
      title: "Static drawdown",
      caption:
        "A static rule puts the floor $2,000 under the starting balance and leaves it there: $48,000, forever. Nothing on this chart comes near it. This is the most forgiving rule and the rarest.",
      annos: [{ kind: "hline", price: 48000, label: "static floor: $48,000", tone: "mastery", dashed: true, labelAt: "start" }],
    },
    {
      title: "End-of-day trailing",
      caption:
        "An end-of-day trailing floor sits $2,000 under the highest closed balance so far, and stops rising once it reaches the starting balance. After day 6 closed at $51,800 the floor is $49,800; after day 10 it locks at $50,000. Day 8's low of $50,250 stayed $450 above it. Under this rule every day on the chart survives.",
      annos: [
        { kind: "path", points: FLOORS.eod, label: "EOD trailing floor", tone: "warning", labelAt: "start" },
        { kind: "marker", bar: 7, price: 50250, label: "day 8 low: $450 above the EOD floor", tone: "warning" },
      ],
    },
    {
      title: "Intraday trailing",
      caption:
        "An intraday trailing floor follows the highest unrealised balance, tick by tick. Day 3's intraday peak of $51,800 moved the floor to $49,800 even though the day closed at $50,700. On day 4 the account dipped to $49,750: under this rule the evaluation ends there, on a day that closed at $50,300, a full $1,200 above the end-of-day floor. Same trades, three outcomes.",
      annos: [
        { kind: "path", points: FLOORS.intraday, label: "intraday trailing floor", tone: "danger", labelAt: "start", dashed: true },
        { kind: "marker", bar: 3, price: 49750, label: "day 4: breached intraday, fine under EOD", tone: "danger", place: "below" },
        { kind: "note", at: "tl", text: "Static: never breached.  EOD: never breached.\nIntraday trailing: out on day 4.", tone: "accent" },
      ],
    },
  ],
};

export const instruments = [tickValue, drawdownTypes];
