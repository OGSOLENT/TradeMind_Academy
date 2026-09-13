import { build, timeLabels } from "./synth";
import type { Walkthrough } from "./types";

/** Module 9: Time & Sessions. Lessons 34 to 39. All times are New York (ET). */

export const powerOfThree: Walkthrough = {
  id: "power-of-three",
  title: "Power of Three: accumulation, manipulation, distribution",
  frame: "15-minute bars, 00:00 to 16:00 ET, index future",
  candles: build({
    seed: 34,
    bars: 64,
    vol: 0.0007,
    wick: 0.0009,
    points: [
      [0, 5000], [4, 5004], [8, 4997], [12, 4992], [16, 4986], [22, 4980], [26, 4992], [30, 5002],
      [34, 5010], [38, 5024], [44, 5036], [52, 5050], [58, 5042], [63, 5044],
    ],
    force: {
      0: { o: 5000, c: 5001, h: 5003, l: 4998 },
      22: { o: 4984, c: 4983, h: 4986, l: 4979 },
      52: { o: 5046, c: 5049, h: 5051, l: 5044 },
    },
  }),
  xLabels: timeLabels(64, 0, 15, 8),
  steps: [
    {
      title: "The open, and accumulation",
      caption:
        "The day opens at 5000 at midnight. For the first two hours price sits within a few points of the open, building positions on both sides. That is accumulation, and the open is the line everything else refers to.",
      annos: [
        { kind: "hline", price: 5000, label: "daily open 5000", tone: "accent", dashed: true },
        { kind: "band", from: 0, to: 8, label: "accumulation", tone: "neutral", labelAt: "bottom" },
      ],
    },
    {
      title: "Manipulation",
      caption:
        "From 02:00 price is pushed below the open, to 4980 at 05:30. Anyone who sold that break is now short at the low of the day. This is the manipulation leg: a move against the eventual direction that clears out early positions and sets the low.",
      annos: [
        { kind: "band", from: 8, to: 30, label: "manipulation", tone: "danger" },
        { kind: "marker", bar: 22, price: 4979, label: "low of the day, below the open", tone: "danger", place: "below" },
      ],
    },
    {
      title: "Distribution",
      caption:
        "Price reclaims the open around 07:30 and expands through the New York session to 5050, then eases into the close. This is distribution: the real move, delivered after the manipulation has done its work.",
      annos: [
        { kind: "band", from: 30, to: 63, label: "distribution", tone: "mastery" },
        { kind: "marker", bar: 52, price: 5051, label: "high of the day", tone: "mastery" },
      ],
    },
    {
      title: "The daily candle it makes",
      caption:
        "Zoom out and the whole day is one candle: open 5000, low 4980, high 5050, close 5044. A bullish candle whose lower wick is the manipulation. Power of Three is how that wick gets made, and it repeats on the weekly and the session candle too.",
      annos: [
        { kind: "note", at: "tl", text: "Daily candle: O 5000  L 4980  H 5050  C 5044\nThe wick is the manipulation. The body is the distribution.", tone: "accent" },
      ],
    },
  ],
};

export const judasSwing: Walkthrough = {
  id: "judas-swing",
  title: "The Judas swing",
  frame: "5-minute bars, 01:00 to 05:00 ET, index future",
  candles: build({
    seed: 35,
    bars: 48,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5000], [4, 5008], [8, 4994], [12, 5002], [16, 4996], [18, 4986], [21, 5006], [26, 5014],
      [32, 5022], [40, 5030], [47, 5028],
    ],
    force: {
      18: { o: 4991, c: 4988, h: 4992, l: 4984 },
      19: { o: 4988, c: 4993, h: 4995, l: 4986 },
      21: { o: 4994, c: 5007, h: 5008, l: 4993 },
    },
  }),
  xLabels: timeLabels(48, 1, 5, 6),
  steps: [
    {
      title: "The Asian range",
      caption:
        "Before London the market has been drifting between 4990 and 5012 for hours. That range is the reference: its high has buy stops above it, its low has sell stops below it.",
      annos: [
        { kind: "zone", from: 0, to: 12, low: 4990, high: 5012, label: "Asian range", tone: "neutral" },
        { kind: "hline", price: 4990, from: 0, to: 20, label: "Asia low", tone: "neutral", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "London opens",
      caption:
        "At 02:00 London comes in. The first thing price does is not the trend of the day; it is a false move, named for the betrayal it is.",
      annos: [{ kind: "vline", bar: 12, label: "02:00 London open", tone: "accent" }],
    },
    {
      title: "The Judas swing",
      caption:
        "Price runs below the Asian low to 4984 at 02:30, triggering the stops and tempting breakout sellers in. That is the Judas swing: the move that everyone follows and that is about to be reversed.",
      annos: [{ kind: "marker", bar: 18, price: 4984, label: "sweep of the Asian low", tone: "danger", place: "below" }],
    },
    {
      title: "Displacement, and the real direction",
      caption:
        "Bar 21 displaces back up through the range with a full-bodied candle, and the London session then trends higher for the rest of the morning. The Judas swing set the low of the session; the trade was long after the sweep, not short on the break.",
      annos: [
        { kind: "marker", bar: 21, price: 5008, label: "displacement up", tone: "mastery" },
        { kind: "arrow", from: [26, 5012], to: [40, 5028], label: "the session's true direction", tone: "mastery" },
      ],
    },
  ],
};

export const sessionAnatomy: Walkthrough = {
  id: "session-anatomy",
  title: "Session anatomy and the true day open",
  frame: "30-minute bars, 18:00 to 16:00 ET, index future",
  candles: build({
    seed: 36,
    bars: 44,
    vol: 0.0006,
    wick: 0.0008,
    points: [
      [0, 5000], [6, 5006], [12, 5002], [16, 5000], [19, 4990], [22, 4998], [26, 5004], [29, 5008],
      [32, 5030], [34, 5036], [36, 5030], [38, 5032], [40, 5040], [43, 5044],
    ],
    force: {
      12: { o: 5001, c: 5002, h: 5004, l: 5000 },
      19: { o: 4994, c: 4991, h: 4995, l: 4987 },
    },
  }),
  xLabels: { 0: "18:00", 6: "21:00", 12: "00:00", 16: "02:00", 22: "05:00", 29: "08:30", 34: "11:00", 38: "13:00", 43: "15:30" },
  steps: [
    {
      title: "Asia",
      caption:
        "The day for index futures starts at 18:00 ET. The Asian session, through to midnight, is usually a range: it sets the levels, it rarely makes the move.",
      annos: [{ kind: "band", from: 0, to: 12, label: "Asia 18:00 to 00:00", tone: "neutral" }],
    },
    {
      title: "The true day open",
      caption:
        "Midnight ET is the true day open: 5002 here. It splits the day into premium and discount. Below the midnight open in a day you expect to go up is where the buying opportunity is; above it, you are chasing.",
      annos: [
        { kind: "vline", bar: 12, label: "00:00 open", tone: "accent", labelAt: "bottom" },
        { kind: "hline", price: 5002, from: 12, to: 43, label: "midnight open 5002", tone: "accent", dashed: true },
      ],
    },
    {
      title: "London",
      caption:
        "London, 02:00 to 05:00, makes the first real move. Here it is the Judas swing: a run below the Asian low and the midnight open to 4987, then a recovery. The low of the day is in, and it is in discount relative to the open.",
      annos: [
        { kind: "band", from: 16, to: 22, label: "London 02:00 to 05:00", tone: "warning" },
        { kind: "marker", bar: 19, price: 4987, label: "low of the day", tone: "danger", place: "below" },
      ],
    },
    {
      title: "New York morning",
      caption:
        "08:30 to 11:00 is the New York AM session, the highest-volume window of the day. This is where the expansion happens: price runs from 5008 to 5036 in two and a half hours.",
      annos: [{ kind: "band", from: 29, to: 34, label: "NY AM 08:30 to 11:00", tone: "mastery" }],
    },
    {
      title: "Lunch and the afternoon",
      caption:
        "12:00 to 13:00 is lunch: thin, choppy, best left alone. The New York PM session from 13:30 either continues the morning or reverses it, and here it continues into the 16:00 close. Each session has a job, and knowing which one you are in tells you what to expect.",
      annos: [
        { kind: "band", from: 36, to: 38, label: "lunch", tone: "neutral", labelAt: "bottom" },
        { kind: "band", from: 39, to: 43, label: "NY PM 13:30 to 16:00", tone: "accent" },
      ],
    },
  ],
};

export const macros: Walkthrough = {
  id: "macros",
  title: "Macros and the 90-minute cycle",
  frame: "5-minute bars, 08:30 to 11:30 ET, index future",
  candles: build({
    seed: 37,
    bars: 36,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5000], [3, 5004], [4, 5006], [6, 5016], [8, 5010], [12, 5008], [15, 5006], [17, 4994],
      [20, 5004], [24, 5006], [27, 5008], [30, 5022], [32, 5016], [35, 5014],
    ],
    force: {
      6: { o: 5011, c: 5015, h: 5019, l: 5010 },
      17: { o: 4999, c: 4996, h: 5000, l: 4991 },
      30: { o: 5016, c: 5021, h: 5025, l: 5015 },
    },
  }),
  xLabels: timeLabels(36, 8.5, 5, 6),
  steps: [
    {
      title: "The windows",
      caption:
        "A macro is a twenty-minute window, ten minutes either side of the hour or the half, when the algorithm is expected to go looking for liquidity. The morning ones are 08:50 to 09:10, 09:50 to 10:10 and 10:50 to 11:10. Outside them, price drifts. Inside them, it moves.",
      annos: [
        { kind: "band", from: 4, to: 8, label: "08:50 to 09:10", tone: "accent" },
        { kind: "band", from: 16, to: 20, label: "09:50 to 10:10", tone: "accent" },
        { kind: "band", from: 28, to: 32, label: "10:50 to 11:10", tone: "accent" },
      ],
    },
    {
      title: "What each one does",
      caption:
        "In the first window price runs the high at 5018. In the second it runs the low at 4991. In the third it runs the high again. Each macro takes a level that was sitting there and reacts from it; the direction depends on which liquidity is nearest.",
      annos: [
        { kind: "marker", bar: 6, price: 5019, label: "runs the high", tone: "danger" },
        { kind: "marker", bar: 17, price: 4991, label: "runs the low", tone: "mastery", place: "below" },
        { kind: "marker", bar: 30, price: 5025, label: "runs the high", tone: "danger" },
      ],
    },
    {
      title: "Using them",
      caption:
        "You do not trade the window; you trade the setup that forms inside it. Have the levels marked before it opens, expect the run, and look for the displacement that follows it. Between macros, be patient; the 90-minute rhythm gives you a next chance on a clock.",
      annos: [
        { kind: "note", at: "bl", text: "Mark the levels before the window opens.\nTrade the displacement after the run.", tone: "accent" },
      ],
    },
  ],
};

export const silverBullet: Walkthrough = {
  id: "silver-bullet",
  title: "The Silver Bullet",
  frame: "5-minute bars, 09:30 to 11:30 ET, index future",
  candles: build({
    seed: 38,
    bars: 24,
    vol: 0.0005,
    wick: 0.0006,
    points: [
      [0, 5000], [2, 5018], [4, 5006], [6, 5002], [8, 4988], [10, 5004], [11, 5008], [13, 4999],
      [15, 5012], [17, 5024], [20, 5026], [23, 5022],
    ],
    force: {
      2: { h: 5020 },
      5: { l: 4990 },
      8: { o: 4995, c: 4990, h: 4996, l: 4986 },
      9: { o: 4990, c: 4995, h: 4996, l: 4989 },
      10: { o: 4995, c: 5006, h: 5008, l: 4994 },
      11: { o: 5006, c: 5009, h: 5011, l: 5001 },
      13: { o: 5004, c: 4999, h: 5005, l: 4998 },
      17: { h: 5026 },
    },
  }),
  xLabels: timeLabels(24, 9.5, 5, 6),
  steps: [
    {
      title: "The window and the levels",
      caption:
        "The New York Silver Bullet is 10:00 to 11:00. Before it opens, mark the liquidity: the 09:40 high at 5020 has buy stops above it, the 09:55 low at 4990 has sell stops below it.",
      annos: [
        { kind: "band", from: 6, to: 18, label: "Silver Bullet 10:00 to 11:00", tone: "accent" },
        { kind: "hline", price: 5020, from: 2, to: 18, label: "buyside 5020", tone: "neutral", dashed: true, labelAt: "start" },
        { kind: "hline", price: 4990, from: 5, to: 10, label: "sellside 4990", tone: "neutral", dashed: true, labelAt: "start" },
      ],
    },
    {
      title: "The sweep",
      caption:
        "At 10:10 price runs below 4990 to 4986. The sell stops are taken. That is the first requirement inside the window: liquidity has to be swept before the setup counts.",
      annos: [{ kind: "marker", bar: 8, price: 4986, label: "sweep of the low", tone: "danger", place: "below" }],
    },
    {
      title: "Displacement and the fair value gap",
      caption:
        "Bar 10 displaces up and leaves a gap between bar 9's high (4996) and bar 11's low (5001). A fair value gap formed inside the window, after a sweep, in the direction of the higher-timeframe draw: that is the whole Silver Bullet.",
      annos: [
        { kind: "marker", bar: 10, price: 5008, label: "displacement", tone: "mastery" },
        { kind: "zone", from: 9, to: 16, low: 4996, high: 5001, label: "FVG", tone: "mastery" },
      ],
    },
    {
      title: "Entry and target",
      caption:
        "Price retraces into the gap at 10:35 and holds. Long from the gap, stop under the sweep low at 4986, target the buyside at 5020, which is hit at 10:55, still inside the window.",
      annos: [
        { kind: "marker", bar: 13, price: 4998, label: "entry in the FVG", tone: "mastery", place: "below" },
        { kind: "hline", price: 4985, from: 11, to: 18, label: "stop", tone: "danger", dashed: true },
        { kind: "arrow", from: [14, 5008], to: [17, 5024], label: "target: the 5020 buyside", tone: "mastery" },
      ],
    },
  ],
};

export const highImpactNews: Walkthrough = {
  id: "high-impact-news",
  title: "High-impact news: CPI, NFP and FOMC",
  frame: "5-minute bars, 08:00 to 09:30 ET, index future, CPI at 08:30",
  candles: build({
    seed: 39,
    bars: 18,
    vol: 0.0004,
    wick: 0.0005,
    points: [
      [0, 5000], [5, 5001], [6, 4998], [7, 4990], [8, 5006], [9, 5018], [11, 5012], [14, 5028], [17, 5040],
    ],
    force: {
      6: { o: 5000, c: 4998, h: 5030, l: 4975 },
      7: { o: 4998, c: 4990, h: 5000, l: 4972 },
      8: { o: 4990, c: 5007, h: 5008, l: 4988 },
      9: { o: 5007, c: 5019, h: 5021, l: 5006 },
    },
  }),
  xLabels: timeLabels(18, 8, 5, 3),
  steps: [
    {
      title: "The release",
      caption:
        "CPI prints at 08:30. Before it, price has done nothing for half an hour, because nobody wants to be positioned into a number.",
      annos: [{ kind: "vline", bar: 6, label: "08:30 CPI", tone: "warning" }],
    },
    {
      title: "The first candle",
      caption:
        "The 08:30 candle trades from 5030 down to 4975 and closes almost where it opened: 55 points of range in five minutes, both directions. Spreads widen, fills slip, stops on both sides get hit. This candle is not tradeable, only survivable.",
      annos: [
        { kind: "marker", bar: 6, price: 5030, label: "both sides run", tone: "danger" },
        { kind: "note", at: "bl", text: "Rule one: no position through the release.\nRule two: the first candle is not a signal.", tone: "warning" },
      ],
    },
    {
      title: "The sweep",
      caption:
        "The next candle runs the low again, to 4972, and closes back up. That second run into the sell stops, after the whipsaw, is the manipulation. Now there is something to read.",
      annos: [{ kind: "marker", bar: 7, price: 4972, label: "sweep of the low", tone: "danger", place: "below" }],
    },
    {
      title: "The real direction",
      caption:
        "Bars 8 and 9 displace up through the range with full bodies and the market trends for the rest of the hour. The news did not give the direction; the sweep and the displacement after it did. Same rules as any other day, with the volatility turned up.",
      annos: [
        { kind: "marker", bar: 9, price: 5021, label: "displacement: the direction", tone: "mastery" },
        { kind: "arrow", from: [11, 5016], to: [16, 5036], label: "trend after the news", tone: "mastery" },
      ],
    },
  ],
};

export const timeSessions = [powerOfThree, judasSwing, sessionAnatomy, macros, silverBullet, highImpactNews];
