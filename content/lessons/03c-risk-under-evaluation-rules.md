# Lesson 3c — Risk Under Evaluation Rules

**Module 3: Risk & Position Sizing** · Video: `Cracking_Prop_Firms.mp4` (10:43) · Prerequisites: Lessons 3a–3b

> Educational content only. All figures are illustrative. Not financial advice, and not an endorsement of any proprietary trading firm or evaluation product. Evaluation fees are a real cost and most candidates do not pass.

## What you'll learn

- What an evaluation account is and the rules it imposes
- Drawdown maths: turning a loss limit into a per-trade risk figure
- Why a 2:1 target and a strict cap survive a losing streak
- How external rules change nothing about the method

---

## Why this lesson exists

Lessons 3a and 3b taught fixed risk in the abstract. This one applies it to a case where the limits are **set by somebody else** and breaching one ends the account immediately. It is the clearest possible demonstration of why the sizing rule exists.

## The challenge — rules of the game

An evaluation account gives you simulated capital and a set of conditions:

| Rule | Example |
|---|---|
| **Cost** | $49 / month |
| **Profit target** | $3,000 |
| **Max loss limit** | $2,000 |
| **Max size** | 5 contracts |

Hit the profit target without breaching the loss limit and you pass. Breach the limit, even once, and the account is closed. The fee is not refunded.

Two honest observations before the maths. The monthly fee is a real cost that accrues whether you pass or not, and pass rates across the industry are low. Treat the numbers below as an exercise in constraint arithmetic, not a business plan.

## Risk parameters — mathematical survival

Here is the calculation that makes the constraint survivable:

| Step | Working |
|---|---|
| **Drawdown maths** | Divide the $2,000 loss limit by the number of trades you expect in a month — say 10 |
| **Set risk** | A strict **$200 maximum risk per trade** |
| **Target reward** | Aim for **2:1**, so a winner returns about $400 |

The point of dividing first is that it converts an external rule into a personal one. The firm says "never lose $2,000". You say "never lose more than $200, ten times". The second is a rule you can actually follow on a trade-by-trade basis.

### Surviving a losing streak

Take a brutal run of five consecutive losses at $200 each. That is $1,000 gone, half the limit, and the account is still alive with a **$1,200 buffer** remaining. Now a couple of 2:1 winners at $400 rebuild it.

Run the same streak with inconsistent sizing, where one of those losses is $800, and the account is finished before the recovery has a chance to happen. This is Lesson 3a's asymmetry with a hard floor underneath it.

## Executing the strategy

Nothing about the setup criteria changes. The evaluation constrains **size and frequency**, not method:

- The same protected-swing stop (Lesson 9)
- The same fixed risk, now capped by an external number
- The same 2R-style targets (Lesson 14a)

What changes is patience. With a fixed number of "lives", low-quality setups become expensive in a way they are not on an unconstrained account. The point-of-interest hierarchy (Lesson 11a) and the kill zones (Lesson 13a) are the filters that keep the trade count down.

## Managing live trades and final results

The video closes on the outcome: consistent sizing plus a 2:1 target means the account survives variance long enough for the edge to show. The reverse is the failure mode from Lesson 3a — a good win rate, wrecked by one oversized loss.

> The lesson is not "pass an evaluation". It is that a rule imposed from outside is only survivable if you have already imposed a stricter one on yourself.

---

## Key terms

- **Evaluation account** — simulated capital with a profit target and loss limits
- **Max loss limit** — the breach point that closes the account
- **Drawdown maths** — dividing the limit by expected trade count to get per-trade risk
- **Buffer** — the distance remaining between current loss and the limit
- **2:1** — a target of twice the risked amount

## Common mistakes

- **Sizing to the maximum allowed.** "Max 5 contracts" is a ceiling, not an instruction.
- **Increasing risk to hit the target faster.** The limit is hit first, reliably.
- **Treating the fee as sunk and therefore irrelevant.** It is a recurring cost that changes the expected value of the whole exercise.

## Check your understanding

1. A $2,000 loss limit and 10 expected trades a month. What is your per-trade risk?
2. After five losses at that risk, how much buffer remains, and what does that let you do?
3. What does an evaluation actually constrain, and what does it leave unchanged?

**Next:** [Lesson 5 — The Candle 2 Closure](05-the-candle-2-closure.md)
