import { build } from "./synth";
import type { Walkthrough } from "./types";

/** Module 7: PD Arrays. Lessons 29 to 33. */

export const pdArrayMatrix: Walkthrough = {
  id: "pd-array-matrix",
  title: "The PD array matrix",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 29,
    bars: 60,
    vol: 0.001,
    wick: 0.0012,
    points: [
      [0, 5040], [6, 5080], [8, 5066], [10, 5052], [14, 5030], [20, 5000], [22, 5016],
      [24, 5028], [30, 5050], [38, 5036], [45, 5024], [52, 5034], [59, 5030],
    ],
    force: {
      6: { h: 5082 },
      7: { o: 5072, c: 5078, h: 5080, l: 5071 },
      8: { o: 5078, c: 5069, h: 5079, l: 5068 },
      9: { o: 5069, c: 5054, h: 5070, l: 5052 },
      10: { o: 5054, c: 5050, h: 5060, l: 5048 },
      19: { o: 5006, c: 5000, h: 5008, l: 4990 },
      20: { o: 5000, c: 5008, h: 5010, l: 4998 },
      21: { o: 5008, c: 5011, h: 5012, l: 5006 },
      22: { o: 5011, c: 5024, h: 5026, l: 5010 },
      23: { o: 5024, c: 5028, h: 5030, l: 5020 },
    },
  }),
  steps: [
    {
      title: "The range and its equilibrium",
      caption:
        "Start with liquidity. The old high at 5082 has buy stops above it; the old low at 4990 has sell stops below it. Halfway between them, 5036, is equilibrium. Every array on this chart is either above that line or below it.",
      annos: [
        { kind: "hline", price: 5082, from: 6, to: 59, label: "old high: buyside liquidity", tone: "neutral" },
        { kind: "hline", price: 4990, from: 19, to: 59, label: "old low: sellside liquidity", tone: "neutral", labelAt: "start" },
        { kind: "hline", price: 5036, from: 6, to: 59, label: "equilibrium", tone: "accent", dashed: true },
      ],
    },
    {
      title: "Premium arrays",
      caption:
        "Above equilibrium sit the premium arrays, the places you look to sell: the bearish order block (the last up-close candle before the drop, bar 7) and the bearish fair value gap the drop left between bars 8 and 10.",
      annos: [
        { kind: "zone", from: 7, to: 59, low: 5072, high: 5078, label: "bearish order block", tone: "danger" },
        { kind: "zone", from: 8, to: 59, low: 5060, high: 5068, label: "bearish FVG", tone: "danger" },
      ],
    },
    {
      title: "Discount arrays",
      caption:
        "Below equilibrium sit the discount arrays, the places you look to buy: the bullish order block (the last down-close candle before the rally, bar 19) and the bullish fair value gap between bars 21 and 23.",
      annos: [
        { kind: "zone", from: 19, to: 59, low: 5000, high: 5006, label: "bullish order block", tone: "mastery" },
        { kind: "zone", from: 21, to: 59, low: 5012, high: 5020, label: "bullish FVG", tone: "mastery" },
      ],
    },
    {
      title: "Reading the matrix",
      caption:
        "Price is at 5030, just under equilibrium, so it is in discount and the bias is to buy. Rank the arrays by distance from price in the direction of the draw: the bullish FVG comes first, the order block behind it, the old low last. The nearest array is the first place to expect a reaction; if it fails, the next one is the next candidate.",
      annos: [
        { kind: "arrow", from: [59, 5028], to: [59, 5021], label: "nearest discount array", tone: "mastery" },
        { kind: "note", at: "br", text: "Premium: OB → FVG → old high (targets for longs)\nDiscount: FVG → OB → old low (support for longs)", tone: "accent" },
      ],
    },
  ],
};

export const breakerBlock: Walkthrough = {
  id: "breaker-block",
  title: "The bullish breaker block",
  frame: "15-minute bars, index future",
  candles: build({
    seed: 30,
    bars: 56,
    vol: 0.001,
    wick: 0.0011,
    points: [
      [0, 5012], [8, 5000], [14, 5024], [20, 5040], [26, 5018], [34, 4992], [37, 5010],
      [40, 5046], [44, 5060], [49, 5034], [55, 5075],
    ],
    force: {
      8: { l: 4999 },
      19: { o: 5026, c: 5031, h: 5032, l: 5025 },
      20: { o: 5031, c: 5039, h: 5041, l: 5030 },
      21: { o: 5039, c: 5032, h: 5040, l: 5030 },
      34: { o: 4998, c: 4994, h: 4999, l: 4987 },
      40: { o: 5030, c: 5047, h: 5048, l: 5029 },
      49: { o: 5038, c: 5035, h: 5040, l: 5031 },
    },
  }),
  steps: [
    {
      title: "A low, then a high",
      caption:
        "Price puts in a low at 5000 and rallies to a high at 5040. The last up-close candle at that high, bar 20, is a bearish order block by the usual definition: the candle you would expect to sell from if price came back to it.",
      annos: [
        { kind: "marker", bar: 8, price: 4999, label: "low 5000", tone: "neutral", place: "below" },
        { kind: "marker", bar: 20, price: 5041, label: "high 5040", tone: "neutral" },
        { kind: "zone", from: 19, to: 21, low: 5030, high: 5039, label: "bar 20: up-close", tone: "neutral", labelAt: "bottom" },
      ],
    },
    {
      title: "The low is taken",
      caption:
        "Price drops and trades below the 5000 low at bar 34, to 4987. That run below the old low collects the sell stops resting under it. This is the ingredient that separates a breaker from a mitigation block: the low had to be swept.",
      annos: [
        { kind: "hline", price: 5000, from: 8, to: 34, label: "old low", tone: "danger", dashed: true },
        { kind: "marker", bar: 34, price: 4987, label: "lower low: liquidity taken", tone: "danger", place: "below" },
      ],
    },
    {
      title: "Displacement back through the high",
      caption:
        "Then the turn: a large candle at bar 40 closes above the 5040 high. The order block that should have held as resistance has failed, and a failed bearish order block is what a bullish breaker is.",
      annos: [
        { kind: "hline", price: 5040, from: 20, to: 40, label: "the high", tone: "mastery", dashed: true },
        { kind: "marker", bar: 40, price: 5047, label: "displacement through the high", tone: "mastery" },
      ],
    },
    {
      title: "The breaker",
      caption:
        "Extend that up-close candle forward. From now on the zone between 5030 and 5039 is a bullish breaker: the sellers who defended it are trapped, and their exits become the buying that supports price on the way back down to it.",
      annos: [
        { kind: "zone", from: 19, to: 55, low: 5030, high: 5039, label: "bullish breaker", tone: "mastery", labelAt: "top-end" },
        { kind: "note", at: "tl", text: "Breaker = the order block that failed\nafter a liquidity sweep.", tone: "mastery" },
      ],
    },
    {
      title: "The retest",
      caption:
        "Price comes back into the breaker at bar 49, closes inside it and turns. That is the entry: long from the breaker, stop below it, target the next liquidity above. A breaker without a retest is just a pattern you noticed too late.",
      annos: [
        { kind: "marker", bar: 49, price: 5031, label: "retest of the breaker: long", tone: "mastery", place: "below" },
        { kind: "arrow", from: [51, 5045], to: [55, 5072], label: "target above", tone: "mastery" },
      ],
    },
  ],
};

export const mitigationBlock: Walkthrough = {
  id: "mitigation-block",
  title: "The mitigation block",
  frame: "15-minute bars, index future",
  candles: build({
    seed: 31,
    bars: 56,
    vol: 0.001,
    wick: 0.0011,
    points: [
      [0, 5012], [8, 5000], [14, 5024], [20, 5040], [26, 5020], [34, 5006], [37, 5016],
      [40, 5046], [44, 5060], [49, 5034], [55, 5075],
    ],
    force: {
      8: { l: 4999 },
      19: { o: 5026, c: 5031, h: 5032, l: 5025 },
      20: { o: 5031, c: 5039, h: 5041, l: 5030 },
      21: { o: 5039, c: 5032, h: 5040, l: 5030 },
      34: { o: 5010, c: 5006, h: 5011, l: 5004 },
      40: { o: 5030, c: 5047, h: 5048, l: 5029 },
      49: { o: 5038, c: 5035, h: 5040, l: 5031 },
    },
  }),
  steps: [
    {
      title: "The same shape, one difference",
      caption:
        "Low at 5000, high at 5040, and the last up-close candle at the high. Watch what the pullback does to the old low this time.",
      annos: [
        { kind: "marker", bar: 8, price: 4999, label: "low 5000", tone: "neutral", place: "below" },
        { kind: "marker", bar: 20, price: 5041, label: "high 5040", tone: "neutral" },
        { kind: "zone", from: 19, to: 21, low: 5030, high: 5039, label: "bar 20: up-close", tone: "neutral", labelAt: "bottom" },
      ],
    },
    {
      title: "The low is not taken",
      caption:
        "The pullback bottoms at 5004, a higher low. No sweep, no stops collected. That absence is the whole difference between this and a breaker.",
      annos: [
        { kind: "hline", price: 5000, from: 8, to: 36, label: "old low, untouched", tone: "neutral", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 34, price: 5004, label: "higher low: no sweep", tone: "warning", place: "below" },
      ],
    },
    {
      title: "Displacement through the high",
      caption:
        "Price then displaces through 5040 just as before. The up-close candle at the high failed as resistance, so it becomes support, but because no liquidity was taken it is called a mitigation block, and it tends to be the weaker of the two.",
      annos: [
        { kind: "marker", bar: 40, price: 5047, label: "displacement through the high", tone: "mastery" },
        { kind: "zone", from: 19, to: 55, low: 5030, high: 5039, label: "mitigation block", tone: "accent", labelAt: "top-end" },
      ],
    },
    {
      title: "Use it the same way, trust it less",
      caption:
        "Retest at bar 49, long from the block, stop below it. The rule of thumb: a breaker with a sweep behind it is a first-choice array; a mitigation block is a second choice that wants extra confluence, like a fair value gap in the same place.",
      annos: [
        { kind: "marker", bar: 49, price: 5031, label: "retest: long, with confluence", tone: "accent", place: "below" },
        { kind: "note", at: "tl", text: "Breaker: sweep, then break. Strong.\nMitigation: no sweep, then break. Weaker.", tone: "accent" },
      ],
    },
  ],
};

export const rejectionBlock: Walkthrough = {
  id: "rejection-block",
  title: "The rejection block",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 311,
    bars: 56,
    vol: 0.001,
    wick: 0.001,
    points: [
      [0, 5000], [10, 5024], [20, 5040], [24, 5046], [27, 5044], [32, 5020], [38, 5012],
      [44, 5040], [48, 5024], [55, 4996],
    ],
    force: {
      24: { o: 5042, c: 5047, h: 5061, l: 5040 },
      25: { o: 5047, c: 5044, h: 5064, l: 5042 },
      26: { o: 5044, c: 5048, h: 5060, l: 5043 },
      27: { o: 5048, c: 5042, h: 5058, l: 5040 },
      44: { o: 5036, c: 5041, h: 5057, l: 5034 },
      45: { o: 5041, c: 5030, h: 5044, l: 5028 },
    },
  }),
  steps: [
    {
      title: "Wicks at the high",
      caption:
        "Four candles in a row push up to 5058 to 5064 and every one of them closes back down, leaving long upper wicks. The bodies never get above 5048. Those wicks are where sellers absorbed the buying.",
      annos: [
        { kind: "marker", bar: 25, price: 5064, label: "wick highs", tone: "neutral" },
        { kind: "hline", price: 5048, from: 22, to: 30, label: "highest body close 5048", tone: "neutral", dashed: true },
      ],
    },
    {
      title: "The rejection block",
      caption:
        "The rejection block is the zone from the highest body (5048) up to the highest wick (5064). Treat the wicks as a filled block: the whole band is where price was refused, and it stays relevant after price leaves.",
      annos: [{ kind: "zone", from: 24, to: 55, low: 5048, high: 5064, label: "rejection block: bodies to wick high", tone: "danger", labelAt: "bottom-end" }],
    },
    {
      title: "Return and reject",
      caption:
        "When price comes back at bar 44 it trades up into the wicks, to 5057, and closes back below the bodies. A short from inside the block, stop above the wick high, target the low it came from.",
      annos: [
        { kind: "marker", bar: 44, price: 5057, label: "back into the wicks: short", tone: "danger" },
        { kind: "hline", price: 5066, from: 40, to: 55, label: "stop above the wick high", tone: "danger", dashed: true },
        { kind: "arrow", from: [47, 5030], to: [54, 5000], label: "target the prior low", tone: "danger" },
      ],
    },
  ],
};

export const inversionFvg: Walkthrough = {
  id: "inversion-fvg",
  title: "The inversion fair value gap",
  frame: "5-minute bars, index future",
  candles: build({
    seed: 32,
    bars: 60,
    vol: 0.0008,
    wick: 0.0009,
    points: [
      [0, 4996], [8, 5004], [10, 5008], [12, 5022], [18, 5040], [24, 5026], [28, 5004],
      [32, 4996], [36, 5011], [40, 5000], [48, 4988], [59, 4980],
    ],
    force: {
      10: { o: 5004, c: 5009, h: 5010, l: 5003 },
      11: { o: 5009, c: 5020, h: 5021, l: 5008 },
      12: { o: 5020, c: 5023, h: 5025, l: 5018 },
      28: { o: 5016, c: 5004, h: 5017, l: 5002 },
      36: { o: 5008, c: 5011, h: 5017, l: 5006 },
      37: { o: 5011, c: 5002, h: 5012, l: 5000 },
    },
  }),
  steps: [
    {
      title: "A bullish fair value gap",
      caption:
        "The rally at bars 10 to 12 leaves a gap between bar 10's high (5010) and bar 12's low (5018). While price respects it from above, that gap is support: a discount array to buy from.",
      annos: [{ kind: "zone", from: 10, to: 26, low: 5010, high: 5018, label: "bullish FVG: support while it holds", tone: "mastery" }],
    },
    {
      title: "The gap fails",
      caption:
        "At bar 28 price does not bounce. It closes straight through the gap, at 5004, below the whole thing. A fair value gap that is closed through has failed, and a failed gap flips its role.",
      annos: [{ kind: "marker", bar: 28, price: 5004, label: "close through the gap", tone: "danger", place: "below" }],
    },
    {
      title: "Inversion",
      caption:
        "The same 5010 to 5018 band is now an inversion fair value gap: resistance instead of support. The buyers who bought the gap are trapped above it, and their selling is what makes the retest hold.",
      annos: [{ kind: "zone", from: 28, to: 59, low: 5010, high: 5018, label: "inversion FVG: now resistance", tone: "danger", labelAt: "bottom-end" }],
    },
    {
      title: "The retest from below",
      caption:
        "Bar 36 wicks up into the inverted gap and bar 37 closes back below it. Short on the rejection, stop above the gap, target the low that started the whole sequence.",
      annos: [
        { kind: "marker", bar: 36, price: 5017, label: "retest from below: short", tone: "danger" },
        { kind: "arrow", from: [40, 4998], to: [58, 4982], label: "target the origin", tone: "danger" },
      ],
    },
  ],
};

export const unicorn: Walkthrough = {
  id: "unicorn",
  title: "The unicorn: breaker plus fair value gap",
  frame: "15-minute bars, index future",
  candles: build({
    seed: 322,
    bars: 56,
    vol: 0.001,
    wick: 0.0011,
    points: [
      [0, 5012], [8, 5000], [14, 5024], [18, 5040], [24, 5018], [30, 4990], [33, 5008],
      [36, 5030], [38, 5044], [42, 5060], [47, 5036], [55, 5080],
    ],
    force: {
      8: { l: 4999 },
      17: { o: 5026, c: 5031, h: 5032, l: 5025 },
      18: { o: 5031, c: 5039, h: 5041, l: 5030 },
      19: { o: 5039, c: 5032, h: 5040, l: 5030 },
      30: { o: 4996, c: 4992, h: 4997, l: 4986 },
      36: { o: 5026, c: 5031, h: 5034, l: 5025 },
      37: { o: 5031, c: 5046, h: 5047, l: 5030 },
      38: { o: 5046, c: 5044, h: 5048, l: 5040 },
      47: { o: 5040, c: 5036, h: 5041, l: 5034 },
    },
  }),
  steps: [
    {
      title: "The breaker",
      caption:
        "Low at 5000, high at 5040, the low swept at bar 30 (down to 4986), then displacement back through the high. The up-close candle at the high, 5030 to 5039, is a bullish breaker.",
      annos: [
        { kind: "marker", bar: 30, price: 4986, label: "sweep of the low", tone: "danger", place: "below" },
        { kind: "zone", from: 17, to: 55, low: 5030, high: 5039, label: "bullish breaker", tone: "accent" },
      ],
    },
    {
      title: "The fair value gap",
      caption:
        "The displacement candle at bar 37 leaves a gap between bar 36's high (5034) and bar 38's low (5040). On its own that gap is a bullish fair value gap, another discount array.",
      annos: [{ kind: "zone", from: 36, to: 55, low: 5034, high: 5040, label: "bullish FVG", tone: "mastery" }],
    },
    {
      title: "Where they overlap",
      caption:
        "The breaker and the gap share the band from 5034 to 5039. Two independent reasons for price to hold in the same place: that overlap is the unicorn. It is not a new pattern, it is agreement between two you already know.",
      annos: [
        { kind: "zone", from: 36, to: 55, low: 5034, high: 5039, label: "unicorn: breaker ∩ FVG", tone: "mastery", labelAt: "top-end" },
        { kind: "note", at: "tl", text: "Breaker alone: good.\nFVG alone: good.\nSame price: better.", tone: "mastery" },
      ],
    },
    {
      title: "Entry",
      caption:
        "Price returns into the overlap at bar 47 and holds. Long from the unicorn, stop under the breaker's low at 5030, target the liquidity above the recent high.",
      annos: [
        { kind: "marker", bar: 47, price: 5034, label: "entry in the overlap", tone: "mastery", place: "below" },
        { kind: "hline", price: 5029, from: 50, to: 55, label: "stop", tone: "danger", dashed: true },
        { kind: "arrow", from: [49, 5050], to: [55, 5078], label: "target", tone: "mastery" },
      ],
    },
  ],
};

export const openingGaps: Walkthrough = {
  id: "opening-gaps",
  title: "Opening gaps: NWOG and NDOG",
  frame: "1-hour bars across a weekend, index future",
  candles: build({
    seed: 33,
    bars: 48,
    vol: 0.0009,
    wick: 0.001,
    points: [
      [0, 4988], [8, 5006], [14, 4996], [19, 5000], [20, 5028], [24, 5036], [30, 5050],
      [35, 5030], [40, 5012], [43, 5022], [47, 5040],
    ],
    force: {
      19: { o: 5003, c: 5000, h: 5005, l: 4998 },
      20: { o: 5024, c: 5029, h: 5031, l: 5022 },
      40: { o: 5016, c: 5013, h: 5018, l: 5011 },
      41: { o: 5013, c: 5020, h: 5022, l: 5012 },
    },
  }),
  xLabels: { 0: "Thu 22:00", 8: "Fri 06:00", 16: "Fri 14:00", 22: "Sun 20:00", 30: "Mon 04:00", 40: "Mon 14:00" },
  steps: [
    {
      title: "Friday close, Sunday open",
      caption:
        "The week closes at 17:00 on Friday at 5000. When trading resumes at 18:00 on Sunday the first print is 5024. Nothing traded in between, so those 24 points are a hole in the delivery.",
      annos: [
        { kind: "vline", bar: 20, label: "Sunday 18:00 open", tone: "accent" },
        { kind: "marker", bar: 19, price: 5000, label: "Friday close 5000", tone: "neutral", place: "below" },
        { kind: "marker", bar: 20, price: 5029, label: "Sunday open 5024", tone: "neutral" },
      ],
    },
    {
      title: "The New Week Opening Gap",
      caption:
        "Box the gap from Friday's close to Sunday's open and carry it forward. That is the NWOG. Price tends to come back to it, and the more recent gaps carry more weight than old ones.",
      annos: [{ kind: "zone", from: 19, to: 47, low: 5000, high: 5024, label: "NWOG", tone: "accent", labelAt: "bottom-end" }],
    },
    {
      title: "Consequent encroachment",
      caption:
        "The midpoint of the gap, 5012, is its consequent encroachment. Reactions inside a gap most often happen at the midpoint or at its edges, so those three prices are the ones you draw.",
      annos: [{ kind: "hline", price: 5012, from: 19, to: 47, label: "consequent encroachment (50%)", tone: "accent", dashed: true }],
    },
    {
      title: "The return",
      caption:
        "After rallying to 5050, price comes back on Monday afternoon, trades into the midpoint at bar 40 and turns up from it. The gap acted as the draw and then as support. The New Day Opening Gap works the same way on the 17:00 close to 18:00 open of every session day.",
      annos: [
        { kind: "marker", bar: 40, price: 5011, label: "reaction at CE", tone: "mastery", place: "below" },
        { kind: "note", at: "tr", text: "NDOG: same idea, one day apart\n(17:00 close → 18:00 open, ET).", tone: "accent" },
      ],
    },
  ],
};

export const pdArrays = [pdArrayMatrix, breakerBlock, mitigationBlock, rejectionBlock, inversionFvg, unicorn, openingGaps];
