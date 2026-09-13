# Lesson 52 — Entry Refinement: the 1-Minute Inversion inside the T-Spot

**Module 11: The Fractal Model** · Video: `to be recorded` · Walkthrough: `inversion-entry` · Prerequisites: Lessons 32 and 51

> Educational content only. All charts are illustrative or simulated. Not financial advice.

## What you'll learn

- The inversion fair value gap as the entry trigger inside the T-Spot
- Exactly where the stop goes and why it's tighter than a swing stop
- The three exits the model uses: 2R, the next higher-timeframe open, or the projected close
- The one timing rule that stops you taking inversions that are already too late

---

## From zone to trigger

Lessons 16 and 49 to 51 get you to a zone: the T-Spot on the hourly, with the 4-hour bias behind it and the 5-minute CISD confirming the swing. That's a trade. But the entry inside that zone can be anywhere across a dozen 5-minute candles, and the difference between the top and the bottom of the zone is your whole risk.

The refinement drops one more timeframe, to the 1-minute, and waits for a specific event: the inversion of a fair value gap. You met inversions in Lesson 32. Here they're used as the trigger.

> **For a long: price closes above a bearish fair value gap inside the T-Spot. For a short: price closes below a bullish fair value gap inside the T-Spot.**

Think about what that close means. The 1-minute chart, on the way down into the T-Spot, left bearish gaps behind it, each one a small imbalance from the selling. When a 1-minute candle closes back up through one of those gaps, the selling that made the gap has been overrun. It's a CISD in miniature, and because it's on the 1-minute it happens with a few points of range, not twenty.

## The sequence

1. **Bias** from the pair above (Lesson 51).
2. **T-Spot** marked on the higher timeframe of your pair (Lesson 16), with the wick expected to form inside it.
3. **5-minute CISD** confirms the swing inside the T-Spot: a protected low (for a long) now exists.
4. **1-minute inversion**: a bearish fair value gap on the 1-minute, formed on the way down, is closed above.
5. **Entry** on the close of the inversion candle, or on the retest of the inverted gap if you want a better price and can accept missing it.
6. **Stop** at the invalidation point: just under the low that the inversion formed from. For a short, just above the high.
7. **Exit** by one of the three rules below.

Steps 1 to 3 are the setup. Step 4 is the trigger. Steps 5 to 7 are the trade. If step 4 never comes, there's no trade, however good steps 1 to 3 looked.

## The stop

> **Stops go just on the invalidation point: under the low for longs, above the high for shorts, based on the inversion trigger.**

This is tighter than the swing stop you used in Lesson 9, and that's the point of the refinement. The 1-minute low that the inversion formed from is the last low before the gap was closed through. If price trades back below it, the inversion has failed and the 1-minute story is wrong, even if the hourly story is still alive. You take the small loss and, if the T-Spot is still valid, you wait for the next inversion. Two small losses inside the zone cost less than one swing stop, and the winner pays for both.

## The three exits

The model gives three ways out, and you pick one before the entry, not during.

| Exit | When to use it |
|---|---|
| **2R.** Take profit at twice the risk. | The default. Mechanical, repeatable, easy to backtest. |
| **Time-based.** Exit at the next higher-timeframe open, for example the next hourly open if you're trading the hourly model. | When the candle's story is the trade. The hourly candle closes; so does the trade. |
| **The projected close.** Hold into the projected expansion, using the standard deviation targets from Lesson 17. | When the profile (Lesson 50) says expansion: small early wick, big body building, bias aligned. |

The time-based exit deserves a word. It sounds odd to exit a winning trade because the clock says so. But you entered because an hourly candle was expected to expand. When that candle closes, the reason for the trade has closed with it. The next candle is a new story, and if it's also an expansion candle you can trade that one on its own terms.

## Don't be late

> **Avoid inversions too late into the higher-timeframe candle. Expansion candles have small wicks created early into the candle.**

This is the timing rule from Lesson 50, applied to the trigger. If the hourly candle opened at 10:00, an inversion at 10:08 is early: the wick is forming, and fifty minutes of candle remain to expand in. An inversion at 10:52 has eight minutes of candle left. Whatever it does, it does mostly in the next hour, and the next hour hasn't shown you its profile yet. Skip it, and read the 11:00 candle fresh.

A practical cut-off: if the inversion arrives in the last quarter of the higher-timeframe candle, it's late.

## Why the refinement is optional

You can trade the model without the 1-minute. The 5-minute CISD and a swing stop is a complete trade, and it's the one to learn first. The refinement buys a tighter stop, so a bigger position for the same risk, at the cost of more stop-outs inside the zone and more screen time. Add it when the 5-minute version is boring, which is the sign it's working.

---

## Key terms

- **Inversion trigger**: a 1-minute close through a fair value gap, against the direction that made it
- **Invalidation point**: the 1-minute low (or high) the inversion formed from; the stop goes just beyond it
- **2R exit**: profit target at twice the risk
- **Time-based exit**: closing at the next higher-timeframe open
- **Projected close**: holding into the standard deviation targets
- **Late inversion**: a trigger in the last quarter of the higher-timeframe candle

## Common mistakes

- **Entering on the T-Spot without a trigger.** The zone is where; the inversion is when.
- **Using the swing stop with the refined entry.** You paid for the tight stop; use it.
- **Choosing the exit after the entry.** Pick it before, and follow it.
- **Taking a late inversion.** The candle you're trading is nearly over.

## Check your understanding

1. For a long, what exactly has to happen on the 1-minute chart inside the T-Spot?
2. Where does the stop go, and why is it tighter than a swing stop?
3. Name the three exits, and say which one the profile in Lesson 50 would point you to for an expansion candle.

**Next:** [Lesson 53, Intracandle CISD and Trading Continuations](53-intracandle-cisd-and-continuations.md)
