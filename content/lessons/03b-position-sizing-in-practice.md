# Lesson 3b — Position Sizing in Practice

**Module 3: Risk & Position Sizing** · Video: `Perfect_Position_Sizing_in_TradingView.mp4` (4:06) · Prerequisites: Lesson 3a

> Educational content only. All charts are illustrative or simulated. Not financial advice. This lesson describes configuring a charting tool for study on simulated data — TradeMind Academy never connects to a broker and never handles funds.

**A note on this lesson.** A screen-recorded walkthrough with little on-screen text; the written version captures the parameters and the method rather than every click.

## What you'll learn

- The three numbers that define your risk parameter
- How to turn a stop distance into a position size
- Saving the setup as a reusable template
- Why inconsistency, not strategy, destroys the equity curve

---

## Inconsistent risk destroys profit

The opening chart makes Lesson 3a's point concrete:

| Trade | Result |
|---|---|
| Trade 1 | Loss |
| Trade 2 | Win |
| **Net cumulative** | **Negative** |

One win and one loss, and the account is down — because the loss was sized larger than the win. The strategy was not the problem.

## Your three parameters

Everything follows from three numbers you decide **before** the session:

| Parameter | Example |
|---|---|
| **Capital base** | $100,000 |
| **Exposure %** | 2.5% |
| **Risk per trade** | $150 |

- **Capital base** — the account the percentages apply to.
- **Exposure %** — how much of it may be at risk overall.
- **Risk per trade** — the fixed monetary amount from Lesson 3a, the *account parameter* the whole method hangs on.

Set them once. They do not change trade to trade, and they especially do not change after a loss.

> A conventional starting point in trading education is risking a small, fixed **percentage** of the account per trade, so the monetary amount shrinks automatically during a losing run. Whatever figure you choose, the discipline is the same: decide it in advance and hold it.

## Turning a stop into a size

The mechanical step, done for every trade:

1. **Place the stop where structure says** — beyond the protected swing (Lesson 9).
2. **Measure the distance** from entry to stop, in points or ticks.
3. **Divide the risk amount by that distance** to get the quantity.
4. **Enter that quantity** in the order ticket.

`position size = risk per trade ÷ (distance to stop × value per point)`

The tool shown does this arithmetic for you: set the risk parameter, drag the stop to the level structure dictates, and it returns the **lot size** — 1000 in the walkthrough's example, 2 contracts in Lesson 3a's.

The point is not the software. It is that the quantity is *calculated*, never chosen by feel.

## The risk template

Rather than repeating the setup each time, the walkthrough saves it as a **risk template** in the charting tool: the risk amount, the default stop behaviour and the display settings, stored once and reapplied to every new chart.

Two reasons this matters:

- **Consistency** — the same parameter is applied automatically, so discipline does not depend on remembering.
- **Speed** — the sizing decision is made before the market moves, not during it.

## Tracking it

The trade log shown pairs each entry with its P&L and the **available margin** remaining — a running check that exposure is inside the limit set at the start. A row of losses that each cost roughly the same amount is a system working as designed; a row where the losses vary wildly is the failure mode from Lesson 3a.

---

## Key terms

- **Capital base** — the account value the risk percentages apply to
- **Exposure %** — the share of capital that may be at risk
- **Risk per trade** — the fixed amount risked on any single position
- **Lot size / quantity** — the calculated output, not an input
- **Risk template** — a saved configuration that applies the parameters automatically
- **Available margin** — capital not currently committed

## Common mistakes

- **Choosing quantity first, then placing the stop to suit it.** Exactly inverted.
- **Adjusting the risk parameter mid-session** — usually upward, usually after a loss.
- **Skipping the template** and re-deciding by hand each time, which is where inconsistency creeps back in.

## Check your understanding

1. Name the three parameters you set before a session.
2. You risk $150 and your stop is 30 points away, at $1 per point. What quantity do you take?
3. Why is the position size an *output* of the process rather than an input?

**Next:** [Lesson 5 — The Candle 2 Closure](05-the-candle-2-closure.md)
