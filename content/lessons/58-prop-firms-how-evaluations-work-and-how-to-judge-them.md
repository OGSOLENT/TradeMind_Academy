# Lesson 58 — Prop Firms: How Evaluations Work and How to Judge Them

**Module 16: Markets, Instruments & Funding** · Video: `to be recorded` · Walkthrough: `drawdown-types` · Prerequisites: Lessons 3c and 57

> Educational content only. Not financial advice, and not a recommendation to buy an evaluation from anyone. Firms named here are examples; their rules change often and some close without warning. Every fact with a date was checked in September 2026. Verify the current terms yourself before paying a fee you can't afford to lose.

## What you'll learn

- What a "funded account" actually is, and where the money comes from
- Every rule type you'll meet: targets, daily loss, the three kinds of drawdown, consistency, payouts
- What the regulators have done and not done, up to 2026
- A framework for judging a firm against your own situation, rather than a ranking

---

## What you're actually buying

> **A retail prop firm sells an evaluation: you pay a fee, trade a simulated account under the firm's rules, and if you hit its profit target without breaking a rule, it gives you a "funded" account and a share of the profits you make on it.**

Two things about that sentence that the adverts leave out.

First, the funded account is almost always simulated too. Your trades don't go to the exchange. The firm pays your profit share from its own money, which is mostly the evaluation fees of the people who didn't pass. That's not a scandal, it's the model, but it means your payout depends on the firm staying solvent and willing.

Second, the fee is the product. Pass rates at most firms are low, and the firm's revenue is the fee. When you pay it, treat it the way Lesson 3c told you to treat risk: money you can lose in full.

None of this makes evaluations a bad idea. For someone who can execute but can't fund a $50,000 account, a $150 evaluation is a rational way to trade size. It just has to be understood for what it is.

## The rules you'll meet

Every firm has its own numbers, but the rule types are the same everywhere.

**Profit target.** What you have to make to pass, usually 6 to 10 per cent of the account, or a fixed dollar amount on futures accounts (for example $3,000 on a $50,000 account).

**Daily loss limit.** The most you can lose in one day before the account is closed. Not every firm has one; some futures firms have dropped it.

**Maximum drawdown.** The floor under your account. This is the rule that ends most attempts, and it comes in three kinds. The walkthrough draws all three on the same equity curve.

| Drawdown type | How the floor moves | Who it punishes |
|---|---|---|
| **Static** | Never. The floor is a fixed number below the starting balance. | Nobody unfairly. Rare and generous. |
| **End-of-day trailing** | Rises with your closed balance at the end of each day, until it reaches the starting balance and locks | Swing traders who give back closed profit |
| **Intraday trailing** | Rises with your highest *unrealised* balance, tick by tick | Anyone whose trades go into profit and come back. The harshest kind. |

Intraday trailing deserves a second look. If your trade is $1,500 in profit and you take $800, the floor has already moved up as if you'd banked $1,500. Give back $700 and you're at the floor. Scalpers with wide stops and runners get killed by this rule while doing nothing wrong by their plan.

**Consistency rule.** No single day may be more than a set share of your total profit, commonly 30 to 50 per cent. It exists to stop one lucky day passing an evaluation; it also means you can't pass in a day even if you could.

**Minimum trading days**, **news restrictions** (no trades around scheduled releases; Lesson 39), **weekend holding** rules, **maximum position size** that scales with profit, and **activation fees** or **reset fees** on top of the evaluation price.

**Payout terms.** The split (80 to 90 per cent is common; several firms moved to 90 per cent or more in 2025 and 2026), the frequency (monthly used to be normal; daily or weekly is now common on futures firms), a first-payout delay, a cap on early payouts, and the conditions under which a payout can be denied. The last one is in the terms and conditions, and it's the paragraph to read first.

## What the industry looks like, as of 2026

A few dated facts, because the picture changes fast.

- **Consolidation.** Somewhere between 80 and 100 retail prop firms closed or exited between 2024 and mid-2026. SurgeTrader shut in May 2024 and MyFundedFX discontinued its prop operations in February 2026 after being acquired; in both cases traders with pending payouts were left unpaid.
- **Rule changes at the large futures firms.** Between July 2025 and March 2026 Topstep moved to a 90/10 split and introduced a no-activation-fee evaluation; Apex overhauled its rules on 1 March 2026 (one-time payments instead of subscriptions, a choice of end-of-day or intraday drawdown, a 50 per cent consistency rule); MyFundedFutures replaced its plans in July 2025 with Core, Rapid and Pro tiers.
- **Competition on payouts.** New entrants in 2026 lead with daily payouts and 90 to 100 per cent splits, which has pushed the whole market that way.

Read those as illustrations of how quickly terms move, not as a list of firms to use.

## What the regulators have done

**United States.** In August 2023 the CFTC charged My Forex Funds with fraud. On 13 May 2025 a federal court dismissed the case with prejudice and sanctioned the CFTC for misrepresenting a tax payment as asset dissipation. The court judged the regulator's conduct, not the business model, and the CFTC is still debating whether evaluation-fee firms should have to register. Nothing has been settled in the firms' favour; nothing has been settled at all.

**Europe and the UK.** There's no prop-firm rulebook. ESMA's and the FCA's product intervention on CFDs applies through the leverage caps (Lesson 56), and the FCA's financial-promotions regime applies to anyone marketing to UK retail traders. National regulators, BaFin in Germany and Consob in Italy among them, have published warnings about high-leverage CFDs marketed through prop firms. No jurisdiction has banned the model; several treat it as inside their perimeter.

The practical meaning: a prop firm's promise that "no client money touches live markets" is not the protection it sounds like. Your fee is real money, the firm is usually unregulated as an investment business, and if it closes, you're an unsecured creditor.

## How to judge a firm for you

This is a framework, not a ranking, because the right firm depends on how you trade. Answer these in order.

**1. Does it match your instrument and platform?** Futures firms run on futures platforms with real-time CME data; CFD firms run on MetaTrader or cTrader. If you learned on ES, a CFD firm quoting "US500" is a different instrument (Lesson 57).

**2. Does the drawdown rule fit your style?** Scalper with tight stops: intraday trailing is survivable. Trend trader who lets winners run: you need end-of-day or static, or the trailing floor will take you out while you're right. This one question removes most firms from most people's lists.

**3. Can you actually follow the rules?** Consistency rules punish a good day. News rules punish a Lesson 39 setup. Weekend rules punish a swing. If your plan breaks a rule on a normal week, it's the wrong firm, however good the split.

**4. Does it pay?** Look for a public payout history of at least two years, a first-payout delay you can live with, and denial conditions you've read. Search the firm's name with "payout denied" and read the pattern, not the loudest post.

**5. How stable is it?** Two or more years operating, a known legal entity, a named jurisdiction, and no regulator warnings. A firm that launched this year with the best terms on the market is the one most likely to be gone next year.

**6. What does an attempt really cost?** Evaluation fee, plus resets, plus activation, plus data, plus the platform. Multiply by the number of attempts an honest person needs, which is usually more than one.

**7. Can you do the arithmetic?** An 8 per cent target with a 4 per cent trailing drawdown means you need to be up two units before you can afford to be down one. With 1 per cent risk per trade, four losses in a row ends the attempt, and Lesson 48 told you how often four losses in a row happen. Size at half a per cent or less, and go back to Lesson 3c.

## Which type fits which trader

| Your situation | The type that tends to fit |
|---|---|
| New York index trader, tight stops, flat by the close | A futures firm with an end-of-day drawdown and no news restriction |
| London-session FX or gold trader | A CFD firm, checking its execution and its news rules first |
| Trend or swing trader holding overnight | End-of-day or static drawdown, explicit weekend-holding permission, or no prop firm at all |
| Can fund £1,000 to $2,000 yourself | A broker account on the micros: no rules, no fee, no counterparty risk beyond the broker |
| Can't fund anything and can't afford to lose the fee | Stay in demo. The fee is the loss you can't take. |

## The honest paragraph

An evaluation is a leverage product with a subscription fee. It can be a sensible way to trade size for someone whose journal (Lesson 47) already shows A-grade execution over fifty trades. For anyone else it's a faster way to pay for lessons the demo would have taught for free. The course can't make you pass one, and no course, firm or method can promise you'll be profitable. What it can do is make sure you know exactly what you're buying.

---

## Key terms

- **Evaluation**: the paid, simulated test with a profit target and rules
- **Funded account**: the post-evaluation account, usually still simulated, paying a profit share
- **Static drawdown**: a fixed floor
- **End-of-day trailing drawdown**: a floor that follows closed balance daily
- **Intraday trailing drawdown**: a floor that follows unrealised balance tick by tick
- **Consistency rule**: a cap on one day's share of total profit
- **Counterparty risk**: the chance the firm can't or won't pay

## Common mistakes

- **Picking by the split.** 90 per cent of nothing is nothing. Pick by drawdown type and payout history.
- **Sizing for the target instead of the drawdown.** The floor ends attempts, not the ceiling.
- **Trusting "no client money touches live markets".** Your fee is client money.
- **Paying for an evaluation before the demo journal says A.** The firm is charging you for what the demo would tell you for free.

## Check your understanding

1. Under an intraday trailing drawdown, your trade reaches $1,500 in unrealised profit and you close it at $800. Where has the floor moved to, relative to before the trade?
2. What did the May 2025 court decision in the My Forex Funds case decide, and what did it not decide?
3. A trend trader who holds positions for two days is choosing between a firm with intraday trailing drawdown and one with end-of-day drawdown. Which fits, and why?

**Next:** back to the [curriculum](00-CURRICULUM.md)
