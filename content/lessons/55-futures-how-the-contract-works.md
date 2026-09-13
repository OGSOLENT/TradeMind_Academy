# Lesson 55 — Futures: How the Contract Works

**Module 16: Markets, Instruments & Funding** · Video: `to be recorded` · Walkthrough: `tick-value` · Prerequisites: Lesson 3b

> Educational content only. All charts are illustrative or simulated. Not financial advice. Contract specifications and fees change; the numbers here were checked in September 2026 and you should confirm them with the exchange and your broker before you rely on them.

## What you'll learn

- What an index future actually is, and who's on the other side of your trade
- Point value, tick size and tick value for the contracts most people learn on
- Hours, expiry and the roll
- Margin, what it is and isn't, and where the real costs hide

---

## What you're buying

Everything in this course so far has been about reading a chart. This module is about the thing on the other end of the chart: the instrument. If you ever trade with money, real or a prop firm's, the instrument decides your costs, your hours, your leverage and your legal protection. It's worth a few lessons.

> **A futures contract is a standardised agreement, traded on an exchange, to buy or sell a fixed amount of something at a fixed date. For an index future, the "something" is a cash amount tied to the index level.**

Three words in that definition do the work. *Standardised*: every E-mini S&P contract is identical, so there's one price and one order book. *Exchange*: the contract trades on CME, the buyer and seller never meet, and the exchange's clearing house stands between them, so the person on the other side of your trade is the clearing house, not your broker. *Date*: the contract expires, and you either close it or roll to the next one.

For the trader this means one thing above all: **the price you see is the price everyone sees.** There's one central market. Your broker routes your order to it and charges you for the privilege; it doesn't make the price.

## The contracts you'll learn on

The equity index futures on CME come in a full size and a micro size, and the micro is exactly one tenth of the full.

| Contract | Symbol | Point value | Tick size | Tick value |
|---|---|---|---|---|
| E-mini S&P 500 | ES | $50 per point | 0.25 | $12.50 |
| Micro E-mini S&P 500 | MES | $5 per point | 0.25 | $1.25 |
| E-mini Nasdaq-100 | NQ | $20 per point | 0.25 | $5.00 |
| Micro E-mini Nasdaq-100 | MNQ | $2 per point | 0.25 | $0.50 |
| E-mini Dow | YM | $5 per point | 1.00 | $5.00 |
| Micro E-mini Dow | MYM | $0.50 per point | 1.00 | $0.50 |

Two definitions to keep apart:

> **Point value.** What one full index point is worth per contract. ES moves from 5000 to 5001: $50.

> **Tick.** The smallest price move the exchange allows. ES ticks in quarters, so 5000.00 to 5000.25 is one tick, worth $12.50. Four ticks make a point.

The arithmetic from Lesson 3b now has real numbers. A stop 10 points away on one ES contract risks $500. The same stop on one MES risks $50. That's why every beginner should start on the micros: the chart is identical, the tick is a tenth of the size, and the mistakes cost a tenth as much.

## Hours

CME equity index futures trade from **Sunday 18:00 ET to Friday 17:00 ET**, with a maintenance break every day from **17:00 to 18:00 ET**. That's 23 hours a day. The cash session, when the underlying stocks are open, is **09:30 to 16:00 ET**, and that's where most of the volume is. Everything in Lesson 36 about sessions and the true day open is drawn on this clock.

A useful consequence: because the futures market is open overnight, the "daily open" you use for Power of Three (Lesson 34) and the true day open (Lesson 36) are the 18:00 open and the midnight open, not 09:30. Traders coming from stocks get this wrong for months.

## Expiry and the roll

Each contract expires on the **third Friday of March, June, September and December**. The month codes are H, M, U and Z, so ESZ6 is the December 2026 E-mini S&P. Most volume moves to the next contract about a week before expiry, and when it does you should be on the new one, because the old one's order book empties out. Your platform usually shows a continuous chart that stitches contracts together; the small gap you see every three months is the roll.

## Margin

> **Margin on a future is a performance bond, not a purchase. You put up a deposit; you control the whole contract.**

Two numbers matter:

- **Exchange margin.** Set by CME and changed with volatility. It's what you need to hold a position overnight. For ES it has been in the low-to-mid five figures per contract in recent years; for MES a tenth of that.
- **Intraday (day-trading) margin.** Set by your broker, often far lower, sometimes a few hundred dollars for ES and around $50 for MES, on condition you're flat before the session close.

The intraday number is where the leverage comes from, and it's dangerous in exactly the way Lesson 3 described. A $500 margin on a contract worth $250,000 is 500:1. The contract doesn't care what your margin was; it moves $50 a point either way. Size from your stop and your risk in pounds or dollars, as in Lesson 3b, and let margin be a constraint you never get near.

## Where the costs are

Futures costs are visible, which is their best feature.

- **Commission**: per contract, per side, set by the broker. Discount brokers charge low single-digit dollars on the minis and under a dollar on the micros.
- **Exchange and clearing fees**: added to every trade, set by CME and the regulator.
- **Market data**: a live CME feed is a monthly subscription. Delayed data is free and useless for execution.
- **Slippage**: the difference between your intended price and your fill. On ES in the cash session it's usually a tick or nothing. Overnight, or on news (Lesson 39), it can be several.

There's no spread mark-up and no overnight financing charge, which is the biggest difference from the instruments in the next lesson.

## Who regulates it

In the US, futures are regulated by the CFTC, and brokers (futures commission merchants) are members of the NFA. UK and European traders usually reach CME through a broker that's regulated at home (the FCA in the UK) and clears through a US FCM. The clearing house guarantees the contract; your broker holds your money, and how well that money is protected depends on where the broker is regulated.

## Tax, briefly

This isn't tax advice, and the rules differ by country and by whether your trading counts as a business. In the UK, gains on futures are generally within Capital Gains Tax for an individual. In the US there's a specific regime (Section 1256) for regulated futures. Ask someone qualified before it matters.

---

## Key terms

- **Point value**: the dollar value of one index point per contract
- **Tick**: the minimum price increment; ES ticks in 0.25
- **Micro**: a contract one tenth the size of the E-mini
- **Roll**: moving from the expiring contract to the next one
- **Exchange margin**: the deposit to hold overnight, set by CME
- **Intraday margin**: the lower deposit brokers allow for day trades

## Common mistakes

- **Confusing tick value with point value.** One ES point is four ticks, $50, not $12.50.
- **Sizing from margin.** Size from the stop. Margin is a limit, not a guide.
- **Using 09:30 as the daily open.** The futures day opens at 18:00 ET and the true day open is midnight.
- **Trading the expiring contract.** Roll when the volume rolls.

## Check your understanding

1. A stop 8 points away on two MES contracts: how many dollars at risk?
2. What is the difference between exchange margin and intraday margin?
3. Which contract expires in December, ESU6 or ESZ6?

**Next:** [Lesson 56, CFDs and Spread Betting](56-cfds-and-spread-betting.md)
