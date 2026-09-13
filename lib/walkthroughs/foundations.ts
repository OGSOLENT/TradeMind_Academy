import { build, timeLabels } from "./synth";
import type { Walkthrough } from "./types";

/**
 * Walkthroughs for the recorded lessons in Modules 1 to 8, 12 and 14. The
 * recording stays in the hero slot; these sit after the prose as the
 * precise version of what the video shows.
 */

export const candleAnatomy: Walkthrough = {
  id: "candle-anatomy",
  title: "Reading a single candle",
  frame: "1-hour bars, index future; one candle taken apart",
  candles: build({
    seed: 1,
    bars: 12,
    vol: 0.0012,
    wick: 0.0014,
    points: [[0, 5000], [3, 5012], [5, 5008], [7, 5024], [9, 5018], [11, 5030]],
    force: {
      7: { o: 5009, c: 5023, h: 5028, l: 5005 },
      9: { o: 5022, c: 5016, h: 5025, l: 5013 },
    },
  }),
  steps: [
    {
      title: "Open, high, low, close",
      caption:
        "Every candle is four prices. Bar 7 opened at 5009, traded as high as 5028 and as low as 5005, and closed at 5023. Those four numbers are the whole candle; everything else is how they're drawn.",
      annos: [
        { kind: "marker", bar: 7, price: 5028, label: "high 5028", tone: "neutral" },
        { kind: "marker", bar: 7, price: 5005, label: "low 5005", tone: "neutral", place: "below" },
        { kind: "hline", price: 5009, from: 5, to: 7, label: "open 5009", tone: "accent", dashed: true, labelAt: "start" },
        { kind: "hline", price: 5023, from: 7, to: 9, label: "close 5023", tone: "mastery", dashed: true },
      ],
    },
    {
      title: "Body and wicks",
      caption:
        "The body is open to close: 5009 to 5023, fourteen points, and because the close is above the open it's a bullish candle. The wicks are the rest of the range: five points above the body and four below. The wicks are where price went and didn't stay.",
      annos: [
        { kind: "zone", from: 7, to: 7, low: 5009, high: 5023, label: "body: open to close", tone: "mastery", labelAt: "top-end" },
        { kind: "bracket", from: 6, to: 8, price: 5034, label: "upper wick 5 pts", tone: "neutral" },
      ],
    },
    {
      title: "A bearish candle",
      caption:
        "Bar 9 opened at 5022 and closed at 5016: the close is below the open, so the body is drawn in the bearish colour. Same four prices, opposite story. Reading which colour and how long the body is, at a glance, is the first skill.",
      annos: [
        { kind: "zone", from: 9, to: 9, low: 5016, high: 5022, label: "bearish body", tone: "danger", labelAt: "bottom-end" },
      ],
    },
    {
      title: "The candle is a story",
      caption:
        "Bar 7 says: opened, dipped four points, then buyers took it nineteen points higher and it closed near the top. That dip and recovery is the shape you'll meet again as the wick of Lesson 4 and the Candle 2 of Lesson 5. One candle, read properly, is a whole lower-timeframe trend.",
      annos: [
        { kind: "path", points: [[7, 5009], [7, 5005], [7, 5028], [7, 5023]], tone: "accent", dashed: true },
        { kind: "note", at: "tl", text: "Open → dip (wick) → run (body) → close.\nEvery wick is a smaller trend that failed.", tone: "accent" },
      ],
    },
  ],
};

export const liquidityMagnet: Walkthrough = {
  id: "liquidity-magnet",
  title: "Liquidity: the invisible magnet",
  frame: "15-minute bars, index future",
  candles: build({
    seed: 3,
    bars: 48,
    vol: 0.0007,
    wick: 0.0008,
    points: [
      [0, 5010], [6, 5030], [10, 5022], [16, 5030], [22, 5020], [28, 5030], [32, 5024], [35, 5034],
      [37, 5028], [42, 5010], [47, 5000],
    ],
    force: {
      6: { h: 5031 },
      16: { h: 5031 },
      28: { h: 5031 },
      35: { o: 5029, c: 5032, h: 5036, l: 5028 },
      36: { o: 5032, c: 5026, h: 5034, l: 5024 },
    },
  }),
  steps: [
    {
      title: "Equal highs",
      caption:
        "Three times price stalls at 5031: bars 6, 16 and 28. Every trader who sold those highs has a stop just above them, and every breakout trader has a buy order there too. That cluster of orders is liquidity, and it's visible without seeing a single order.",
      annos: [
        { kind: "hline", price: 5031, from: 6, to: 35, label: "equal highs: buy stops above", tone: "danger", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 6, price: 5031, label: "1st", tone: "neutral", place: "below" },
        { kind: "marker", bar: 16, price: 5031, label: "2nd", tone: "neutral", place: "below" },
        { kind: "marker", bar: 28, price: 5031, label: "3rd", tone: "neutral", place: "below" },
      ],
    },
    {
      title: "The magnet",
      caption:
        "Resting orders attract price. A market that needs to fill large buy orders goes where the buyers are, and the buyers are above the equal highs. So the highs are not resistance in the old sense; they're a destination.",
      annos: [{ kind: "arrow", from: [30, 5022], to: [34, 5033], label: "drawn to the orders", tone: "danger" }],
    },
    {
      title: "The run",
      caption:
        "Bar 35 trades through 5031 to 5036. The stops are triggered, the breakout orders are filled, and both groups are now long at the top. Bar 36 closes back below 5031. The liquidity was taken and nothing was left to push price higher.",
      annos: [
        { kind: "marker", bar: 35, price: 5036, label: "the run on the highs", tone: "danger" },
        { kind: "marker", bar: 36, price: 5024, label: "closes back below", tone: "danger", place: "below" },
      ],
    },
    {
      title: "What follows",
      caption:
        "With the buyers trapped above, price falls to 5000 over the next twelve bars. The lesson: before you sell a high or buy a low, ask where the orders are. If the obvious level has never been run, expect it to be run before anything else happens.",
      annos: [
        { kind: "arrow", from: [38, 5024], to: [46, 5002], label: "the trapped buyers' stops feed the drop", tone: "danger" },
        { kind: "note", at: "bl", text: "Equal highs/lows = stacked orders = a draw.\nThe run comes first; the reversal after.", tone: "accent" },
      ],
    },
  ],
};

export const candle2Closure: Walkthrough = {
  id: "candle-2-closure",
  title: "The Candle 2 closure",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 5,
    bars: 30,
    vol: 0.0008,
    wick: 0.0009,
    points: [
      [0, 5036], [6, 5024], [12, 5012], [14, 5006], [15, 5010], [16, 5020], [20, 5032], [25, 5046], [29, 5050],
    ],
    force: {
      14: { o: 5010, c: 5006, h: 5011, l: 5004 },
      15: { o: 5006, c: 5010, h: 5012, l: 4998 },
      16: { o: 5010, c: 5021, h: 5022, l: 5009 },
    },
  }),
  steps: [
    {
      title: "Candle 1",
      caption:
        "A decline into bar 14, whose low is 5004. Candle 1 is nothing yet: it's the last candle of the move down, and its low is where the sell stops sit.",
      annos: [
        { kind: "marker", bar: 14, price: 5004, label: "C1", tone: "neutral", place: "below" },
        { kind: "hline", price: 5004, from: 14, to: 18, label: "Candle 1 low 5004", tone: "neutral", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "The sweep",
      caption:
        "Bar 15 trades below 5004 to 4998. Breakout sellers enter; anyone long is stopped. If the candle closed down here, this would be continuation. Watch the close.",
      annos: [{ kind: "marker", bar: 15, price: 4998, label: "runs below Candle 1's low", tone: "danger", place: "below" }],
    },
    {
      title: "The close back inside",
      caption:
        "Bar 15 closes at 5010, back above 5004. That is the Candle 2 closure: price swept out the previous candle's low and closed back above it. The sweep was the manipulation; the close is the tell.",
      annos: [{ kind: "marker", bar: 15, price: 5012, label: "Candle 2: closes back above", tone: "mastery" }],
    },
    {
      title: "The expectation",
      caption:
        "A Candle 2 closure sets the expectation of expansion higher. Bar 16 confirms with a close above Candle 2's high and the move runs to 5050. The pattern is the same on every timeframe, which is why the daily version is used for bias in Lesson 19.",
      annos: [
        { kind: "marker", bar: 16, price: 5022, label: "Candle 3 confirms", tone: "mastery" },
        { kind: "arrow", from: [18, 5026], to: [28, 5048], label: "expansion", tone: "mastery" },
      ],
    },
  ],
};

export const candle3Closure: Walkthrough = {
  id: "candle-3-closure",
  title: "The Candle 3 closure",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 6,
    bars: 30,
    vol: 0.0008,
    wick: 0.0009,
    points: [
      [0, 5036], [6, 5024], [12, 5012], [14, 5006], [15, 5000], [16, 5010], [17, 5018], [21, 5030], [26, 5044], [29, 5048],
    ],
    force: {
      14: { o: 5010, c: 5006, h: 5011, l: 5004 },
      15: { o: 5006, c: 5000, h: 5007, l: 4996 },
      16: { o: 5000, c: 5011, h: 5012, l: 4999 },
      17: { o: 5011, c: 5019, h: 5020, l: 5010 },
    },
  }),
  steps: [
    {
      title: "Candle 2 closes below",
      caption:
        "Same decline, same Candle 1 low at 5004. This time bar 15 runs below it and closes below it, at 5000. That is not a Candle 2 closure. On its own it's continuation, and you don't buy it.",
      annos: [
        { kind: "hline", price: 5004, from: 14, to: 17, label: "Candle 1 low", tone: "neutral", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 15, price: 4996, label: "Candle 2 closes below the low", tone: "danger", place: "below" },
      ],
    },
    {
      title: "Candle 3 closes back above",
      caption:
        "Bar 16 opens at 5000 and closes at 5011, back above Candle 1's low. The reclaim took one candle longer. This is the Candle 3 closure: the same reversal, delivered over three candles instead of two.",
      annos: [{ kind: "marker", bar: 16, price: 5012, label: "Candle 3: closes back above", tone: "mastery" }],
    },
    {
      title: "Why it counts",
      caption:
        "The sellers who entered on Candle 2's close are now trapped below a candle that closed against them. The structure is the same as the Candle 2 closure, just slower, and it often produces the cleaner move because more sellers were caught.",
      annos: [{ kind: "zone", from: 15, to: 17, low: 4996, high: 5004, label: "trapped sellers", tone: "danger", labelAt: "top-end" }],
    },
    {
      title: "Confirmation and expansion",
      caption:
        "Bar 17 closes above Candle 3's high and the expansion runs to 5048. Context still decides: this only counts as a reversal when the higher timeframe was expecting a low here. The shape without the context is a coin flip.",
      annos: [
        { kind: "marker", bar: 17, price: 5020, label: "confirmation", tone: "mastery" },
        { kind: "arrow", from: [19, 5024], to: [28, 5046], label: "expansion", tone: "mastery" },
      ],
    },
  ],
};

export const cisd: Walkthrough = {
  id: "cisd",
  title: "CISD: change in the state of delivery",
  frame: "5-minute bars, index future",
  candles: build({
    seed: 7,
    bars: 36,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5020], [6, 5024], [10, 5018], [14, 5012], [17, 5006], [20, 5002], [22, 5008], [23, 5016], [28, 5024], [35, 5034],
    ],
    force: {
      14: { o: 5015, c: 5012, h: 5016, l: 5011 },
      15: { o: 5012, c: 5010, h: 5013, l: 5009 },
      16: { o: 5010, c: 5008, h: 5011, l: 5006 },
      17: { o: 5008, c: 5006, h: 5009, l: 5005 },
      20: { o: 5003, c: 5002, h: 5004, l: 5000 },
      22: { o: 5004, c: 5009, h: 5010, l: 5003 },
      23: { o: 5009, c: 5017, h: 5018, l: 5008 },
    },
  }),
  steps: [
    {
      title: "A run of down-close candles",
      caption:
        "From bar 14 the delivery is down: a run of consecutive candles closing lower. The state of delivery is bearish, and until something changes it, every bounce is a pullback.",
      annos: [{ kind: "band", from: 14, to: 20, label: "down-close run", tone: "danger" }],
    },
    {
      title: "The level that matters",
      caption:
        "The first candle in the run, bar 14, opened at 5015. That opening price is the line. Price closing back above the open of the run's first candle would mean the whole run has been undone.",
      annos: [{ kind: "hline", price: 5015, from: 14, to: 26, label: "open of the run: 5015", tone: "warning", dashed: true, labelAt: "start" }],
    },
    {
      title: "The close through it",
      caption:
        "Bar 23 closes at 5017, above 5015. That close is the change in the state of delivery. Delivery has switched from down to up, and the low at 5000 is now a protected low: the swing that has to hold for the new delivery to stay valid.",
      annos: [
        { kind: "marker", bar: 23, price: 5018, label: "CISD: close above the run's open", tone: "mastery" },
        { kind: "marker", bar: 20, price: 5000, label: "protected low", tone: "mastery", place: "below" },
      ],
    },
    {
      title: "What you do with it",
      caption:
        "CISD is the confirmation the model waits for before every entry. The level came from the candles themselves, not from a drawing, so two people marking the same chart get the same line. Entry on the close or the retest, stop under the protected low.",
      annos: [
        { kind: "hline", price: 4999, from: 24, to: 32, label: "stop", tone: "danger", dashed: true, labelAt: "end" },
        { kind: "arrow", from: [25, 5020], to: [34, 5032], label: "new delivery", tone: "mastery" },
      ],
    },
  ],
};

export const fairValueGap: Walkthrough = {
  id: "fair-value-gap",
  title: "How fair value gaps work",
  frame: "5-minute bars, index future",
  candles: build({
    seed: 71,
    bars: 30,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5004], [5, 5008], [8, 5006], [9, 5016], [10, 5020], [14, 5026], [18, 5019], [20, 5016], [22, 5020], [29, 5034],
    ],
    force: {
      8: { o: 5005, c: 5007, h: 5009, l: 5004 },
      9: { o: 5007, c: 5017, h: 5018, l: 5006 },
      10: { o: 5017, c: 5020, h: 5022, l: 5014 },
      20: { o: 5017, c: 5016, h: 5018, l: 5013 },
      21: { o: 5016, c: 5019, h: 5020, l: 5015 },
    },
  }),
  steps: [
    {
      title: "Three candles",
      caption:
        "Bar 9 is a displacement candle: it opens at 5007 and closes at 5017 with almost no wick. Look at the candles either side of it. Bar 8's high is 5009. Bar 10's low is 5014. Between those two prices, nothing traded on the way up.",
      annos: [
        { kind: "marker", bar: 8, price: 5009, label: "bar 8 high 5009", tone: "neutral" },
        { kind: "marker", bar: 10, price: 5014, label: "bar 10 low 5014", tone: "neutral", place: "below" },
      ],
    },
    {
      title: "The gap",
      caption:
        "That band, 5009 to 5014, is a bullish fair value gap: a slice of price the market skipped because buying was one-sided. It's an imbalance, and markets tend to come back and trade the prices they skipped.",
      annos: [{ kind: "zone", from: 8, to: 29, low: 5009, high: 5014, label: "bullish FVG 5009 to 5014", tone: "mastery", labelAt: "top-end" }],
    },
    {
      title: "Consequent encroachment",
      caption:
        "The midpoint of the gap, 5011.5, is its consequent encroachment. When price returns, the reaction most often comes at the midpoint or at the gap's edges, so those are the prices to mark, not the whole band.",
      annos: [{ kind: "hline", price: 5011.5, from: 8, to: 29, label: "CE: the midpoint", tone: "mastery", dashed: true }],
    },
    {
      title: "The return",
      caption:
        "At bar 20 price trades down into the gap, to 5013, holds above the midpoint and turns. The gap acted as support because the imbalance was rebalanced. A close through the whole gap would have meant something else: Lesson 32's inversion.",
      annos: [
        { kind: "marker", bar: 20, price: 5013, label: "into the gap, holds the CE", tone: "mastery" },
        { kind: "arrow", from: [22, 5021], to: [28, 5033], label: "support held", tone: "mastery" },
      ],
    },
  ],
};

export const protectedSwings: Walkthrough = {
  id: "protected-swings",
  title: "Protected swings and trend structure",
  frame: "1-hour bars, index future",
  candles: build({
    seed: 9,
    bars: 48,
    vol: 0.0008,
    wick: 0.0009,
    points: [
      [0, 5000], [6, 5024], [10, 5014], [16, 5040], [20, 5028], [26, 5052], [30, 5040], [34, 5046], [38, 5034], [40, 5024], [47, 5010],
    ],
    force: {
      10: { l: 5013 },
      12: { o: 5018, c: 5026, h: 5027, l: 5017 },
      20: { l: 5027 },
      22: { o: 5032, c: 5042, h: 5043, l: 5031 },
      30: { l: 5039 },
      40: { o: 5030, c: 5023, h: 5031, l: 5021 },
    },
  }),
  steps: [
    {
      title: "A low becomes protected",
      caption:
        "The dip to 5013 at bar 10 is just a low until bar 12 closes above the run down that made it: CISD. From that close, 5013 is a protected low. It's the swing the trend now depends on.",
      annos: [
        { kind: "marker", bar: 10, price: 5013, label: "protected low 5013", tone: "mastery", place: "below" },
        { kind: "marker", bar: 12, price: 5027, label: "CISD confirms it", tone: "mastery" },
      ],
    },
    {
      title: "Higher protected lows",
      caption:
        "Each pullback that gets a CISD makes a new protected low: 5027 at bar 20, 5039 at bar 30. The trend is up for exactly as long as the most recent protected low holds. That's the definition, and it's mechanical.",
      annos: [
        { kind: "marker", bar: 20, price: 5027, label: "protected low 5027", tone: "mastery", place: "below" },
        { kind: "marker", bar: 30, price: 5039, label: "protected low 5039", tone: "mastery", place: "below" },
        { kind: "path", points: [[10, 5013], [20, 5027], [30, 5039]], tone: "mastery", dashed: true },
      ],
    },
    {
      title: "The line that ends the trend",
      caption:
        "The most recent protected low is 5039. Nothing above it changes the trend: a lower high at bar 34 is a warning, not a verdict. The trend ends only when a candle closes below 5039.",
      annos: [
        { kind: "hline", price: 5039, from: 30, to: 40, label: "trend valid above 5039", tone: "warning", dashed: true, labelAt: "start" },
        { kind: "marker", bar: 34, price: 5046, label: "lower high: a warning", tone: "warning" },
      ],
    },
    {
      title: "The break",
      caption:
        "Bar 40 closes at 5023, through the protected low. The uptrend is over by definition, and the high at 5052 is now the protected high of a new downtrend. Stops belonged under 5039 the whole time; that's what protected means.",
      annos: [
        { kind: "marker", bar: 40, price: 5021, label: "close below the protected low", tone: "danger", place: "below" },
        { kind: "marker", bar: 26, price: 5052, label: "now the protected high", tone: "danger" },
      ],
    },
  ],
};

export const dailyAnchors: Walkthrough = {
  id: "daily-anchors",
  title: "Daily anchor points: PDH, PDL and equilibrium",
  frame: "15-minute bars, 00:00 to 16:00 ET, index future; yesterday's range 4980 to 5040",
  candles: build({
    seed: 12,
    bars: 64,
    vol: 0.0007,
    wick: 0.0008,
    points: [
      [0, 5006], [8, 5000], [14, 4990], [18, 4978], [22, 4988], [28, 5004], [34, 5010], [40, 5022],
      [46, 5032], [52, 5042], [56, 5036], [63, 5038],
    ],
    force: {
      18: { o: 4984, c: 4982, h: 4985, l: 4976 },
      19: { o: 4982, c: 4989, h: 4990, l: 4981 },
      52: { h: 5044 },
    },
  }),
  xLabels: timeLabels(64, 0, 15, 8),
  steps: [
    {
      title: "Three lines from yesterday",
      caption:
        "Before today opens, yesterday gives you three prices: the previous day high at 5040, the previous day low at 4980, and their midpoint, equilibrium, at 5010. Mark them and nothing else.",
      annos: [
        { kind: "hline", price: 5040, label: "PDH 5040", tone: "danger", dashed: true, labelAt: "start" },
        { kind: "hline", price: 4980, label: "PDL 4980", tone: "mastery", dashed: true, labelAt: "start" },
        { kind: "hline", price: 5010, label: "EQ 5010", tone: "accent", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "Which half",
      caption:
        "Below equilibrium is discount; above is premium. Through the London session price trades under 5010 and heads for the low. In discount you look for the low to be run and reclaimed, not for shorts.",
      annos: [
        { kind: "zone", from: 0, to: 63, low: 4980, high: 5010, label: "discount", tone: "mastery", labelAt: "bottom-end" },
        { kind: "zone", from: 0, to: 63, low: 5010, high: 5040, label: "premium", tone: "danger", labelAt: "top-end" },
      ],
    },
    {
      title: "The run on the PDL",
      caption:
        "At 04:30 price trades through 4980 to 4976 and closes back above it. The stops under yesterday's low are taken; the daily wick is in. That is the anchor being used as liquidity, exactly as Lesson 3 said it would be.",
      annos: [{ kind: "marker", bar: 18, price: 4976, label: "PDL swept, reclaimed", tone: "danger", place: "below" }],
    },
    {
      title: "Discount to premium, to the PDH",
      caption:
        "From the reclaimed low, price crosses equilibrium at 08:30 and reaches the PDH at 13:00. Three lines, one day: the low was the draw in the morning and the high was the draw in the afternoon. The anchors don't predict; they tell you where the orders are.",
      annos: [
        { kind: "marker", bar: 34, price: 5010, label: "crosses EQ, 08:30", tone: "accent" },
        { kind: "marker", bar: 52, price: 5044, label: "PDH reached, 13:00", tone: "danger" },
      ],
    },
  ],
};

const ES_LINE = [
  5040, 5038, 5036, 5033, 5031, 5028, 5026, 5024, 5022, 5020, 5018, 5016, 5014, 5012, 5011, 5013,
  5015, 5014, 5013, 5012.5, 5012, 5015, 5018, 5021, 5024, 5027, 5030, 5033, 5036, 5038, 5040, 5042,
  5044, 5046, 5048, 5050, 5052, 5053, 5054, 5056,
];

export const smtDivergence: Walkthrough = {
  id: "smt-divergence",
  title: "SMT divergence between correlated markets",
  frame: "5-minute bars: Nasdaq future above, S&P future below",
  candles: build({
    seed: 20,
    bars: 40,
    vol: 0.0006,
    wick: 0.0007,
    points: [
      [0, 18040], [6, 18010], [10, 17990], [14, 17970], [17, 17980], [20, 17960], [24, 17985], [30, 18020], [36, 18050], [39, 18070],
    ],
    force: {
      14: { l: 17966 },
      20: { o: 17966, c: 17962, h: 17968, l: 17954 },
      21: { o: 17962, c: 17976, h: 17978, l: 17961 },
    },
  }),
  overlay: { label: "ES (S&P 500 future)", values: ES_LINE, tone: "warning" },
  steps: [
    {
      title: "Two markets that should agree",
      caption:
        "The Nasdaq and the S&P move together almost all the time. When one makes a new low, the other should too. So the moments they disagree are information: one of them is being pushed and the other isn't following.",
      annos: [{ kind: "arrow", from: [2, 18036], to: [13, 17974], label: "both markets falling", tone: "danger" }],
    },
    {
      title: "The divergence",
      caption:
        "At bar 20 the Nasdaq makes a lower low, 17954 under the 17966 low from bar 14. Look at the S&P line underneath: its bar 20 value, 5012, is above its bar 14 low of 5011. The S&P refused to make a new low. That is SMT divergence.",
      annos: [
        { kind: "marker", bar: 14, price: 17966, label: "low 17966", tone: "neutral", place: "below" },
        { kind: "marker", bar: 20, price: 17954, label: "lower low: NQ only", tone: "mastery", place: "below" },
        { kind: "note", at: "tr", text: "NQ: lower low.  ES: higher low.\nOne market swept; the other didn't confirm.", tone: "warning" },
      ],
    },
    {
      title: "Why it matters",
      caption:
        "A sweep that only one market makes is usually a sweep for liquidity, not a real break. The market that didn't follow is the tell. Combined with a CISD on the market that swept, it's one of the model's strongest confirmations of a turn.",
      annos: [{ kind: "marker", bar: 21, price: 17978, label: "CISD on the swept market", tone: "mastery" }],
    },
    {
      title: "The framework first",
      caption:
        "Both markets then rally together. SMT added confidence to a setup that already had bias, a sweep and a CISD. On its own, a divergence is just two lines disagreeing; the framework is what makes it tradeable.",
      annos: [{ kind: "arrow", from: [23, 17985], to: [38, 18066], label: "both markets up", tone: "mastery" }],
    },
  ],
};

export const expansionWeek: Walkthrough = {
  id: "expansion-week",
  title: "The classic expansion week",
  frame: "daily bars, two weeks, index future",
  candles: build({
    seed: 22,
    bars: 10,
    vol: 0.002,
    wick: 0.003,
    points: [[0, 5000], [2, 5020], [4, 5010], [5, 5004], [6, 5000], [7, 5020], [8, 5050], [9, 5064]],
    force: {
      4: { l: 4998 },
      5: { o: 5010, c: 5004, h: 5014, l: 4996 },
      6: { o: 5004, c: 5000, h: 5008, l: 4986 },
      7: { o: 5000, c: 5021, h: 5024, l: 4996 },
      8: { o: 5021, c: 5049, h: 5052, l: 5018 },
      9: { o: 5049, c: 5063, h: 5068, l: 5046 },
    },
  }),
  xLabels: { 0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Mon", 6: "Tue", 7: "Wed", 8: "Thu", 9: "Fri" },
  steps: [
    {
      title: "Last week's low",
      caption:
        "The previous week closed at 5010 with its low at 4998 on Friday. The sell stops under that low are where the new week's manipulation will look first.",
      annos: [{ kind: "hline", price: 4998, from: 4, to: 7, label: "last week's low 4998", tone: "neutral", dashed: true, labelAt: "start" }],
    },
    {
      title: "Monday and Tuesday: the low forms",
      caption:
        "Monday drifts lower. Tuesday runs below last week's low to 4986 and closes back above it at 5000: a daily Candle 2 closure, and the low of the week, made early in the week. That's the classic shape.",
      annos: [
        { kind: "band", from: 5, to: 6, label: "the weekly low forms", tone: "danger" },
        { kind: "marker", bar: 6, price: 4986, label: "Tuesday sweeps the low", tone: "danger", place: "below" },
      ],
    },
    {
      title: "Wednesday and Thursday: expansion",
      caption:
        "Wednesday closes above Tuesday's high, confirming the low. Thursday is the expansion day: open 5021, close 5049, small wicks. The week's body is being built here, in the middle of the week.",
      annos: [
        { kind: "band", from: 7, to: 8, label: "expansion", tone: "mastery" },
        { kind: "marker", bar: 8, price: 5052, label: "Thursday: the expansion day", tone: "mastery" },
      ],
    },
    {
      title: "Friday: the close",
      caption:
        "Friday continues and closes near the high of the week at 5063. The weekly candle: open 5010, low 4986, high 5068, close 5063. A bullish weekly candle whose wick was Tuesday. That is the expansion week, and it repeats often enough to plan around.",
      annos: [
        { kind: "note", at: "bl", text: "Weekly candle: O 5010  L 4986  H 5068  C 5063\nLow early (Tue), expansion midweek, close near the high.", tone: "accent" },
      ],
    },
  ],
};

export const foundations = [
  candleAnatomy,
  liquidityMagnet,
  candle2Closure,
  candle3Closure,
  cisd,
  fairValueGap,
  protectedSwings,
  dailyAnchors,
  smtDivergence,
  expansionWeek,
];
