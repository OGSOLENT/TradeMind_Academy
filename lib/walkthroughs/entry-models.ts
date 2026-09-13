import { build, timeLabels } from "./synth";
import type { Walkthrough } from "./types";

/** Module 10: Entry Models. Lessons 40 to 43. */

export const model2022: Walkthrough = {
  id: "model-2022",
  title: "The 2022 model: sweep, shift, gap",
  frame: "5-minute bars, 08:30 to 13:30 ET, index future, higher-timeframe bias up",
  candles: build({
    seed: 40,
    bars: 60,
    vol: 0.0006,
    wick: 0.0007,
    points: [
      [0, 5004], [6, 5012], [12, 4996], [18, 5008], [22, 4994], [24, 4986], [26, 4996], [28, 5012],
      [30, 5016], [33, 5007], [38, 5020], [44, 5030], [50, 5040], [55, 5034], [59, 5038],
    ],
    force: {
      18: { h: 5008 },
      24: { o: 4991, c: 4988, h: 4992, l: 4984 },
      27: { o: 4998, c: 5003, h: 5004, l: 4996 },
      28: { o: 5003, c: 5013, h: 5014, l: 5002 },
      29: { o: 5013, c: 5016, h: 5018, l: 5010 },
      33: { o: 5010, c: 5007, h: 5011, l: 5005 },
      50: { h: 5042 },
    },
  }),
  xLabels: timeLabels(60, 8.5, 5, 12),
  steps: [
    {
      title: "Bias and liquidity",
      caption:
        "The higher timeframe says up, so the draw is the buyside above 5040 (an old high). The sellside at 4990, the morning low, is where the sell stops are. The model waits for the second to be taken before going for the first.",
      annos: [
        { kind: "hline", price: 5040, from: 0, to: 59, label: "buyside liquidity 5040 (the draw)", tone: "mastery", dashed: true },
        { kind: "hline", price: 4990, from: 0, to: 26, label: "sellside liquidity 4990", tone: "danger", dashed: true },
        { kind: "note", at: "tl", text: "Bias: up (daily). So: wait for a sweep of\nsellside, then look for the shift.", tone: "accent" },
      ],
    },
    {
      title: "The sweep",
      caption:
        "At 10:30 price trades through 4990 to 4984. The sell stops are gone. This is the liquidity event the model requires; without it there is no trade, however good the level looks.",
      annos: [{ kind: "marker", bar: 24, price: 4984, label: "sweep of the sellside", tone: "danger", place: "below" }],
    },
    {
      title: "The shift and the gap",
      caption:
        "Bar 28 closes above the short-term high at 5008 with a full body and leaves a gap between bar 27's high (5004) and bar 29's low (5010). Market Structure Shift plus fair value gap: the second and third ingredients, in that order.",
      annos: [
        { kind: "hline", price: 5008, from: 18, to: 28, label: "short-term high", tone: "neutral", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 28, price: 5014, label: "MSS: close above the high", tone: "mastery" },
        { kind: "zone", from: 27, to: 36, low: 5004, high: 5010, label: "FVG", tone: "mastery", labelAt: "bottom-end" },
      ],
    },
    {
      title: "Entry, stop, target",
      caption:
        "Price retraces into the gap at 11:15 and holds. Long in the gap, stop under the sweep low at 4984, target the buyside at 5040. Roughly 23 points of risk for 33 of reward, and every part of the trade was decided before the entry candle printed.",
      annos: [
        { kind: "marker", bar: 33, price: 5006, label: "entry in the FVG", tone: "mastery", place: "below" },
        { kind: "hline", price: 4983, from: 30, to: 44, label: "stop under the sweep", tone: "danger", dashed: true },
        { kind: "arrow", from: [36, 5018], to: [49, 5040], label: "target: the draw", tone: "mastery" },
      ],
    },
  ],
};

export const turtleSoup: Walkthrough = {
  id: "turtle-soup",
  title: "Turtle soup: the failed breakout",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 41,
    bars: 50,
    vol: 0.0009,
    wick: 0.001,
    points: [
      [0, 5010], [10, 4990], [16, 5010], [22, 5020], [28, 5000], [30, 4986], [31, 4996], [36, 5012], [45, 5030], [49, 5026],
    ],
    force: {
      10: { o: 4994, c: 4991, h: 4996, l: 4989 },
      30: { o: 4994, c: 4986, h: 4995, l: 4982 },
      31: { o: 4986, c: 4997, h: 4998, l: 4984 },
    },
  }),
  steps: [
    {
      title: "The 20-bar low",
      caption:
        "The original Turtle rule bought a 20-bar high and sold a 20-bar low. Every breakout system since has some version of it, which means there are always orders waiting just past those levels. Here the 20-bar low is 4989.",
      annos: [
        { kind: "bracket", from: 10, to: 29, price: 5028, label: "20-bar lookback", tone: "neutral" },
        { kind: "hline", price: 4989, from: 10, to: 31, label: "20-bar low 4989", tone: "neutral", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "The breakout",
      caption:
        "Bar 30 breaks below it and closes at 4986. Breakout sellers are in, and the stops of anyone long from the low have been hit. From the outside it looks like the start of a move down.",
      annos: [{ kind: "marker", bar: 30, price: 4982, label: "breaks the low: sellers enter", tone: "danger", place: "below" }],
    },
    {
      title: "The failure",
      caption:
        "Bar 31 closes back above the old low, at 4997. The breakout has failed within one bar. The sellers who entered on the break are now underwater, and their stops sit above. Turtle soup is buying that failure.",
      annos: [{ kind: "marker", bar: 31, price: 4998, label: "closes back above: long", tone: "mastery" }],
    },
    {
      title: "Stop and target",
      caption:
        "Stop just below the breakout wick at 4981; if price goes back through there the failure was itself the fake. Target the middle of the prior range, around 5015, where the first opposing liquidity sits. The edge is the trapped sellers, and it is a fast trade.",
      annos: [
        { kind: "hline", price: 4981, from: 28, to: 40, label: "stop under the wick", tone: "danger", dashed: true },
        { kind: "arrow", from: [33, 5002], to: [38, 5014], label: "target: mid-range", tone: "mastery" },
        { kind: "note", at: "bl", text: "The sell stops under the low were the liquidity.\nThe breakout sellers were the fuel.", tone: "accent" },
      ],
    },
  ],
};

export const marketMakerModel: Walkthrough = {
  id: "market-maker-model",
  title: "The market maker model",
  frame: "1-hour bars, index future, buy model",
  candles: build({
    seed: 42,
    bars: 72,
    vol: 0.0008,
    wick: 0.001,
    points: [
      [0, 5040], [4, 5046], [8, 5036], [12, 5044], [14, 5038], [18, 5018], [22, 5030], [26, 5004], [30, 5012],
      [34, 4992], [36, 4985], [38, 5000], [42, 5014], [44, 5002], [48, 5024], [52, 5016], [56, 5034],
      [60, 5028], [64, 5042], [71, 5040],
    ],
    force: {
      36: { o: 4990, c: 4987, h: 4991, l: 4981 },
      37: { o: 4987, c: 4999, h: 5001, l: 4986 },
    },
  }),
  steps: [
    {
      title: "The original consolidation",
      caption:
        "Everything starts from a consolidation: fourteen bars between 5036 and 5046. The model's claim is that price will leave it, run a programme, and come back to it.",
      annos: [
        { kind: "band", from: 0, to: 14, label: "original consolidation", tone: "neutral" },
        { kind: "zone", from: 0, to: 71, low: 5036, high: 5046, tone: "neutral" },
      ],
    },
    {
      title: "The sell side of the curve",
      caption:
        "Price leaves downward in steps: each rally makes a lower high (5030, then 5012) and each drop makes a lower low. This leg is the sell side of the curve. It is not the trade; it is the setup, engineering sell-side liquidity below every low.",
      annos: [
        { kind: "path", points: [[14, 5038], [22, 5030], [30, 5012], [36, 4985]], label: "lower highs", tone: "danger", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 22, price: 5030, label: "LH", tone: "danger" },
        { kind: "marker", bar: 30, price: 5012, label: "LH", tone: "danger" },
      ],
    },
    {
      title: "The smart money reversal",
      caption:
        "At the bottom, bar 36 sweeps the last low to 4981 and bar 37 displaces back up. That low, into a discount array, is the smart money reversal: the point where the accumulation for the other side is complete.",
      annos: [
        { kind: "marker", bar: 36, price: 4981, label: "SMR: sweep and reverse", tone: "mastery", place: "below" },
        { kind: "hline", price: 4985, from: 34, to: 40, tone: "mastery", dashed: true },
      ],
    },
    {
      title: "The buy side of the curve",
      caption:
        "Now the mirror image: higher lows (5002, 5016, 5028) and higher highs back up through every level that was sold on the way down. Each lower high from the sell side becomes a target on the buy side.",
      annos: [
        { kind: "path", points: [[36, 4985], [44, 5002], [52, 5016], [60, 5028], [64, 5042]], tone: "mastery", dashed: true },
        { kind: "marker", bar: 44, price: 5002, label: "HL", tone: "mastery", place: "below" },
        { kind: "marker", bar: 52, price: 5016, label: "HL", tone: "mastery", place: "below" },
      ],
    },
    {
      title: "Back to the consolidation",
      caption:
        "Price returns to the original consolidation at bar 64 and the model is complete. Reading it live: identify the consolidation, count the lower highs on the way down, wait for the reversal at a discount array, then trade the buy side with the sell side's highs as targets.",
      annos: [
        { kind: "arrow", from: [58, 5030], to: [64, 5040], label: "return to the origin", tone: "mastery" },
        { kind: "note", at: "br", text: "Sell side: lower highs (setup).\nSMR: sweep + displacement (the turn).\nBuy side: higher lows (the trade).", tone: "accent" },
      ],
    },
  ],
};

export const topDownAnalysis: Walkthrough = {
  id: "top-down-analysis",
  title: "Top-down analysis: bias, narrative, confirmation",
  frame: "5-minute bars, index future, with the daily and hourly levels drawn on",
  candles: build({
    seed: 43,
    bars: 60,
    vol: 0.0006,
    wick: 0.0007,
    points: [
      [0, 5022], [6, 5028], [12, 5018], [18, 5016], [24, 5004], [27, 5002], [30, 5018], [34, 5010],
      [40, 5028], [48, 5044], [56, 5060], [59, 5056],
    ],
    force: {
      25: { o: 5006, c: 5003, h: 5008, l: 5000 },
      27: { o: 5002, c: 5004, h: 5006, l: 5001 },
      30: { o: 5010, c: 5019, h: 5020, l: 5009 },
      34: { o: 5012, c: 5010, h: 5013, l: 5008 },
    },
  }),
  xLabels: timeLabels(60, 9.5, 5, 12),
  steps: [
    {
      title: "Daily: the bias and the draw",
      caption:
        "The daily chart answers one question: which way, and towards what? Here the daily is bullish and the nearest untaken liquidity is an old daily high at 5060. That is the bias and the draw. Nothing on the lower timeframes can overrule it.",
      annos: [
        { kind: "hline", price: 5060, from: 0, to: 59, label: "daily: old high, the draw on liquidity", tone: "mastery", dashed: true },
        { kind: "note", at: "tl", text: "Daily → bias: up. Draw: 5060.", tone: "mastery" },
      ],
    },
    {
      title: "Hourly: the narrative",
      caption:
        "The hourly chart answers where. A bullish fair value gap from 5000 to 5008 sits in discount. The narrative is: price should come down into that gap and then go up for the daily high. That is the whole plan before the session starts.",
      annos: [
        { kind: "zone", from: 0, to: 59, low: 5000, high: 5008, label: "1H bullish FVG: the narrative", tone: "accent" },
      ],
    },
    {
      title: "5-minute: the confirmation",
      caption:
        "The 5-minute chart answers when. Price trades into the hourly gap at 11:35 and, at 12:00, closes above the short-term high at 5016 with displacement. That shift is the confirmation that the narrative is playing out.",
      annos: [
        { kind: "marker", bar: 25, price: 5000, label: "into the 1H gap", tone: "accent", place: "below" },
        { kind: "hline", price: 5016, from: 18, to: 30, label: "5m short-term high", tone: "neutral", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 30, price: 5020, label: "5m MSS: confirmation", tone: "mastery" },
      ],
    },
    {
      title: "Entry, stop, target",
      caption:
        "Entry on the 5-minute retrace at 12:20, stop under the hourly gap, target the daily high. Three timeframes, three questions: which way, where, when. Each one narrows the next, and the trade is the intersection.",
      annos: [
        { kind: "marker", bar: 34, price: 5008, label: "entry", tone: "mastery", place: "below" },
        { kind: "hline", price: 4998, from: 30, to: 44, label: "stop under the 1H gap", tone: "danger", dashed: true },
        { kind: "arrow", from: [40, 5030], to: [55, 5058], label: "target: the daily draw", tone: "mastery" },
      ],
    },
  ],
};

export const entryModels = [model2022, turtleSoup, marketMakerModel, topDownAnalysis];
