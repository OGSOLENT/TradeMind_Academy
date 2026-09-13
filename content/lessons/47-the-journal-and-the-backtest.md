# Lesson 47 — The Journal and the Backtest

**Module 15: Execution & Review** · Video: `to be recorded` · Walkthrough: `journal-backtest` · Prerequisites: Lesson 46

> Educational content only. All charts are illustrative or simulated. Not financial advice.

## What you'll learn

- The fields a useful journal actually needs, and the ones it doesn't
- A weekly review that takes twenty minutes
- How to backtest one model by hand, and how many samples is enough
- Why this course's own numbers work the same way

---

## The question this lesson answers

Every lesson so far has said some version of "the journal will tell you". This one builds the journal, and the backtest that feeds it. Without them, everything else in the course is opinion.

## What a journal is for

A journal isn't a diary. It's a dataset. Its job is to answer questions you'll have in a month: does the Silver Bullet work for me on Fridays? Do my turtle soups fail more on NQ than ES? Am I moving to break-even too early? You can't answer those from memory, because memory is a story, and a story remembers the wins.

## The fields

Keep it small enough that you'll fill it in every time.

| Field | Why |
|---|---|
| Date and session | Time is half the method |
| Market | Instruments behave differently |
| Model | 2022, turtle soup, Silver Bullet, breaker. One word. |
| Bias and whether it agreed with the trade | The single biggest filter |
| Entry, stop, target, in price | The plan, as written |
| Risk in R and in money | Module 3 |
| Outcome in R | Not money. R. |
| Management notes | Partial taken? Break-even moved? When? |
| One line of what went right or wrong | Only one. Long notes don't get read. |
| A screenshot | Before and after |

That's ten fields, and you can fill it in ninety seconds. The screenshot is the one people skip and the one that matters most at review time.

## The weekly review

Every weekend, twenty minutes, the same questions:

1. **How many trades, and how many followed the written plan?** Plan-following rate is the number to care about most in your first year. A losing week of plan-following trades is fine. A winning week of improvised ones is the problem.
2. **Win rate and average R, by model.** Which model paid? Which didn't?
3. **The two worst trades.** Read the one-line note. Is it the same note as last week?
4. **One change for next week.** One. Written at the top of next week's page.

## The backtest

A backtest is the journal filled in from history instead of from live trading. Pick one model, one market, one session. Scroll back, bar by bar, and record every setup the rules would have taken, wins and losses alike, in the same ten fields.

Rules for doing it honestly:

- **Rules first, then scroll.** Write the model's rules down before you look, so you can't bend them to what you see.
- **Bar by bar.** Hide the future. If you can see the outcome, you'll see the setup differently.
- **All of them.** Every setup that met the rules, not the ones that worked.
- **Enough of them.** Somewhere around a hundred samples per model per market before the numbers mean anything. Two hundred is better.
- **Then live.** A backtested model goes to a demo account next, and only then to money.

The output is a win rate, an average R and, most importantly, a drawdown: the worst run of losses in a row. Module 3's fixed risk only works if you know the run you'll have to survive.

## Why this is the same thing the course does

TradeMind's own knowledge model is a journal. Every answer you give here is logged with the estimate before and after, and the model updates from the record, not from the impression. That's not a coincidence. The habit this lesson teaches is the same one the platform is built on: decide by data, and keep the data.

---

## Key terms

- **Journal**: the dataset of your trades, ten fields, every time
- **Plan-following rate**: the share of trades that matched the written plan
- **Backtest**: the journal filled in from history, rules first, bar by bar
- **Drawdown**: the worst run of losses; the thing your sizing has to survive

## Common mistakes

- **Writing essays.** One line. It'll get read.
- **Skipping losers in the backtest.** Then it isn't a backtest.
- **Looking before writing the rules.** You'll fit the rules to the chart.
- **Judging a model on twenty trades.** Get to a hundred.

## Check your understanding

1. Why is R, not money, the outcome column?
2. What is the first question of the weekly review, and why is it first?
3. Give two rules for an honest backtest.

**Next:** [Lesson 48, Psychology: Thinking in Probabilities](48-psychology-thinking-in-probabilities.md)
