# Lesson 29 — The PD Array Matrix

**Module 7: PD Arrays** · Video: `to be recorded` · Walkthrough: `pd-array-matrix` · Prerequisites: Lesson 28

> Educational content only. All charts are illustrative or simulated. Not financial advice.

## What you'll learn

- What a PD array is, and the full menu of them
- Which arrays live in premium and which in discount
- The order price tends to respect them in
- How the matrix replaces "support and resistance" with something you can actually rank

---

## The question this lesson answers

Lesson 11a gave you a hierarchy of points of interest. This lesson widens the list to the complete ICT set and gives you a way to rank them, so that when three levels are close together you know which one to trust.

## What "PD array" means

PD stands for premium and discount. An array is any price level the algorithm is likely to deliver to and react from.

> **A PD array is a level that sits in premium or discount and has a reason to be there: an old block, an unfilled gap, a pool of stops, a gap in time.**

Put the two words together and you get the idea in one line: every array is either a place to sell from (premium) or a place to buy from (discount). The same structure can be either, depending on which half of the range it sits in.

## The menu

| Array | What it is | Lesson |
|---|---|---|
| **Order block** | The last opposing candle before a displacement | 11 |
| **Breaker block** | An order block that failed and flipped sides | 30 |
| **Mitigation block** | A failed block without a sweep, used for continuation | 31 |
| **Rejection block** | The wick beyond a swing high or low, where price was refused | 31 |
| **Fair value gap** | Three candles with a gap between 1 and 3 | 7a |
| **Volume imbalance** | Bodies apart, wicks overlapping | 7a |
| **Liquidity void** | A large run with almost no overlapping candles at all | 29 |
| **Old high / old low** | Where the stops are | 3 |
| **Opening gaps (NWOG, NDOG)** | The gaps left at the new week and the new day | 33 |

A liquidity void is the big cousin of the fair value gap. Where a gap is three candles, a void is a whole run of them where price barely traded. It behaves like a gap: price tends to come back and fill it.

## The two stacks

Draw your dealing range and mark equilibrium. Everything above it is a premium array. Everything below is a discount array. In a bullish bias you're only interested in the discount stack, because that's where you're allowed to buy. In a bearish bias, the premium stack.

Reading it that way turns the chart from a mess of levels into two short lists, one of which you can ignore.

## Ranking them

When arrays are close together, ICT's matrix gives them an order. In a bullish leg, price retracing down will tend to reach for them in roughly this sequence, from shallow to deep:

1. Old low (a sweep of small liquidity first)
2. Rejection block
3. Order block
4. Fair value gap
5. Liquidity void
6. Breaker or mitigation block
7. The next old low, the deeper liquidity

That ordering isn't a law. It's a tendency, and it's most useful for one decision: where to expect the retracement to end. If price has already reached an order block and a gap and turned, you don't need to wait for the void. If it blows through them all, the liquidity below is the draw and you were wrong about the retracement.

## Time makes the array matter

The same array behaves differently at different times. A discount gap touched at 3am and one touched at 10am in New York are not the same trade. The time module covers this properly. For now, the rule of thumb: an array only counts when price arrives at it inside a window when the market is actually delivering.

## How to use the matrix day to day

1. Set bias. Draw the range. Mark equilibrium.
2. Mark only the arrays in the half you're trading from. Ignore the other half.
3. Rank them, shallow to deep.
4. Wait for price to arrive at the shallowest one inside a kill zone.
5. Look for the lower-timeframe confirmation from Module 5.

---

## Key terms

- **PD array**: a level in premium or discount with a reason to react
- **Premium stack / discount stack**: the arrays above and below equilibrium
- **Liquidity void**: a long run of non-overlapping candles, a large imbalance
- **Rejection block**: the refused wick beyond a swing point
- **Matrix**: the ranked order price tends to respect arrays in

## Common mistakes

- **Marking arrays in the wrong half.** A bullish bias only wants the discount stack.
- **Treating the ranking as a rule.** It's a tendency for where a retracement ends.
- **Marking everything.** Two short lists, not one long one.
- **Ignoring time.** An array outside a delivery window is a level, not a setup.

## Check your understanding

1. What do the P and D in PD array stand for, and why does it matter?
2. In a bullish bias, which stack do you mark?
3. Name two arrays that are variations of a failed order block.

**Next:** [Lesson 30, Breaker Blocks](30-breaker-blocks.md)
