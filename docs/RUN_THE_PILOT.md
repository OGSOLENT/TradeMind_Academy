# Run the pilot

One afternoon, five people, and the biggest gap in the dissertation closes. Everything is built, deployed and tested; this is a recruiting job, not a building job.

**Why it is worth more than any other remaining work.** Two of the four evaluation strands fixed at AE1 needed participants. Without them Objective 5 is unmet, RQ3 is answered on the design side only, and half of RQ2 is open. Five participants with honest caveats turns the weakest part of the report into a results section.

---

## Before the day (20 minutes)

```bash
npm run db:peek                # confirm the live database is reachable
```

Open https://tmacademyuk.vercel.app in a private window and click through sign-up once yourself to check nothing is broken. Then **delete that test account** from Settings so it does not pollute the data.

You need: five to eight adults, no trading experience required, each with about 45 minutes and their own laptop. Colleagues, coursemates and family all count as convenience sampling, which is what the approved design says.

## What you say to each participant

Read this out or paste it into a message. Do not coach beyond it.

> This is my final-year project: a trading tutor that builds a model of what you know and picks what to show you next. I would like about 45 minutes. You will make an account, take a short placement quiz, work through a couple of modules, take a second quiz, then answer ten questions about how it felt.
>
> It is education only. There is no real money, no live market data, and nothing to install. You must be 18 or over.
>
> Everything you do is recorded against a random ID for my dissertation: which questions you answered, whether you got them right, and how long you took. No names in the results. You can stop at any point and I will delete your data if you ask. The consent screen says all of this and Decline is a real button.
>
> Please work as you normally would. If something is confusing, that is a finding, so say it out loud rather than asking me what to do.

## The session (45 minutes)

| Step | What they do | Roughly |
|---|---|---|
| 1 | Sign up, read the consent screen, accept | 5 min |
| 2 | **Placement test**, 16 questions. Tell them there is no pass mark and guessing is fine | 8 min |
| 3 | Work through the dashboard's suggested lessons and practice. Let the tutor route them; do not steer | 20 min |
| 4 | Profile → **Take the post-test**, 16 questions | 8 min |
| 5 | Profile → **Rate the course**, the ten-statement questionnaire plus three open questions | 4 min |

Two rules for you: do not answer questions about the content during step 3, and do not tell them their score. Both would contaminate the measure. Note anything they say out loud, especially where they hesitate.

## After everyone has finished

```bash
npm run analyse:live
```

That writes `docs/report/PILOT_RESULTS.md`: per-participant placement and post-test scores, Hake's normalised gain, time on task, modules mastered, SUS score, the open answers, the model's held-out accuracy on post-test items, and the per-component learning curves.

## What to write up

Add a results subsection to Chapter 6 with the per-participant table and the summary table, then update:

- **Table 4.1**, the evaluation strands, flipping learning gain and usability from "instruments built" to completed
- **Section 6.7**, which currently states that no participant data was collected
- **Section 7.1**, Objective 5
- **Section 7.2**, RQ2 and RQ3
- **Chapter 8**, which currently lists running the study as the first recommendation

Report the spread and not only the mean, with n stated everywhere. With five participants this is feasibility evidence, not a powered trial, and saying so plainly is worth more than overclaiming.

**The first number to look at** is the held-out table: how often the model called a module mastered when the post-test says it was not. The routing simulation predicts roughly one module in sixteen. If the real figure is close, that is a genuine finding about the threshold and belongs in Chapter 7.

## If something goes wrong

- Someone abandons halfway: their rows still count. The analysis handles partial participation and reports it.
- Someone retakes the post-test: only the first completed attempt is used.
- You want to check progress mid-session: `npm run db:peek` from another terminal.
