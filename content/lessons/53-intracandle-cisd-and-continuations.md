# Lesson 53 — Intracandle CISD and Trading Continuations

**Module 11: The Fractal Model** · Video: `to be recorded` · Walkthrough: `continuation-model` · Prerequisites: Lesson 52

> Educational content only. All charts are illustrative or simulated. Not financial advice.

## What you'll learn

- What an intracandle CISD is, and how it lets you act inside a higher-timeframe candle instead of waiting for its close
- The continuation trade: joining Candle 3 and Candle 4 instead of catching Candle 2
- Using order blocks and the previous candle's equilibrium to refine continuation entries
- Why continuations are the trades to build a record on

---

## Reversal or continuation

There are two kinds of trade in the model. Reversal trades catch the swing: Candle 2, the T-Spot, the inversion trigger. They pay the most per trade and they fail the most, because you're trading against the move that's in progress.

Continuation trades join an expansion that's already confirmed: Candle 3 and Candle 4. They pay less per trade and they fail less, because the direction has already been decided by a close you can see. TTrades' New York guidance from Lesson 51 (15-minute for continuations) exists because continuations don't need the fine resolution; they need discipline.

If you're building a track record, build it on continuations. The reversal trades come later, when the continuations are paying for them.

## The intracandle CISD

Here's the tool that makes continuations tradeable without waiting an hour for a close.

> **Intracandle CISD (IC-CISD).** A change in the state of delivery that forms on the lower timeframe inside the higher-timeframe candle you're reading, before that candle has closed.

In Lesson 7 you learned CISD as a close-based rule: a candle closes through the opening price of the last run of opposing candles, and delivery has changed hands. IC-CISD is the same rule, applied on the 5-minute inside a still-open hourly candle. The hourly candle is Candle 3 or 4 of a bullish count. Inside it, price dips (the shallow retracement the Candle 3 equilibrium rule allows), and then a 5-minute candle closes above the open of the last down-run. That's the IC-CISD. The hourly candle hasn't closed, but its lower-timeframe delivery has already turned back up, and you can enter while the candle still has most of its range ahead of it.

Without IC-CISD, you'd wait for the hourly close, see it was an expansion candle, and enter the next one, having missed the move. With it, you enter the candle you're reading. That's the whole reason the fractal pairs exist.

## The continuation entry, step by step

For a bullish continuation on the hourly and 5-minute pair:

1. **The count.** The hourly has printed Candle 2 (sweep and close back) and Candle 3 (close above Candle 2's high). Direction is confirmed.
2. **The open.** Candle 4 opens in the upper half of Candle 3's range. If it opens in the lower half, be careful: the equilibrium rule (Lesson 49) is already under strain.
3. **The dip.** Inside Candle 4, price pulls back on the 5-minute. The pullback should stay above Candle 3's midpoint. Where does it stop? Usually at one of two places:
   - the **previous candle's equilibrium**: the 50% of Candle 3, which is the deepest a real expansion tolerates, or
   - an **order block** left by Candle 3's expansion on the 5-minute: the last down-close candle before the leg up (Lesson 11).
4. **The IC-CISD.** A 5-minute candle closes above the open of the run down into that level. Protected low formed.
5. **Entry** on the close or the retest. **Stop** under the protected low. **Target** Candle 3's high first, then the projections from the swing (Lesson 17).

## Order blocks and equilibrium for refinement

The two refinement levels in step 3 aren't interchangeable, and it's worth knowing which one you're looking at.

| Level | What it is | How price should treat it |
|---|---|---|
| Previous candle equilibrium | The 50% of Candle 3 | The floor. A dip to it is the deepest acceptable retracement; a close through it breaks the count. |
| 5-minute order block | The last opposing candle before Candle 3's expansion leg | The ideal. A dip into it, with the IC-CISD forming off it, is the cleanest continuation entry the model has. |

When the order block sits above the equilibrium, which is usual in a healthy expansion, you get two chances: the block first, the midpoint as the last line. When the dip goes through the block and stops at the midpoint, the entry is still valid but the expansion is weaker, and the near target (Candle 3's high) is the sensible one.

## Continuations across the pairs

The same continuation logic works one pair up. If the 4-hour has printed Candle 2 and 3, the 4-hour Candle 4 is a continuation, and each hourly candle inside it is a chance to join with an hourly and 5-minute setup. That's Lesson 51's alignment seen from the continuation side: the higher pair says "this is a Candle 4", the lower pair gives you the entry inside it.

## Why continuations are the record-builders

Three reasons, and they compound:

- **You're trading with a confirmed close.** Candle 3 has already told you the direction.
- **The invalidation is tight and logical.** Candle 3's midpoint, or the protected low from the IC-CISD. You know when you're wrong.
- **They happen more often.** Every expansion has one Candle 2 and a series of Candle 3s and 4s.

A journal full of continuations with 2R exits is how you find out whether you can execute. The reversals can wait until it says yes.

---

## Key terms

- **Intracandle CISD (IC-CISD)**: a lower-timeframe CISD inside a still-open higher-timeframe candle
- **Continuation trade**: joining Candle 3 or Candle 4 of a confirmed count
- **Previous candle equilibrium**: the 50% of the last candle; the deepest a continuation should retrace
- **Refinement order block**: the last opposing 5-minute candle before the expansion leg

## Common mistakes

- **Waiting for the hourly close on a continuation.** IC-CISD exists so you don't have to.
- **Entering a continuation from below the previous candle's midpoint.** The count is already breaking.
- **Treating a dip to equilibrium like a dip to the order block.** Same direction, weaker expansion, nearer target.
- **Building a record on reversals.** Start with the trades that fail less.

## Check your understanding

1. What's the difference between CISD as you learned it in Lesson 7 and an intracandle CISD?
2. Inside Candle 4, the pullback stops at Candle 3's 50% and a 5-minute IC-CISD forms. Is the entry valid, and which target should you take?
3. Why does the model recommend building a track record on continuations rather than reversals?

**Next:** [Lesson 54, The TTFM Trade, End to End](54-the-ttfm-trade-end-to-end.md)
