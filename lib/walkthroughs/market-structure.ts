import { build } from "./synth";
import type { Walkthrough } from "./types";

/** Module 6: Market Structure & Delivery. Lessons 26, 27, 28. */

export const bosChochMss: Walkthrough = {
  id: "bos-choch-mss",
  title: "Break of Structure, Change of Character, Market Structure Shift",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 26,
    bars: 56,
    vol: 0.0012,
    wick: 0.0012,
    points: [
      [0, 5000], [8, 5040], [14, 5018], [20, 5044], [22, 5062], [28, 5038], [34, 5058],
      [38, 5046], [40, 5024], [44, 5012], [46, 5028], [50, 5005], [55, 4998],
    ],
    force: {
      20: { o: 5034, c: 5045, h: 5046, l: 5033 },
      39: { o: 5048, c: 5044, h: 5050, l: 5041 },
      40: { o: 5044, c: 5024, h: 5045, l: 5022 },
      41: { o: 5024, c: 5018, h: 5030, l: 5015 },
    },
  }),
  steps: [
    {
      title: "Swing points",
      caption:
        "An uptrend is a series of higher highs and higher lows. Mark them before anything else: H1 and H2 are the swing highs, L1 and L2 the higher lows that protected the move up.",
      annos: [
        { kind: "path", points: [[0, 5000], [8, 5040], [14, 5018], [22, 5062], [28, 5038], [34, 5058]], tone: "neutral", dashed: true },
        { kind: "marker", bar: 8, price: 5040, label: "H1", tone: "neutral" },
        { kind: "marker", bar: 14, price: 5018, label: "L1 (HL)", tone: "neutral", place: "below" },
        { kind: "marker", bar: 22, price: 5062, label: "H2 (HH)", tone: "neutral" },
        { kind: "marker", bar: 28, price: 5038, label: "L2 (HL)", tone: "neutral", place: "below" },
      ],
    },
    {
      title: "Break of Structure",
      caption:
        "At bar 20 a candle closes above H1. That is a Break of Structure: the trend confirms itself by taking out its own last high. A BOS is continuation, not a warning.",
      annos: [
        { kind: "hline", price: 5040, from: 8, to: 20, tone: "mastery", dashed: true },
        { kind: "marker", bar: 20, price: 5045, label: "BOS: close above H1", tone: "mastery" },
      ],
    },
    {
      title: "A lower high",
      caption:
        "The next rally stalls at 5058, under H2. A lower high on its own proves nothing, but it is the first hint the buyers are running out of room.",
      annos: [
        { kind: "hline", price: 5062, from: 22, to: 36, tone: "neutral", dashed: true },
        { kind: "marker", bar: 34, price: 5058, label: "LH", tone: "warning" },
      ],
    },
    {
      title: "Change of Character",
      caption:
        "At bar 40 price closes below L2, the last higher low. That is the Change of Character: the first break against the trend. A CHoCH says the character of the move has changed, not yet that a new trend is confirmed.",
      annos: [
        { kind: "hline", price: 5038, from: 28, to: 40, label: "L2", tone: "danger", dashed: true },
        { kind: "marker", bar: 40, price: 5024, label: "CHoCH: close below L2", tone: "danger", place: "below" },
      ],
    },
    {
      title: "Displacement makes it a Market Structure Shift",
      caption:
        "Look at how the break happened. One large-bodied candle left a gap between bar 39's low and bar 41's high: a fair value gap. A break with displacement like this is a Market Structure Shift. The same break made of small, overlapping candles would just be a break.",
      annos: [
        { kind: "zone", from: 39, to: 41, low: 5030, high: 5041, label: "FVG left by the displacement", tone: "danger" },
        { kind: "note", at: "tr", text: "Break + displacement + gap = MSS.\nA break without displacement is noise.", tone: "danger" },
      ],
    },
    {
      title: "Internal versus external structure",
      caption:
        "The little swings inside the leg from L2 to the lower high are internal structure; L2 itself is external. Breaks of internal structure happen all the time. The break that changes the trend is the one through the external low, and price then returns to the gap before continuing down.",
      annos: [
        { kind: "band", from: 28, to: 34, label: "internal structure", tone: "neutral", labelAt: "bottom" },
        { kind: "arrow", from: [46, 5028], to: [54, 5000], label: "retrace into the FVG, then continuation", tone: "danger" },
      ],
    },
  ],
};

export const fourPhases: Walkthrough = {
  id: "four-phases",
  title: "The four phases of price delivery",
  frame: "15-minute bars, index future",
  candles: build({
    seed: 27,
    bars: 64,
    vol: 0.0009,
    wick: 0.001,
    points: [
      [0, 5000], [4, 5006], [8, 4996], [12, 5004], [16, 4999], [17, 5012], [19, 5030], [24, 5042],
      [30, 5050], [36, 5034], [40, 5027], [46, 5048], [50, 5062], [52, 5064], [54, 5040], [58, 5022], [63, 5010],
    ],
    force: {
      17: { o: 4999, c: 5014, h: 5015, l: 4998 },
      18: { o: 5014, c: 5028, h: 5029, l: 5013 },
      52: { o: 5060, c: 5058, h: 5069, l: 5057 },
      54: { o: 5056, c: 5040, h: 5057, l: 5038 },
    },
  }),
  steps: [
    {
      title: "Consolidation",
      caption:
        "For sixteen bars price goes nowhere: a tight range between 4996 and 5006. Consolidation is where orders build up on both sides. Nothing has been decided yet.",
      annos: [
        { kind: "band", from: 0, to: 16, label: "1. consolidation", tone: "neutral" },
        { kind: "zone", from: 0, to: 16, low: 4996, high: 5006, tone: "neutral" },
      ],
    },
    {
      title: "Expansion",
      caption:
        "Then it leaves. Two large candles at bars 17 and 18 carry price 30 points in half an hour and leave a fair value gap behind them. Expansion is the phase with displacement; it sets the direction the other phases refer back to.",
      annos: [
        { kind: "band", from: 16, to: 30, label: "2. expansion", tone: "mastery" },
        { kind: "zone", from: 17, to: 19, low: 5015, high: 5024, label: "FVG", tone: "mastery" },
      ],
    },
    {
      title: "Retracement",
      caption:
        "Price comes back into the leg it just made: roughly to the halfway point, and into the gap. Retracement is not reversal. The expansion's low is untouched, so the direction still stands.",
      annos: [
        { kind: "band", from: 30, to: 40, label: "3. retracement", tone: "accent" },
        { kind: "hline", price: 5025, from: 16, to: 40, label: "50% of the leg", tone: "accent", dashed: true },
        { kind: "marker", bar: 40, price: 5027, label: "holds the gap and the midpoint", tone: "accent", place: "below" },
      ],
    },
    {
      title: "Reversal",
      caption:
        "After a second push up, bar 52 runs above the high and fails, and bar 54 displaces back down through the recent low. That is reversal: the move that ends the delivery, and usually the start of a new consolidation or expansion the other way. The four phases repeat on every timeframe.",
      annos: [
        { kind: "band", from: 50, to: 63, label: "4. reversal", tone: "danger", labelAt: "bottom" },
        { kind: "marker", bar: 52, price: 5069, label: "sweep of the high", tone: "danger" },
        { kind: "marker", bar: 54, price: 5040, label: "displacement down", tone: "danger", place: "below" },
      ],
    },
  ],
};

export const premiumDiscountOte: Walkthrough = {
  id: "premium-discount-ote",
  title: "Premium, discount and the Optimal Trade Entry",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 28,
    bars: 48,
    vol: 0.001,
    wick: 0.0012,
    points: [
      [0, 4975], [6, 4950], [12, 4985], [18, 5020], [24, 5050], [28, 5030], [32, 4992], [34, 4975],
      [37, 4995], [41, 5030], [47, 5080],
    ],
    force: {
      6: { l: 4948 },
      24: { h: 5052 },
      34: { o: 4982, c: 4976, h: 4984, l: 4972 },
    },
  }),
  steps: [
    {
      title: "The dealing range",
      caption:
        "Everything is measured from a dealing range: the last clear swing low to the last clear swing high. Here that is 4950 up to 5050, one hundred points.",
      annos: [
        { kind: "hline", price: 4950, from: 6, to: 47, label: "range low 4950", tone: "neutral" },
        { kind: "hline", price: 5050, from: 24, to: 47, label: "range high 5050", tone: "neutral" },
        { kind: "marker", bar: 6, price: 4948, label: "swing low", tone: "neutral", place: "below" },
        { kind: "marker", bar: 24, price: 5052, label: "swing high", tone: "neutral" },
      ],
    },
    {
      title: "Equilibrium",
      caption:
        "Halfway is equilibrium, 5000. Above it price is expensive relative to the range; below it, cheap. This single line is the whole idea.",
      annos: [{ kind: "hline", price: 5000, from: 6, to: 47, label: "equilibrium (50%)", tone: "accent", dashed: true }],
    },
    {
      title: "Premium and discount",
      caption:
        "The upper half is premium, where you look to sell. The lower half is discount, where you look to buy. In an uptrend you wait for price to come back into discount rather than buying it in premium.",
      annos: [
        { kind: "zone", from: 27, to: 47, low: 5000, high: 5050, label: "premium: look to sell", tone: "danger", labelAt: "inside" },
        { kind: "zone", from: 27, to: 47, low: 4950, high: 5000, label: "discount: look to buy", tone: "mastery", labelAt: "inside" },
      ],
    },
    {
      title: "The OTE band",
      caption:
        "Inside discount, the Optimal Trade Entry is the 62 to 79 percent retracement of the leg: here 4988 down to 4971. Deep enough to be cheap, shallow enough that the low that defines the range is still protected.",
      annos: [
        { kind: "zone", from: 26, to: 40, low: 4971, high: 4988, label: "OTE: 62% to 79% retracement", tone: "mastery", labelAt: "bottom" },
        { kind: "hline", price: 4988, from: 26, to: 40, tone: "mastery", dashed: true },
        { kind: "hline", price: 4971, from: 26, to: 40, tone: "mastery", dashed: true },
      ],
    },
    {
      title: "Entry, stop, target",
      caption:
        "Price trades into the band at bar 34 and turns. The entry is in the OTE, the stop sits under the range low so a sweep of the low is the one thing that proves you wrong, and the target is the buyside liquidity resting above the old high.",
      annos: [
        { kind: "marker", bar: 34, price: 4976, label: "entry in the OTE", tone: "mastery", place: "below" },
        { kind: "hline", price: 4946, from: 30, to: 47, label: "stop under the range low", tone: "danger", dashed: true, labelAt: "start" },
        { kind: "arrow", from: [38, 5000], to: [46, 5076], label: "target: buyside above the old high", tone: "mastery" },
      ],
    },
  ],
};

export const marketStructure = [bosChochMss, fourPhases, premiumDiscountOte];
