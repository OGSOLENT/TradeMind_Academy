import { build, timeLabels } from "./synth";
import type { Walkthrough } from "./types";

/**
 * Module 11: The Fractal Model. Lessons 16 to 19 (recorded) and 49 to 54.
 * The projections follow Lesson 17: the manipulation leg is anchored with
 * 1 at the swept extreme and 0 at the level it came from, so -1, -2 and
 * -2.5 sit beyond that level in the direction of the expansion.
 */

export const tSpot: Walkthrough = {
  id: "t-spot",
  title: "The T-Spot: anticipating the higher-timeframe wick",
  frame: "5-minute bars inside two 1-hour candles, index future, bias up",
  candles: build({
    seed: 16,
    bars: 24,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5006], [3, 5000], [6, 5010], [9, 5016], [11, 5014], [12, 5013], [15, 5006], [17, 5003],
      [19, 5012], [21, 5020], [23, 5028],
    ],
    force: {
      3: { l: 4999 },
      11: { o: 5015, c: 5014, h: 5017, l: 5013 },
      12: { o: 5014, c: 5012, h: 5015, l: 5010 },
      17: { o: 5005, c: 5003, h: 5006, l: 5001 },
      19: { o: 5006, c: 5013, h: 5014, l: 5005 },
    },
  }),
  xLabels: timeLabels(24, 9, 5, 6),
  steps: [
    {
      title: "The previous hourly candle",
      caption:
        "The 09:00 hourly candle (the first twelve bars) opened at 5006, dipped to 4999 and closed at 5014: a bullish candle whose range is 4999 to 5017. Its midpoint is 5008. The next hourly candle will be read against it.",
      annos: [
        { kind: "band", from: 0, to: 11, label: "09:00 hourly candle", tone: "neutral" },
        { kind: "hline", price: 5008, from: 0, to: 23, label: "previous candle 50%", tone: "neutral", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "The T-Spot",
      caption:
        "With the bias up, the 10:00 candle is expected to make its low, its wick, before it expands. The T-Spot is the zone where that wick should form: below the 10:00 open, down to about the previous candle's midpoint. You wait there instead of chasing.",
      annos: [
        { kind: "vline", bar: 12, label: "10:00 open", tone: "accent" },
        { kind: "zone", from: 12, to: 23, low: 5001, high: 5010, label: "T-Spot: expected wick zone", tone: "accent" },
      ],
    },
    {
      title: "The wick forms",
      caption:
        "At 10:25 price is in the zone, at 5001, and the run down has left a series of down-close 5-minute candles. This is the wick of the hourly candle being made, early in the candle, which is exactly what an expansion candle does.",
      annos: [{ kind: "marker", bar: 17, price: 5001, label: "wick forming in the T-Spot", tone: "warning", place: "below" }],
    },
    {
      title: "CISD, then expansion",
      caption:
        "At 10:35 a 5-minute candle closes above the open of the run down: change in the state of delivery. A protected low now exists at 5001 and the hourly candle expands out of its wick, closing near 5028. You entered at the wick, not halfway up the body.",
      annos: [
        { kind: "marker", bar: 19, price: 5013, label: "5m CISD", tone: "mastery" },
        { kind: "arrow", from: [20, 5016], to: [23, 5027], label: "the expansion", tone: "mastery" },
      ],
    },
  ],
};

export const stdProjections: Walkthrough = {
  id: "std-projections",
  title: "Standard deviation projections from the manipulation leg",
  frame: "15-minute bars, index future",
  candles: build({
    seed: 17,
    bars: 40,
    vol: 0.0008,
    wick: 0.0009,
    points: [
      [0, 5022], [6, 5032], [10, 5040], [13, 5024], [16, 5010], [18, 5018], [19, 5034], [24, 5052],
      [27, 5046], [32, 5078], [36, 5102], [39, 5094],
    ],
    force: {
      10: { h: 5040 },
      16: { o: 5014, c: 5011, h: 5015, l: 5010 },
      19: { o: 5020, c: 5035, h: 5036, l: 5019 },
      36: { h: 5104 },
    },
  }),
  steps: [
    {
      title: "The manipulation leg",
      caption:
        "The leg that made the setup runs from the preceding high at 5040 down to the swept low at 5010: thirty points. That leg is what you measure. Anchor 0 at the high it came from and 1 at the low it made.",
      annos: [
        { kind: "marker", bar: 10, price: 5040, label: "0: preceding high 5040", tone: "neutral" },
        { kind: "marker", bar: 16, price: 5010, label: "1: swept low 5010", tone: "danger", place: "below" },
        { kind: "bracket", from: 10, to: 16, price: 4998, label: "manipulation leg: 30 points", tone: "danger" },
      ],
    },
    {
      title: "CISD completes the leg",
      caption:
        "You don't measure until the leg is finished. At bar 19 a candle closes above the open of the run down: change in the state of delivery. The low at 5010 is the extreme of the leg, and the projections can be drawn.",
      annos: [{ kind: "marker", bar: 19, price: 5035, label: "CISD: the leg is complete", tone: "mastery" }],
    },
    {
      title: "The ladder",
      caption:
        "Project the leg beyond the 0 anchor. −1 is one leg above the high, 5070. −2 is 5100, and −2.5 is 5115. Target 1 is −1, a sensible partial. The primary target is −2 to −2.5, where a normal expansion completes.",
      annos: [
        { kind: "hline", price: 5070, from: 19, to: 39, label: "−1 target 1: 5070", tone: "accent", dashed: true, labelAt: "start" },
        { kind: "hline", price: 5100, from: 19, to: 39, label: "−2 primary: 5100", tone: "mastery", dashed: true, labelAt: "start" },
        { kind: "hline", price: 5115, from: 19, to: 39, label: "−2.5: 5115", tone: "mastery", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "The expansion reaches −2",
      caption:
        "Price takes −1 at bar 30 and reaches the primary target at bar 36. A bigger manipulation leg would have licensed the −4 rung; this one was modest, so −2 was the realistic objective and it was met. The leg sized the target instead of a guess.",
      annos: [
        { kind: "marker", bar: 30, price: 5070, label: "−1 taken", tone: "accent" },
        { kind: "marker", bar: 36, price: 5104, label: "−2 reached", tone: "mastery" },
        { kind: "note", at: "br", text: "Big manipulation leg → the −4 rung is in play.\nSmall leg → −2 is the job. Size the target to the leg.", tone: "accent" },
      ],
    },
  ],
};

export const fractalTargets: Walkthrough = {
  id: "fractal-targets",
  title: "Fractal targets: untaken swings on the higher timeframe",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 18,
    bars: 60,
    vol: 0.0009,
    wick: 0.001,
    points: [
      [0, 5020], [8, 5046], [14, 5030], [20, 5050], [26, 5028], [32, 5012], [36, 5004], [40, 5024],
      [44, 5036], [48, 5040], [52, 5052], [56, 5068], [59, 5064],
    ],
    force: {
      8: { h: 5047 },
      20: { h: 5051 },
      36: { l: 5002 },
      44: { h: 5038 },
      46: { h: 5044 },
      56: { h: 5070 },
    },
  }),
  steps: [
    {
      title: "Look up, not forward",
      caption:
        "After the low at bar 36 and its CISD, the question is where price goes. Instead of only projecting the leg, look at what the higher timeframe has left untaken. Two swing highs are above: 5047 from bar 8 and 5051 from bar 20.",
      annos: [
        { kind: "marker", bar: 8, price: 5047, label: "swing high 5047", tone: "neutral", place: "below" },
        { kind: "marker", bar: 20, price: 5051, label: "swing high 5051", tone: "neutral", place: "below" },
        { kind: "marker", bar: 36, price: 5002, label: "the low, CISD confirmed", tone: "mastery", place: "below" },
      ],
    },
    {
      title: "Taken versus untaken",
      caption:
        "The 5047 high was already traded through at bar 20, so its liquidity is spent: it's a level, not a magnet. The 5051 high has never been taken. Only the untaken swing is a target.",
      annos: [
        { kind: "hline", price: 5047, from: 8, to: 20, label: "taken at bar 20: spent", tone: "neutral", dashed: true, labelAt: "start" },
        { kind: "hline", price: 5051, from: 20, to: 59, label: "untaken: the fractal target", tone: "mastery", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "Consolidation on the way is fine",
      caption:
        "Between bars 40 and 50 price chops sideways under 5044. That doesn't invalidate the target; price doesn't need a clean path. The rule is about where the liquidity is, not how tidy the route looks.",
      annos: [{ kind: "band", from: 40, to: 50, label: "consolidation: doesn't cancel the target", tone: "neutral", labelAt: "bottom" }],
    },
    {
      title: "The target is reached",
      caption:
        "Price takes the 5051 high at bar 52 and runs on to 5070. The untaken swing did its job as the draw. Note the SMT exception from the lesson: if a correlated market had already taken its equivalent high, you'd have doubted this one.",
      annos: [
        { kind: "marker", bar: 52, price: 5052, label: "target taken", tone: "mastery" },
        { kind: "arrow", from: [46, 5030], to: [51, 5048], label: "the draw", tone: "mastery" },
      ],
    },
  ],
};

export const ttfmPlaybook: Walkthrough = {
  id: "ttfm-playbook",
  title: "The playbook: daily bias, 4-hour wick, 15-minute execution",
  frame: "15-minute bars across one 4-hour candle, index future, daily Candle 2 closure behind it",
  candles: build({
    seed: 19,
    bars: 32,
    vol: 0.0006,
    wick: 0.0007,
    points: [
      [0, 5020], [4, 5012], [7, 5004], [9, 5008], [11, 5018], [14, 5024], [18, 5022], [22, 5034],
      [26, 5044], [31, 5050],
    ],
    force: {
      7: { o: 5006, c: 5004, h: 5008, l: 5000 },
      11: { o: 5010, c: 5019, h: 5020, l: 5009 },
    },
  }),
  xLabels: timeLabels(32, 8, 15, 4),
  steps: [
    {
      title: "Step 1: the daily bias",
      caption:
        "Yesterday's daily candle swept the previous day's low and closed back above it: a daily Candle 2 closure. That sets the expectation of expansion higher today. No daily closure, no bias, no trade.",
      annos: [{ kind: "note", at: "tl", text: "Daily: Candle 2 closure yesterday → bias up.", tone: "mastery" }],
    },
    {
      title: "Step 2: the 4-hour wick",
      caption:
        "This 4-hour candle opened at 08:00 at 5020. With the bias up, it should make its wick first. The T-Spot is the zone below the open where that wick is expected, and you wait for price to trade into it rather than buying the open.",
      annos: [
        { kind: "band", from: 0, to: 15, label: "08:00 to 12:00: the 4-hour candle", tone: "neutral", labelAt: "bottom" },
        { kind: "zone", from: 0, to: 15, low: 5000, high: 5012, label: "4H T-Spot", tone: "accent" },
        { kind: "marker", bar: 7, price: 5000, label: "the 4H wick, 09:45", tone: "warning" },
      ],
    },
    {
      title: "Step 3: the 15-minute execution",
      caption:
        "At 10:45 a 15-minute candle closes above the open of the run down into the wick: CISD on the execution timeframe, protected low at 5000. Entry on that close, stop under 5000, and the 4-hour candle does the rest.",
      annos: [
        { kind: "marker", bar: 11, price: 5019, label: "15m CISD: execute", tone: "mastery" },
        { kind: "hline", price: 4998, from: 9, to: 20, label: "stop under the protected low", tone: "danger", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "The governing rule",
      caption:
        "The daily said which way, the 4-hour said when the pullback was done, the 15-minute said at what price. Each timeframe sits inside the last. The 4-hour candle closes at 12:00 as an expansion candle, and the next one continues into the projections.",
      annos: [
        { kind: "arrow", from: [13, 5024], to: [30, 5048], label: "expansion with all three aligned", tone: "mastery" },
        { kind: "note", at: "br", text: "Daily → which way. 4H → when. 15m → at what price.", tone: "accent" },
      ],
    },
  ],
};

export const candleCounting: Walkthrough = {
  id: "candle-counting",
  title: "Candle counting: C1 to C4",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 49,
    bars: 40,
    vol: 0.0008,
    wick: 0.0009,
    points: [
      [0, 5040], [6, 5028], [12, 5016], [18, 5006], [19, 5000], [20, 5004], [21, 5018], [22, 5030],
      [26, 5040], [30, 5052], [36, 5064], [39, 5060],
    ],
    force: {
      19: { o: 5004, c: 5000, h: 5006, l: 4998 },
      20: { o: 5000, c: 5005, h: 5007, l: 4993 },
      21: { o: 5005, c: 5019, h: 5020, l: 5004 },
      22: { o: 5016, c: 5031, h: 5032, l: 5014 },
    },
  }),
  steps: [
    {
      title: "Candle 1 sets the level",
      caption:
        "Bar 19 is Candle 1: a down candle in a decline, low at 4998. Nothing marks it out yet. Its low is simply the most recent low, with sell stops beneath it.",
      annos: [
        { kind: "marker", bar: 19, price: 4998, label: "C1", tone: "neutral", place: "below" },
        { kind: "hline", price: 4998, from: 14, to: 21, label: "C1 low 4998", tone: "neutral", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "Candle 2 reverses",
      caption:
        "Bar 20 runs below Candle 1's low to 4993 and closes back above it at 5005. That is Candle 2: the sweep is the manipulation, the close back inside is the tell, and the swing low is now the low of Candle 2.",
      annos: [
        { kind: "marker", bar: 20, price: 4993, label: "C2: sweep, close back inside", tone: "danger", place: "below" },
        { kind: "hline", price: 5001, from: 20, to: 24, label: "C2 midpoint", tone: "neutral", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "Candle 3 confirms",
      caption:
        "Bar 21 closes at 5019, above Candle 2's high of 5007, having held above Candle 2's midpoint the whole way. The swing is confirmed and the direction is decided. Candle 3's range is 5004 to 5020; its equilibrium, 5012, is the line the next candle must respect.",
      annos: [
        { kind: "marker", bar: 21, price: 5020, label: "C3: closes above C2's high", tone: "mastery" },
        { kind: "hline", price: 5012, from: 21, to: 26, label: "C3 equilibrium 5012", tone: "warning", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "Candle 4 continues",
      caption:
        "Bar 22 opens at 5016, in the upper half of Candle 3, dips only to 5014 and expands to 5031. That is Candle 4: expanding out of the upper half of Candle 3's range. A dip through 5012 would have broken the count; it didn't come close.",
      annos: [
        { kind: "zone", from: 22, to: 22, low: 5012, high: 5020, label: "C3 upper half", tone: "mastery", labelAt: "top-end" },
        { kind: "marker", bar: 22, price: 5032, label: "C4: expands from the upper half", tone: "mastery" },
      ],
    },
    {
      title: "The count is fractal",
      caption:
        "Four hourly candles made a swing and an expansion. Inside Candle 2 there were twelve 5-minute candles that made the same shape, and inside the daily candle these four sit in there's a daily count too. You count on one timeframe and enter on the one below.",
      annos: [
        { kind: "path", points: [[19, 4998], [20, 4993], [21, 5020], [22, 5032], [30, 5052]], tone: "mastery", dashed: true },
        { kind: "note", at: "tr", text: "C1 sets. C2 sweeps and closes back. C3 confirms.\nC4 expands from C3's upper half.", tone: "accent" },
      ],
    },
  ],
};

export const candleProfiles: Walkthrough = {
  id: "candle-profiles",
  title: "Expansion, retracement and reversal profiles",
  frame: "1-hour bars, index future; three candles to read",
  candles: build({
    seed: 50,
    bars: 36,
    vol: 0.0006,
    wick: 0.0007,
    points: [
      [0, 5010], [6, 5024], [10, 5040], [12, 5034], [16, 5030], [20, 5024], [22, 5012], [23, 5016],
      [26, 5030], [30, 5046], [35, 5052],
    ],
    force: {
      10: { o: 5026, c: 5041, h: 5042, l: 5025 },
      12: { o: 5040, c: 5034, h: 5042, l: 5031 },
      22: { o: 5022, c: 5023, h: 5024, l: 5006 },
      30: { o: 5038, c: 5047, h: 5048, l: 5037 },
    },
  }),
  steps: [
    {
      title: "Expansion",
      caption:
        "Bar 10 opened at 5026, closed at 5041, and left wicks of a point at each end. Large body, small wicks, momentum: an expansion candle. Its small wick says the range is barely used, so the next candle has fuel.",
      annos: [
        { kind: "band", from: 10, to: 10, label: "expansion", tone: "mastery" },
        { kind: "marker", bar: 10, price: 5042, label: "small wicks, big body", tone: "mastery" },
      ],
    },
    {
      title: "Retracement",
      caption:
        "Bar 12 gave back six points with wicks at both ends and no displacement. A retracement candle. It says nothing about direction by itself; it says the previous move is being tested, not reversed.",
      annos: [
        { kind: "band", from: 12, to: 12, label: "retracement", tone: "neutral", labelAt: "bottom" },
        { kind: "marker", bar: 12, price: 5031, label: "modest body, no displacement", tone: "neutral", place: "below" },
      ],
    },
    {
      title: "Reversal, with a large wick",
      caption:
        "Bar 22 opened at 5022, ran down to 5006 and closed back at 5023: a reversal candle with a wick of sixteen points against a body of one. That's a Candle 2, but the fuel gauge is nearly empty. Two trips have already been made inside one candle.",
      annos: [
        { kind: "band", from: 22, to: 22, label: "reversal", tone: "danger" },
        { kind: "marker", bar: 22, price: 5006, label: "long opposing wick", tone: "danger", place: "below" },
      ],
    },
    {
      title: "What the wick decides",
      caption:
        "After the small-wick expansion at bar 10, the projections were the target. After the large-wick reversal at bar 22, the target is the near one: the session high or the daily open. Price does climb, but it takes eight bars to get where a fresh expansion would have gone in two. Always adjust the expectation to the wick.",
      annos: [
        { kind: "hline", price: 5040, from: 22, to: 30, label: "near target: the session high", tone: "warning", dashed: true },
        { kind: "note", at: "bl", text: "Small wick → expansion targets (projections).\nLarge wick → the near target, and take it.", tone: "accent" },
      ],
    },
  ],
};

export const timeframePairing: Walkthrough = {
  id: "timeframe-pairing",
  title: "The pair: count on the hourly, confirm on the 5-minute",
  frame: "5-minute bars across three 1-hour candles, index future, 4-hour bias up",
  candles: build({
    seed: 51,
    bars: 36,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5010], [4, 5014], [8, 5006], [11, 5004], [12, 5005], [15, 5000], [17, 4996], [19, 5004],
      [21, 5012], [23, 5016], [24, 5015], [28, 5024], [32, 5030], [35, 5034],
    ],
    force: {
      11: { o: 5005, c: 5004, h: 5006, l: 5002 },
      17: { o: 4999, c: 4997, h: 5000, l: 4994 },
      19: { o: 4999, c: 5005, h: 5006, l: 4998 },
      23: { o: 5013, c: 5017, h: 5018, l: 5012 },
    },
  }),
  xLabels: timeLabels(36, 9, 5, 6),
  steps: [
    {
      title: "Twelve candles inside",
      caption:
        "Each hourly candle holds twelve 5-minute candles. That is the working ratio: enough candles to form a swing and a CISD, few enough that the structure is still readable. The hourly is where you count; the 5-minute is where you confirm.",
      annos: [
        { kind: "band", from: 0, to: 11, label: "09:00 hourly", tone: "neutral" },
        { kind: "band", from: 12, to: 23, label: "10:00 hourly", tone: "accent" },
        { kind: "band", from: 24, to: 35, label: "11:00 hourly", tone: "neutral" },
      ],
    },
    {
      title: "The hourly Candle 2",
      caption:
        "The 09:00 candle's low is 5002. The 10:00 candle runs below it to 4994 at 10:25 and, by its close, is back above 5002. On the hourly chart that is a Candle 2 with the 4-hour bias behind it. You could only see it as a sweep and a close; the 5-minute shows you the inside.",
      annos: [
        { kind: "hline", price: 5002, from: 11, to: 20, label: "09:00 low 5002", tone: "neutral", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 17, price: 4994, label: "the hourly's sweep", tone: "danger", place: "below" },
      ],
    },
    {
      title: "The 5-minute confirms",
      caption:
        "At 10:35 a 5-minute candle closes above the open of the run down: CISD on the confirmation timeframe. The hourly Candle 2 is still open, but its swing low is already protected on the lower timeframe. That's why the pair exists: you don't wait for the hourly close.",
      annos: [{ kind: "marker", bar: 19, price: 5006, label: "5m CISD at 10:35", tone: "mastery" }],
    },
    {
      title: "Bias came from one pair up",
      caption:
        "None of this was taken on its own authority. The 4-hour and 15-minute pair had already printed a Candle 2 low overnight and pointed up. The hourly setup was with that bias, so it was a trade. The same hourly Candle 2 against the 4-hour would have been a retracement to skip or scalp.",
      annos: [
        { kind: "arrow", from: [21, 5012], to: [34, 5032], label: "expansion with the 4H bias", tone: "mastery" },
        { kind: "note", at: "tr", text: "Bias: 4H + 15m.  Setup: 1H + 5m.  Refine: 1m.", tone: "accent" },
      ],
    },
  ],
};

export const inversionEntry: Walkthrough = {
  id: "inversion-entry",
  title: "The 1-minute inversion inside the T-Spot",
  frame: "1-minute bars, index future, inside the 10:00 hourly candle with the bias up",
  candles: build({
    seed: 52,
    bars: 60,
    vol: 0.0003,
    wick: 0.0004,
    points: [
      [0, 5012], [6, 5010], [12, 5008], [18, 5006], [20, 5004], [22, 5001], [28, 4998], [31, 5000],
      [33, 5004], [40, 5008], [48, 5013], [59, 5018],
    ],
    force: {
      20: { o: 5005, c: 5004, h: 5006, l: 5003 },
      21: { o: 5004, c: 5001, h: 5004, l: 5000 },
      22: { o: 5001, c: 5001, h: 5002, l: 4999 },
      28: { o: 4999, c: 4998, h: 5000, l: 4996 },
      33: { o: 5001, c: 5005, h: 5006, l: 5000 },
    },
  }),
  xLabels: timeLabels(60, 10, 1, 10),
  steps: [
    {
      title: "Inside the T-Spot",
      caption:
        "The hourly T-Spot is 4996 to 5006. From 10:00 the 1-minute chart drifts down into it, and by 10:28 price is at 4996: the hourly wick is forming, early in the candle. The 5-minute CISD has already confirmed the swing. Now for the trigger.",
      annos: [
        { kind: "zone", from: 0, to: 59, low: 4996, high: 5006, label: "hourly T-Spot", tone: "accent" },
        { kind: "marker", bar: 28, price: 4996, label: "the wick low, 10:28", tone: "warning", place: "below" },
      ],
    },
    {
      title: "A bearish gap on the way down",
      caption:
        "The run down at 10:20 to 10:22 left a bearish fair value gap between bar 20's low (5003) and bar 22's high (5002). Small, but real: an imbalance from the selling that made the wick.",
      annos: [{ kind: "zone", from: 20, to: 22, low: 5002, high: 5003, label: "bearish FVG", tone: "danger" }],
    },
    {
      title: "The inversion",
      caption:
        "At 10:33 a 1-minute candle closes at 5005, above the bearish gap. The selling that made the gap has been overrun. That close is the trigger: long at 5005, stop just under the 10:28 low at 4995.",
      annos: [
        { kind: "marker", bar: 33, price: 5005, label: "inversion: close above the gap → long", tone: "mastery" },
        { kind: "hline", price: 4995, from: 28, to: 45, label: "stop under the invalidation low", tone: "danger", dashed: true },
      ],
    },
    {
      title: "Exit, decided beforehand",
      caption:
        "Ten points of risk. The 2R exit is 5025; the time-based exit is the 11:00 open; the projected close is the −1 target. The hourly profile is expansion, so the projection is the choice. Note the timing: the trigger came at minute 33, in the second quarter of the hourly candle, not the last.",
      annos: [
        { kind: "hline", price: 5025, from: 33, to: 59, label: "2R at 5025", tone: "accent", dashed: true },
        { kind: "band", from: 45, to: 59, label: "last quarter: no new inversions", tone: "danger", labelAt: "bottom" },
      ],
    },
  ],
};

export const continuationModel: Walkthrough = {
  id: "continuation-model",
  title: "Intracandle CISD and the continuation entry",
  frame: "5-minute bars across hourly Candle 3 and Candle 4, index future",
  candles: build({
    seed: 53,
    bars: 24,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5018], [2, 5022], [4, 5020], [6, 5028], [9, 5036], [11, 5039], [12, 5036], [14, 5033],
      [15, 5031], [16, 5035], [19, 5041], [21, 5048], [23, 5052],
    ],
    force: {
      4: { o: 5022, c: 5020, h: 5023, l: 5018 },
      5: { o: 5020, c: 5026, h: 5027, l: 5019 },
      11: { o: 5038, c: 5039, h: 5040, l: 5037 },
      12: { o: 5039, c: 5036, h: 5040, l: 5035 },
      15: { o: 5033, c: 5031, h: 5034, l: 5030 },
      16: { o: 5031, c: 5036, h: 5037, l: 5030 },
      19: { o: 5039, c: 5042, h: 5043, l: 5038 },
    },
  }),
  xLabels: timeLabels(24, 9, 5, 6),
  steps: [
    {
      title: "Candle 3 has closed",
      caption:
        "The 09:00 hourly candle is Candle 3: it closed at 5039, above Candle 2's high. Its range is 5018 to 5040, so its equilibrium is 5029. Direction is confirmed by a close you can see.",
      annos: [
        { kind: "band", from: 0, to: 11, label: "09:00: Candle 3", tone: "neutral" },
        { kind: "hline", price: 5029, from: 0, to: 23, label: "C3 equilibrium 5029", tone: "warning", dashed: true, labelAt: "start" },
        { kind: "hline", price: 5040, from: 9, to: 23, label: "C3 high 5040", tone: "neutral", dashed: true },
      ],
    },
    {
      title: "Candle 4 opens in the upper half",
      caption:
        "The 10:00 candle opens at 5039, in Candle 3's upper half. Between 10:00 and 10:15 it dips. Where it stops is the whole question: above 5029 and the count holds; through it and the expansion is failing.",
      annos: [
        { kind: "band", from: 12, to: 23, label: "10:00: Candle 4", tone: "accent" },
        { kind: "zone", from: 12, to: 23, low: 5029, high: 5040, label: "C3 upper half: where C4 should trade", tone: "mastery", labelAt: "inside" },
      ],
    },
    {
      title: "The refinement level",
      caption:
        "The dip stops at 5030, inside the 5-minute order block left by Candle 3's expansion (bar 4, the last down-close candle before the leg up: 5018 to 5022). It never reaches the midpoint. That is the ideal continuation dip: shallow, into a known level, above equilibrium.",
      annos: [
        { kind: "zone", from: 4, to: 16, low: 5030, high: 5034, label: "5m order block from C3's leg", tone: "accent" },
        { kind: "marker", bar: 15, price: 5030, label: "dip 10:15", tone: "warning", place: "below" },
      ],
    },
    {
      title: "Intracandle CISD",
      caption:
        "At 10:20 a 5-minute candle closes at 5036, above the open of the 10:00 to 10:15 run down. The hourly Candle 4 is still open, but its lower-timeframe delivery has turned back up. Entry on that close, stop under 5030, first target Candle 3's high.",
      annos: [
        { kind: "marker", bar: 16, price: 5037, label: "IC-CISD at 10:20: enter", tone: "mastery" },
        { kind: "hline", price: 5029, from: 15, to: 20, label: "stop", tone: "danger", dashed: true, labelAt: "end" },
        { kind: "arrow", from: [17, 5038], to: [22, 5050], label: "C3 high, then the projection", tone: "mastery" },
      ],
    },
  ],
};

export const ttfmReversalTrade: Walkthrough = {
  id: "ttfm-reversal-trade",
  title: "Trade one: the reversal, end to end",
  frame: "5-minute bars, 07:00 to 09:00 ET, index future, 4-hour Candle 2 low overnight",
  candles: build({
    seed: 54,
    bars: 24,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5008], [3, 5012], [6, 5004], [8, 5000], [10, 5006], [12, 5008], [14, 5004], [16, 4994],
      [18, 5006], [20, 5016], [22, 5030], [23, 5032],
    ],
    force: {
      8: { o: 5002, c: 5000, h: 5003, l: 4999 },
      16: { o: 4998, c: 4995, h: 4999, l: 4993 },
      17: { o: 4995, c: 4999, h: 5000, l: 4994 },
      18: { o: 4999, c: 5007, h: 5008, l: 4998 },
      22: { o: 5024, c: 5031, h: 5032, l: 5023 },
    },
  }),
  xLabels: timeLabels(24, 7, 5, 6),
  steps: [
    {
      title: "Bias and count",
      caption:
        "The 4-hour printed a Candle 2 low overnight: bias up. The 07:00 hourly candle made its low at 4999 on the 4-hour's swing. The 08:00 candle opens and starts to dip: if it runs 4999 and closes back above, it's an hourly Candle 2 with the bias behind it.",
      annos: [
        { kind: "band", from: 0, to: 11, label: "07:00 hourly", tone: "neutral" },
        { kind: "band", from: 12, to: 23, label: "08:00 hourly", tone: "accent" },
        { kind: "hline", price: 4999, from: 8, to: 18, label: "07:00 low 4999", tone: "neutral", dashed: true, labelAt: "start" },
        { kind: "note", at: "tl", text: "4H: Candle 2 low overnight → bias up.", tone: "mastery" },
      ],
    },
    {
      title: "T-Spot, and the wick",
      caption:
        "The expected wick zone for the 08:00 candle is the band under the 07:00 low, down to the 4-hour's equilibrium at 4992. At 08:20 price is in it, at 4993. Early in the candle: the profile is expansion so far.",
      annos: [
        { kind: "zone", from: 12, to: 23, low: 4992, high: 5000, label: "T-Spot", tone: "accent", labelAt: "bottom-end" },
        { kind: "marker", bar: 16, price: 4993, label: "wick at 08:20", tone: "warning", place: "below" },
      ],
    },
    {
      title: "CISD and the trigger",
      caption:
        "At 08:30 a 5-minute candle closes at 5007, above the open of the run down: CISD, protected low at 4993. On the 1-minute the run down left a bearish gap at 08:17, and a 1-minute candle closes above it at 08:31: the inversion trigger. Long at 5007, stop at 4992.",
      annos: [
        { kind: "marker", bar: 18, price: 5008, label: "5m CISD 08:30 · 1m inversion 08:31", tone: "mastery" },
        { kind: "hline", price: 4992, from: 16, to: 23, label: "stop 4992", tone: "danger", dashed: true, labelAt: "end" },
      ],
    },
    {
      title: "Exit at the projection",
      caption:
        "The leg was 5012 down to 4993, nineteen points, so −1 sits at 5031. The profile is expansion (small early wick, body building), so the exit is the projection rather than the daily open. It's hit at 08:52, and the 08:00 candle closes as an expansion candle.",
      annos: [
        { kind: "hline", price: 5031, from: 18, to: 23, label: "−1 projection 5031", tone: "mastery", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 22, price: 5032, label: "target, 08:52", tone: "mastery" },
      ],
    },
  ],
};

export const ttfmContinuationTrade: Walkthrough = {
  id: "ttfm-continuation-trade",
  title: "Trade two: the continuation, end to end",
  frame: "5-minute bars, 09:00 to 11:00 ET, index future, hourly Candle 3 closed at 10:00",
  candles: build({
    seed: 541,
    bars: 24,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5020], [2, 5024], [3, 5022], [5, 5030], [8, 5036], [11, 5039], [12, 5037], [14, 5033],
      [15, 5031], [16, 5036], [19, 5041], [22, 5052], [23, 5050],
    ],
    force: {
      3: { o: 5024, c: 5022, h: 5025, l: 5019 },
      11: { o: 5038, c: 5039, h: 5040, l: 5037 },
      15: { o: 5033, c: 5031, h: 5034, l: 5030 },
      16: { o: 5031, c: 5036, h: 5037, l: 5030 },
      19: { o: 5039, c: 5042, h: 5043, l: 5038 },
      22: { o: 5049, c: 5052, h: 5053, l: 5048 },
    },
  }),
  xLabels: timeLabels(24, 9, 5, 6),
  steps: [
    {
      title: "The count",
      caption:
        "The 08:00 candle was Candle 2. The 09:00 candle closed at 5039, above the 08:00 high: Candle 3, direction confirmed. Its range is 5019 to 5040; equilibrium 5029.5. It's 10:00, and the 10:00 candle is Candle 4.",
      annos: [
        { kind: "band", from: 0, to: 11, label: "09:00: Candle 3", tone: "neutral" },
        { kind: "band", from: 12, to: 23, label: "10:00: Candle 4", tone: "accent" },
        { kind: "hline", price: 5029.5, from: 0, to: 23, label: "C3 equilibrium", tone: "warning", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "The open and the dip",
      caption:
        "Candle 4 opens at 5037, in Candle 3's upper half. From 10:00 to 10:15 price pulls back and stops at 5030, in the 5-minute order block from Candle 3's expansion (bar 3, the last down-close before the leg). Above the midpoint: the count holds.",
      annos: [
        { kind: "zone", from: 3, to: 16, low: 5030, high: 5034, label: "5m order block", tone: "accent" },
        { kind: "marker", bar: 15, price: 5030, label: "dip 10:15", tone: "warning", place: "below" },
      ],
    },
    {
      title: "IC-CISD and entry",
      caption:
        "At 10:20 a 5-minute candle closes at 5036, above the open of the run down. Intracandle CISD, with the hourly still open. Entry at 5036, stop under the 10:15 low at 5029. First target is Candle 3's high at 5040, then the projection at 5052.",
      annos: [
        { kind: "marker", bar: 16, price: 5037, label: "IC-CISD 10:20: enter", tone: "mastery" },
        { kind: "hline", price: 5029, from: 15, to: 19, label: "stop", tone: "danger", dashed: true, labelAt: "end" },
        { kind: "hline", price: 5040, from: 11, to: 19, label: "C3 high", tone: "neutral", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "Targets, inside the window",
      caption:
        "The 09:00 high is taken at 10:35 and the projection at 10:50, both inside the 10:00 candle and inside the Silver Bullet window. Candle 4 closes as a continuation, expanding out of the upper half of Candle 3, exactly as the count expects. Grade: every row of the checklist filled before the entry.",
      annos: [
        { kind: "marker", bar: 19, price: 5043, label: "C3 high taken, 10:35", tone: "mastery" },
        { kind: "marker", bar: 22, price: 5053, label: "projection, 10:50", tone: "mastery" },
        { kind: "note", at: "bl", text: "Bias · count · location · confirmation · trigger\n· stop · exit · timing: all eight, before the entry.", tone: "accent" },
      ],
    },
  ],
};

export const fractalModel = [
  tSpot,
  stdProjections,
  fractalTargets,
  ttfmPlaybook,
  candleCounting,
  candleProfiles,
  timeframePairing,
  inversionEntry,
  continuationModel,
  ttfmReversalTrade,
  ttfmContinuationTrade,
];
