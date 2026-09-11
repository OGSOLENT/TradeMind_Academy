/**
 * The Level-1 question bank, written from the real curriculum in
 * content/lessons/*.md. Eight items per knowledge component, covering all
 * six question types. Every chart series in here is simulated (guardrail 7.1).
 */
import type { AnswerKey, Difficulty, ItemPayload, ItemType } from "../lib/content/types";

export interface ItemSeed {
  type: ItemType;
  difficulty: Difficulty;
  payload: ItemPayload;
  answerKey: AnswerKey;
  explanation: string;
  isPretestEligible: boolean;
}

/** A deterministic simulated OHLC series for the annotation questions. */
function series(seed: number, drift: number) {
  const out: Array<{ time: string; open: number; high: number; low: number; close: number }> = [];
  let price = 100;
  for (let i = 0; i < 14; i++) {
    const wave = Math.sin(seed + i * 0.75) * 2.2 + drift * (i - 7) * 0.35;
    const open = price;
    const close = price + wave;
    out.push({
      time: `2024-03-${String(i + 1).padStart(2, "0")}`,
      open: round(open),
      high: round(Math.max(open, close) + 0.9),
      low: round(Math.min(open, close) - 0.9),
      close: round(close),
    });
    price = close;
  }
  return out;
}
const round = (n: number) => Math.round(n * 100) / 100;

const mcq = (
  difficulty: Difficulty,
  question: string,
  options: string[],
  correct: number,
  explanation: string,
  isPretestEligible = false,
): ItemSeed => ({
  type: "mcq",
  difficulty,
  payload: { type: "mcq", question, options },
  answerKey: { type: "mcq", correct },
  explanation,
  isPretestEligible,
});

const multi = (
  difficulty: Difficulty,
  question: string,
  options: string[],
  correct: number[],
  explanation: string,
): ItemSeed => ({
  type: "multi",
  difficulty,
  payload: { type: "multi", question, options },
  answerKey: { type: "multi", correct },
  explanation,
  isPretestEligible: false,
});

const numeric = (
  difficulty: Difficulty,
  question: string,
  unit: string,
  min: number,
  max: number,
  step: number,
  value: number,
  tolerance: number,
  explanation: string,
): ItemSeed => ({
  type: "numeric",
  difficulty,
  payload: { type: "numeric", question, unit, min, max, step },
  answerKey: { type: "numeric", value, tolerance },
  explanation,
  isPretestEligible: false,
});

const ordering = (
  difficulty: Difficulty,
  question: string,
  entries: string[],
  explanation: string,
): ItemSeed => ({
  type: "ordering",
  difficulty,
  payload: { type: "ordering", question, entries },
  answerKey: { type: "ordering", order: entries.map((_, i) => i) },
  explanation,
  isPretestEligible: false,
});

const tf = (
  difficulty: Difficulty,
  statement: string,
  value: boolean,
  explanation: string,
  isPretestEligible = false,
): ItemSeed => ({
  type: "tf-confidence",
  difficulty,
  payload: { type: "tf-confidence", statement },
  answerKey: { type: "tf-confidence", value },
  explanation,
  isPretestEligible,
});

const annotation = (
  difficulty: Difficulty,
  question: string,
  seed: number,
  drift: number,
  zone: { from: string; to: string; priceLow: number; priceHigh: number },
  describe: string,
  explanation: string,
): ItemSeed => ({
  type: "annotation",
  difficulty,
  payload: { type: "annotation", question, candles: series(seed, drift), describe },
  answerKey: { type: "annotation", zone },
  explanation,
  isPretestEligible: false,
});

export const ITEMS: Record<string, ItemSeed[]> = {
  // ── Module 1 ────────────────────────────────────────────────────────────
  "kc-candle-anatomy": [
    mcq(
      "easy",
      "Which four data points does every candle record?",
      [
        "High, Low, Volume, Close",
        "Open, High, Low, Close",
        "Open, Close, Volume, Range",
        "Bid, Ask, High, Low",
      ],
      1,
      "Every candle on every timeframe records Open, High, Low and Close — OHLC. The body spans open to close; the wick is everything beyond it.",
      true,
    ),
    mcq(
      "easy",
      "A candle has a large body and only small wicks. Which type is it?",
      ["Indecision candle", "Reversal candle", "Directional candle", "Inside bar"],
      2,
      "A large body with small wicks is a directional (expansion) candle: price moved confidently in one direction for most of the period and gave little back.",
      true,
    ),
    mcq(
      "med",
      "What does a candle with long wicks on both sides and a tiny body tell you?",
      [
        "Buyers were in complete control",
        "Neither side won — the open and close are nearly identical",
        "The period had no trading activity",
        "A reversal has been confirmed",
      ],
      1,
      "That is an indecision candle. Price was pushed both ways but finished roughly where it started — a tug-of-war, often a pause before the next real move.",
      false,
    ),
    mcq(
      "hard",
      "On the daily chart you see a candle with a long lower wick. What does that wick represent on the 15-minute chart inside it?",
      [
        "A period with no price data",
        "A complete lower-timeframe decline, a bottom, and a sharp reversal",
        "A single 15-minute candle",
        "Sideways consolidation only",
      ],
      1,
      "A wick is a lower-timeframe trend compressed into one line. The daily lower wick contains an entire 15-minute move down, a bottom, and the reversal back up.",
      false,
    ),
    multi(
      "med",
      "Select every statement that is true about reading candles.",
      [
        "The close matters more than the extreme, because a close is an agreement",
        "Colour alone tells you whether a candle is bullish or bearish",
        "Body-to-wick ratio identifies the candle type",
        "Every timeframe with a candle has a lower timeframe building it",
      ],
      [0, 2, 3],
      "The close, the body-to-wick ratio and the fractal relationship are all core. Colour alone is misleading — a green candle with a huge upper wick is not bullish.",
    ),
    numeric(
      "easy",
      "According to the Rule of Three, after how many consecutive days of expansion should you expect a shift in momentum?",
      "days",
      1,
      10,
      1,
      3,
      0.5,
      "Three consecutive expansion days is the prompt to expect a reversal or indecision candle next. It is a cue to pay attention, not a trade signal.",
    ),
    ordering(
      "med",
      "Put the four stages of a bearish reversal candle into the order they occur.",
      [
        "Open — the candle opens",
        "Push high — buyers take control and push price up",
        "Reversal down — sellers aggressively push price back down",
        "Close — price closes below the open",
      ],
      "The long upper wick is the record of the buyers who were overwhelmed between the push high and the close.",
    ),
    tf(
      "easy",
      "True or false: a wick shows where price was rejected, not where it settled.",
      true,
      "True. The wick marks ground price covered but could not hold. The close is where the market agreed.",
      true,
    ),
  ],

  // ── Module 2 ────────────────────────────────────────────────────────────
  "kc-liquidity": [
    mcq(
      "easy",
      "Where does buyside liquidity sit?",
      [
        "Below old lows",
        "Above old highs",
        "At the midpoint of the range",
        "Wherever volume is lowest",
      ],
      1,
      "Buyside liquidity is the cluster of buy stop orders resting above old highs — stops from shorts and breakout orders from buyers.",
      true,
    ),
    mcq(
      "med",
      "Using the three-step method, how do you confirm a high is a genuine swing high?",
      [
        "It is the highest price of the day",
        "There are lower highs on both the left and right of it",
        "It has been touched at least three times",
        "It sits above the previous day high",
      ],
      1,
      "Locate the point, then check both sides. A high with lower highs to the left and right is a genuine swing high, and the liquidity above it is real.",
      false,
    ),
    mcq(
      "med",
      "Why are equal highs a stronger magnet than a single high?",
      [
        "They are easier to see on a chart",
        "Repeated touches at one price stack more orders in a single spot",
        "They always mark the end of a trend",
        "They cannot be swept",
      ],
      1,
      "Two or more touches at the same price concentrate stops and pending orders at one level, making the pool larger and the draw stronger.",
      false,
    ),
    mcq(
      "hard",
      "A candle forms a large wick that consumes half its time and range. What does this tell you about further expansion in that candle?",
      [
        "Expansion is more likely because momentum is building",
        "A large wick does not support further expansion — the budget is spent",
        "It guarantees a reversal on the next candle",
        "Wick size has no bearing on expansion",
      ],
      1,
      "Every candle has a finite time and range budget. If most of it went into forming the wick, there is nothing left for a decisive move before the close.",
      false,
    ),
    multi(
      "med",
      "Which levels are worth marking as liquidity before a session starts?",
      [
        "Previous day high and low",
        "Every single candle high on the chart",
        "Previous week high and low",
        "Equal highs and equal lows",
      ],
      [0, 2, 3],
      "Mark genuine swing points and the most-watched levels. Marking every high and low produces noise, not a map.",
    ),
    numeric(
      "med",
      "In the 'Wait & Trade' scenario you wait for the reversal candle to fully close, then trade which candle number after it?",
      "candles",
      1,
      5,
      1,
      1,
      0.5,
      "You trade the next candle — one after the closed reversal candle. You give up some of the move in exchange for a completed candle as evidence.",
    ),
    ordering(
      "hard",
      "Order the four steps for trading a reversal safely.",
      [
        "Let it close — let the large reversal candle completely close",
        "Observe the open of the next candle",
        "Wait for a small wick — a shallow opposing run",
        "Enter on the confirmed expansion continuation",
      ],
      "Do not try to catch a falling knife. Letting the candle close, then waiting for a shallow opposing run, is the safest of the three scenarios.",
    ),
    annotation(
      "hard",
      "Mark the area on this simulated chart where sellside liquidity would be resting.",
      3,
      -0.6,
      { from: "2024-03-09", to: "2024-03-14", priceLow: 88, priceHigh: 96 },
      "A simulated 14-day series drifting lower with a swing low forming in the second half of the range. Sellside liquidity rests below that low.",
      "Sellside liquidity sits below old lows — the sell stop orders of anyone holding long. It acts as a magnet pulling price down toward it.",
    ),
  ],


  // ── Module 3: Risk & Position Sizing ────────────────────────────────────
  "kc-risk-sizing": [
    mcq(
      "easy",
      "In the fixed-risk method, which value stays the same on every trade?",
      [
        "The number of contracts or lots",
        "The monetary amount at risk",
        "The distance to the stop loss",
        "The profit target in points",
      ],
      1,
      "The risk amount is fixed; the position size is the variable that changes so the loss is identical whatever the stop distance.",
      true,
    ),
    mcq(
      "easy",
      "Your setup requires a wide stop. What happens to the position size?",
      [
        "It gets larger, to keep the profit the same",
        "It gets smaller, to keep the risk the same",
        "It stays the same and you accept more risk",
        "You move the stop closer instead",
      ],
      1,
      "A wider stop means a smaller position for the same money at risk. The stop is set by structure — never moved to suit a position size.",
      true,
    ),
    mcq(
      "med",
      "A trader wins 80% of trades but the account is down. What is the most likely cause?",
      [
        "The win rate was measured wrongly",
        "The losing trades were sized far larger than the winners",
        "The strategy has no edge at all",
        "Commissions consumed the profit",
      ],
      1,
      "Eight wins at $50 cannot cover one loss at $2,000. Win rate is meaningless unless every trade risks the same amount.",
      false,
    ),
    mcq(
      "med",
      "Why are losses and gains described as asymmetrical?",
      [
        "Losses are taxed differently from gains",
        "A large loss needs a proportionally larger gain to recover from",
        "Gains always take longer to achieve",
        "Brokers charge more on losing trades",
      ],
      1,
      "A 50% loss needs a 100% gain just to get back to level. Damage compounds faster than repair, so the downside is protected first.",
      false,
    ),
    mcq(
      "hard",
      "What is a trailing drawdown?",
      [
        "A stop loss that moves with price",
        "A loss limit that follows the account's high-water mark",
        "The average loss across a losing streak",
        "The margin required to hold a position overnight",
      ],
      1,
      "Because the floor rises as the account grows, a run of oversized losses can breach it even from a profitable peak — which is exactly what consistent sizing prevents.",
      false,
    ),
    multi(
      "med",
      "Which three parameters are set before a session begins?",
      ["Capital base", "Exposure percentage", "Risk per trade", "Expected win rate"],
      [0, 1, 2],
      "Capital base, exposure % and risk per trade are decided in advance and held. Win rate is an outcome you measure afterwards, not a parameter you set.",
    ),
    numeric(
      "med",
      "You risk $150 per trade and your stop is 30 points away, at $1 per point. What quantity do you take?",
      "units",
      1,
      50,
      1,
      5,
      0.5,
      "position size = risk ÷ (stop distance × value per point) = 150 ÷ (30 × 1) = 5. The quantity is always calculated, never chosen by feel.",
    ),
    ordering(
      "med",
      "Order the steps for sizing a trade correctly.",
      [
        "Place the stop where structure says — beyond the protected swing",
        "Measure the distance from entry to stop",
        "Divide the fixed risk amount by that distance",
        "Enter the resulting quantity in the order ticket",
      ],
      "Structure first, arithmetic second. Choosing the quantity first and then placing the stop to suit it inverts the whole method.",
    ),
  ],

  // ── Module 4 ────────────────────────────────────────────────────────────
  "kc-reversal-patterns": [
    mcq(
      "easy",
      "Which two conditions must BOTH be true for a Candle 2 closure?",
      [
        "Price gaps up, then closes higher",
        "Price sweeps a previous extreme AND closes back inside the prior candle's range",
        "Price closes completely beyond the previous high",
        "Two candles close in the same direction",
      ],
      1,
      "The sweep grabs the liquidity; the close back inside proves the move failed. Both are required — either alone is not a Candle 2 closure.",
      true,
    ),
    mcq(
      "med",
      "Why will a strategy of trading every sweep-and-close-back-in fail?",
      [
        "The pattern is too rare to trade",
        "The shape appears constantly; without a Point of Interest there is no reason behind it",
        "It only works on the daily timeframe",
        "Brokers do not allow it",
      ],
      1,
      "Context versus shape. The pattern occurs dozens of times across any chart. What makes one tradeable is that it happens at a level you marked in advance.",
      false,
    ),
    mcq(
      "med",
      "What single feature distinguishes a continuation closure from a reversal closure?",
      [
        "The colour of the candle",
        "Where the candle closes relative to the swept level",
        "The size of the wick",
        "The time of day it forms",
      ],
      1,
      "A continuation closure closes completely beyond the level (it did not hold). A reversal closure closes back inside the range (it held). Same sweep, opposite meaning.",
      false,
    ),
    mcq(
      "hard",
      "Candle 2 sweeps the low but closes below it. What are you now waiting for?",
      [
        "Nothing — the setup is dead",
        "Candle 3 to close through and engulf Candle 2's body",
        "An immediate entry at the low",
        "The next daily open",
      ],
      1,
      "If Candle 2 lacks a closure, wait for print. Candle 3 completes the rejection one period late by engulfing Candle 2's body.",
      false,
    ),
    multi(
      "hard",
      "Select the non-negotiable rules for a Candle 3 setup.",
      [
        "It needs a key level",
        "Enter at the equilibrium of the Candle 3 range",
        "Enter immediately at the Candle 3 close",
        "Candle 3 must engulf Candle 2's body",
      ],
      [0, 1, 3],
      "Key level, engulfing body and an equilibrium entry are all required. Entering at the close instead of waiting for the retrace to 50% gives a worse price and a wider stop.",
    ),
    numeric(
      "med",
      "A valid Candle 3 closure prints with a range from 100 to 140. At what price is your equilibrium entry?",
      "price",
      100,
      140,
      0.5,
      120,
      0.5,
      "Equilibrium is the 50% midpoint of the range: (100 + 140) / 2 = 120. You wait for price to retrace into the middle of the candle that proved the reversal.",
    ),
    ordering(
      "med",
      "Put the four-candle sequence into order.",
      [
        "Candle 1 — the reference range",
        "Candle 2 — the sweep and the reversal closure",
        "Candle 3 — the initial continuation",
        "Candle 4 — follow-through expansion",
      ],
      "Naming candles by position rather than shape is what makes the model mechanical. Candle 2 is always the one that sweeps Candle 1.",
    ),
    tf(
      "med",
      "True or false: a textbook Candle 2 closure in the middle of a range, with no Point of Interest, is still a valid trade.",
      false,
      "False. No POI, no trade. The pattern is the trigger; the Point of Interest is the reason. This is the most common failure in the whole method.",
      true,
    ),
  ],

  // ── Module 4 ────────────────────────────────────────────────────────────
  "kc-cisd-confirmation": [
    mcq(
      "easy",
      "Which price of the opposing candle series must be closed through for a valid CISD?",
      ["The high", "The low", "The opening price", "The midpoint"],
      2,
      "CISD is a close beyond the OPENING price of an opposing series of candles. Not the high, not the low, and it must be a close — not a wick through.",
      true,
    ),
    mcq(
      "med",
      "What is a protected swing?",
      [
        "Any high or low on the chart",
        "A high or low expected to remain intact as the current trend continues",
        "A level guaranteed never to break",
        "The midpoint of the previous range",
      ],
      1,
      "Protected swings are the skeleton of a trend. When one breaks, the trend structure it belonged to is finished — which is why it makes a good invalidation point.",
      false,
    ),
    mcq(
      "med",
      "What distinguishes an IDEAL CISD from a non-ideal one?",
      [
        "It happens on a higher timeframe",
        "It closes over the entire opposing series, not just the body of the last candle",
        "It has a larger wick",
        "It occurs during the New York session",
      ],
      1,
      "A close clearing only the body is a shallow shift. An ideal setup closes past the opening of every candle that helped create the extreme.",
      false,
    ),
    mcq(
      "hard",
      "You drop inside the wick of a swept swing high and find no CISD. What do you do?",
      [
        "Trade it anyway — the higher timeframe reversal is enough",
        "Treat it as a fakeout and skip it",
        "Wait for the daily close then trade it",
        "Halve your position size and trade it",
      ],
      1,
      "No CISD means the swing point is not validated. A higher-timeframe reversal candle on its own is not proof — the proof lives inside the wick.",
      false,
    ),
    multi(
      "hard",
      "Which items belong on the ideal swing point formation checklist?",
      [
        "Occurs on a Candle 2 or Candle 3 closure",
        "Closes past the opposing series opening",
        "Simultaneously forms a protected swing",
        "Forms during the Asian session",
      ],
      [0, 1, 2],
      "The three structural conditions plus alignment with a higher-timeframe Point of Interest. Session timing is a separate filter, not part of the formation.",
    ),
    numeric(
      "med",
      "If an order block is too large to enter at its edge, at what percentage of the block do you enter instead?",
      "%",
      0,
      100,
      5,
      50,
      1,
      "The mean threshold is the 50% midpoint of the order block. It halves the distance to your stop while keeping the invalidation logic intact.",
    ),
    ordering(
      "hard",
      "Order the four phases of the AMD entry model.",
      [
        "Accumulation — a tight consolidation range builds",
        "Manipulation — an aggressive sweep out of that range",
        "Distribution — CISD formation confirms momentum",
        "Entry — retest of the validated Order Block",
      ],
      "The market builds a range, runs the stops on one side, genuinely shifts direction, then delivers. CISD is what proves distribution has begun.",
    ),
    tf(
      "med",
      "True or false: when a trade's risk feels too large, you should tighten the stop closer to your entry.",
      false,
      "False. Move the entry, not the stop. The stop sits at the invalidation point — moving it means you no longer know when you are wrong. Improve the entry instead.",
      true,
    ),
  ],

  // ── Module 5 ────────────────────────────────────────────────────────────
  "kc-daily-bias": [
    mcq(
      "easy",
      "What are the three daily anchor points?",
      [
        "Open, High, Low",
        "Previous Day High, Previous Day Low, and Equilibrium",
        "Asian, London and New York session highs",
        "Support, resistance and the trendline",
      ],
      1,
      "PDH, PDL and the EQ (the 50% midpoint between them). Mark all three before the session opens — bias comes from how price behaves relative to these lines.",
      true,
    ),
    mcq(
      "med",
      "In the continuation sequence, what does price 'respecting the EQ' tell you?",
      [
        "The trend has ended",
        "Buyers are defending the midpoint, supporting a bullish bias",
        "Volume is falling",
        "A reversal is imminent",
      ],
      1,
      "In a genuine bullish day price may dip but holds at or above equilibrium. Respecting EQ says buyers are defending it; the break of PDH then confirms the bias.",
      false,
    ),
    mcq(
      "med",
      "What is the Draw on Liquidity (DOL)?",
      [
        "The total volume traded in a session",
        "The price level or liquidity pool the market is actively pulled toward",
        "The spread between bid and ask",
        "The midpoint of the weekly range",
      ],
      1,
      "Naming the DOL turns a direction into a bias with a specific destination and a specific invalidation. 'Bullish' is not a bias; 'bullish, drawing to the previous week high' is.",
      true,
    ),
    mcq(
      "hard",
      "Price sweeps the previous week's low and reverses. Which pool becomes the draw?",
      [
        "The previous week low again",
        "The previous week high",
        "The monthly open",
        "There is no draw until Monday",
      ],
      1,
      "When one side's liquidity is taken and rejected, the opposite pool becomes the draw. Sweep the low and reverse, and the target becomes the previous week high.",
      false,
    ),
    multi(
      "med",
      "Which items are on the execution checklist?",
      [
        "Kill Zone",
        "Fair Value Gap",
        "Draw on Liquidity",
        "Number of indicators agreeing",
      ],
      [0, 1, 2],
      "Kill zone, fair value gap, stop, draw on liquidity and risk-to-reward. Indicator counting is not part of the framework.",
    ),
    numeric(
      "med",
      "In the London session, which minute-timeframe is the lower bound used for CISD confirmation?",
      "minutes",
      1,
      60,
      1,
      15,
      1,
      "London uses 15/30-minute CISD with a 4-hour closure. Matching the confirmation timeframe to session volatility stops you being both too slow and too twitchy.",
    ),
    ordering(
      "hard",
      "Order the four steps of the daily continuation sequence.",
      [
        "Mark the EQ and PDH boundaries",
        "Wait for the market to open",
        "Watch price trade lower and respect the EQ",
        "Price trades up and through the PDH",
      ],
      "Each step requires a completed observation, not an anticipated one. The impatient trader who acts at the open has no information — only volatility.",
    ),
    tf(
      "hard",
      "True or false: if you mechanically confirm the daily wick with a valid CISD, the trade cannot be wrong.",
      false,
      "False. You can mechanically confirm the wick and still be wrong. When bias and confirmation disagree, bias wins — execution precision cannot rescue a wrong directional read.",
      true,
    ),
  ],

  // ── Module 6 ────────────────────────────────────────────────────────────
  "kc-fractal-model": [
    mcq(
      "easy",
      "Complete the foundation rule: 'The market cannot reverse without ___.'",
      ["a news event", "a swing point", "high volume", "a gap"],
      1,
      "Every reversal on every timeframe requires a swing point to reverse from. If you cannot identify it, you are not looking at a reversal yet.",
      true,
    ),
    mcq(
      "med",
      "What is the T-Spot?",
      [
        "The exact price of the daily open",
        "The target area where a higher-timeframe wick forms before continuing the trend",
        "A candlestick pattern with three wicks",
        "The 50% level of the weekly range",
      ],
      1,
      "Anticipating the T-Spot means waiting at the price where the market is likely to dip before running, rather than chasing after the expansion has begun.",
      false,
    ),
    mcq(
      "med",
      "Which standard deviation zone is the primary projected target?",
      ["-0.5 to -1", "-1 to -1.5", "-2 to -2.5", "-6 to -8"],
      2,
      "-1 is the conservative first target, -2 to -2.5 is the primary objective, and -4 to -4.5 is maximum expansion reserved for large manipulation legs.",
      true,
    ),
    mcq(
      "hard",
      "Why should you ignore price levels that have already been taken when setting fractal targets?",
      [
        "They are hard to see on the chart",
        "Their liquidity has been consumed, so they no longer act as a magnet",
        "They always become support",
        "Brokers remove them from the feed",
      ],
      1,
      "A level price has already traded through is spent. Traders repeatedly target levels swept days earlier and wonder why price never reaches them — the orders are gone.",
      false,
    ),
    multi(
      "hard",
      "Select the three rows of the TTFM master cheat sheet.",
      [
        "Daily — bias — Candle 2 or 3 closure",
        "4-Hour — confirm wick — CISD and swing",
        "15-Minute — execute — protected swing",
        "1-Minute — scalp — any engulfing candle",
      ],
      [0, 1, 2],
      "Three rows, three jobs: the daily says which way, the 4-hour says when the pullback is done, the 15-minute says at what price.",
    ),
    numeric(
      "med",
      "Your manipulation leg runs from a low of 100 to a high of 120. At roughly what price is the -1 target?",
      "price",
      60,
      140,
      1,
      80,
      1,
      "The leg measures 20 points. The -1 projection is one full leg-length beyond the anchor: 100 - 20 = 80.",
    ),
    ordering(
      "med",
      "Order the three steps for anchoring a projection.",
      [
        "Wait for the Candle 2 closure and the delivery change",
        "Identify the manipulation leg — low to high",
        "Anchor the Fibonacci tool from low to high",
      ],
      "Anchoring before the closure means anchoring to a leg that has not finished forming, which moves every target.",
    ),
    tf(
      "hard",
      "True or false: if your daily shows a Candle 2 closure but the 4-hour never produces a CISD, you should take the trade anyway.",
      false,
      "False. No CISD is an explicit dealbreaker — no setup. Disagreement between timeframes means the market has not decided, and you are being invited to guess.",
      true,
    ),
  ],

  // ── Module 7 ────────────────────────────────────────────────────────────
  "kc-smt-divergence": [
    mcq(
      "easy",
      "What is SMT divergence?",
      [
        "A moving average crossover",
        "A structural divergence between correlated markets that should move together",
        "A gap between the open and the previous close",
        "Divergence between price and volume",
      ],
      1,
      "When correlated markets such as the Nasdaq and S&P 500 stop confirming each other's highs or lows, that correlation crack often precedes a reversal.",
      true,
    ),
    mcq(
      "med",
      "What is the Golden Rule of SMT?",
      [
        "Always trade the divergence immediately",
        "Establish your framework first, then look for SMT as confluence",
        "Only use SMT on the daily timeframe",
        "Trade only when three assets diverge",
      ],
      1,
      "Find a model first, then check whether it has SMT for confluence. Correlated markets diverge constantly; most of it means nothing away from a level your framework identified.",
      true,
    ),
    mcq(
      "med",
      "Which SMT type typically produces cleaner expansion?",
      [
        "Reversal SMT, between Candle 1 and Candle 2",
        "Continuation SMT, between Candle 2 and Candle 3",
        "Both are equally clean",
        "Neither produces expansion",
      ],
      1,
      "Continuation SMT confirms an existing move rather than calling a new one, so the expansion that follows is typically cleaner. Reversal SMT can be messy around the turn.",
      false,
    ),
    mcq(
      "hard",
      "Your target is a swing low on gold that has not printed, but silver has taken its equivalent low. What does the SMT exception say?",
      [
        "Keep waiting for gold to print the exact price",
        "The target has been hit — the liquidity has been consumed",
        "The setup is invalid",
        "Double the position size",
      ],
      1,
      "When a correlated asset takes out the low, the target has been hit. Waiting for your chart to print the exact price risks watching the reversal happen without you.",
      false,
    ),
    multi(
      "hard",
      "Select the documented reasons SMT trades fail.",
      [
        "Price opens high instead of low in a long setup",
        "Intraday action invalidates previous equilibrium",
        "Hunting for SMT without a valid timeframe model",
        "Using a correlated asset from the same sector",
      ],
      [0, 1, 2],
      "The premise breaking, EQ invalidation, and violating the Golden Rule. Same-sector correlation is exactly what SMT relies on, not a failure mode.",
    ),
    numeric(
      "med",
      "In the Double SMT setup, in which hour does the protected intraday swing form?",
      "hour",
      1,
      6,
      1,
      2,
      0.5,
      "Hour 1 manipulates price low, Hour 2 forms a new protected intraday swing with Double SMT, and Hour 3 expands cleanly into daily targets.",
    ),
    ordering(
      "med",
      "Order the three steps of the SMT workflow.",
      [
        "Wait for the model — a valid setup with proper candle closure",
        "Check the correlated asset for structural divergence",
        "Execute, using the SMT as secondary confluence",
      ],
      "SMT never promotes a bad setup into a good one; it strengthens a good one. Note 'secondary' in the final step.",
    ),
    tf(
      "med",
      "True or false: SMT divergence on its own is a sufficient reason to enter a trade.",
      false,
      "False. It is secondary confluence. Never traded in a vacuum — establish the framework first, only then look for divergence.",
      true,
    ),
  ],

  // ── Module 8 ────────────────────────────────────────────────────────────
  "kc-weekly-profiles": [
    mcq(
      "easy",
      "In a classic expansion week, which days form the weekly extreme?",
      ["Thursday or Friday", "Monday or Tuesday", "Wednesday only", "It varies randomly"],
      1,
      "The classic expansion week sets its high or low early — Monday or Tuesday — then expands, with Friday capping the range.",
      true,
    ),
    mcq(
      "med",
      "In an intraweek reversal, which day forms the actual pivot?",
      ["Monday", "Tuesday", "Wednesday", "Friday"],
      2,
      "Monday expands and sets the initial tone, Tuesday consolidates, Wednesday forms the actual reversal pivot, and Thursday/Friday deliver the continuations.",
      false,
    ),
    mcq(
      "med",
      "Why is consolidation NOT a reversal signature?",
      [
        "It always precedes a breakout upward",
        "Sideways price is indecision, not a turn",
        "It only happens on Fridays",
        "Consolidation cannot be measured",
      ],
      1,
      "A quiet, tight range feels like a pivot forming, but it is not evidence. A Candle 2 closure signals a reversal; consolidation signals indecision.",
      false,
    ),
    mcq(
      "hard",
      "What makes a three-day Monday–Wednesday run vulnerable to a Thursday counter?",
      [
        "It produced no significant counter-swing, so it has no supporting structure",
        "It always happens after a bank holiday",
        "Volume is too high",
        "The weekly open was gapped",
      ],
      0,
      "A healthy trend leaves protected swings behind it. A one-way run with no meaningful counter-swing has no structure supporting it — and invites a counter at the Thursday close.",
      false,
    ),
    multi(
      "hard",
      "In which weekly profiles is Friday a trading day rather than a day to avoid?",
      [
        "The Thursday Counter",
        "The Consolidation Reversal",
        "The Classic Expansion Week",
        "The Midweek Reversal",
      ],
      [0, 1],
      "In both the Thursday Counter and the Consolidation Reversal the week's expansion only begins late, so Friday delivers. In a classic expansion week Friday is spent.",
    ),
    numeric(
      "easy",
      "In a consolidation reversal, on which day of the trading week does the manipulation occur? (Monday = 1)",
      "day",
      1,
      5,
      1,
      4,
      0.5,
      "Monday to Wednesday consolidate in a tight range, Thursday (day 4) manipulates the range and forms the reversal, and Friday expands.",
    ),
    ordering(
      "med",
      "Order the days of the classic expansion week by what they do.",
      [
        "Mon–Tue — retrace, oppose bias, form the wick and confirm",
        "Wed — aggressive expansion (Candle 3)",
        "Thu — secondary continuation (Candle 4)",
        "Fri — cap the range with a TGIF retracement; avoid trading",
      ],
      "The four-candle sequence from Module 3 maps directly onto the trading week. Monday/Tuesday are the reference and the sweep.",
    ),
    tf(
      "hard",
      "True or false: when a weekly setup degrades from perfect to messy, you should lower your evidence requirement to keep trading.",
      false,
      "False. As the setup degrades, the evidence requirement RISES — from a daily Candle 2 with hourly CSD, to an hourly close, to waiting for the Thursday close.",
      true,
    ),
  ],
};
