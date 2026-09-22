# TradeMind Academy: Demonstration Script

**Ogechukwu Adama, 10440379** · Module QHO656 Dissertation Project · Supervisor: Prashant Bikram Shah
**Live:** https://tmacademyuk.vercel.app · **Source:** https://github.com/OGSOLENT/TradeMind_Academy

Written for a fifteen minute slot with questions after. The clock is in the margin, and there's a ten and a twenty minute version at the back. Every stage carries a screenshot of the exact screen you should be looking at while you say those words.

**What this is meant to do.** Show that the thing works, explain how it got built, and be straight about what the evidence does and doesn't support. It isn't a summary of the report and it shouldn't sound like one.

# Before you record

Do this every single time, including the take that counts. Demos mostly fail because of the machine, not because of nerves.

**Twenty minutes before.** Restart, or at the very least close everything you aren't using. Then one terminal and one command:

CODE: cd ~/Documents/DIssertation/TradeMind_Academy && npm run stop && npm run dev

That gives you the real application. Live database, real Google sign-in, port 3000. And the port guard won't start if something's already sitting on that port, which is exactly what you want it to do.

**Demo locally, show the live URL.** The recordings are hosted now, so the deployed site plays them fine, but local is faster and there's no network sitting between you and a video. Put the live URL up once near the end, as proof the thing actually ships.

**Tabs, in this order.** localhost:3000 on the landing page. The Firebase console on Firestore, which `npm run db` opens for you. The GitHub repo. VS Code with `lib/bkt/index.ts` already open. And `docs/EVALUATION.md` scrolled down to the routing policy simulation.

**Do a throwaway run first.** Sign in, click through a lesson and a practice session, then close the tab. It warms every route so nothing has to compile while you're on camera. If you only do one thing off this list, do this one.

**Recording setup.** Share the whole screen rather than a window. Browser at about 125 per cent. Kill Slack, mail and notifications. Test the mic for ten seconds and play it back before you trust it. Water somewhere off camera.

---

# 1. Opening

**0:00 to 1:10**

> My name's Ogechukwu Adama, and what I want to show you is TradeMind Academy. It's an intelligent tutoring system for trading education, and it's the artefact behind my dissertation.
>
> I'll start with why it exists, because that decides everything that comes after.
>
> If you go looking for trading education online right now, what you get is a pile of videos. Same videos, same order, for everybody. Nothing in the system has any idea who you are, and you move forward by clicking rather than by proving you understood anything. That's a weak design in any subject. In this one it's worse, because the evidence on retail trading is pretty bleak. Most day traders lose money, and one large study found no sign that traders get better with experience at all. Which tells you something useful. The market is a terrible teacher. It pays you late, it buries the signal in noise, and quite often it rewards the wrong decision and punishes the right one.
>
> So my question was whether a Bayesian Knowledge Tracing model can run a real adaptive loop in this domain. And then, separately, whether the system can produce evidence good enough to say if that adaptation is worth anything.
>
> That second half is the part I'd ask you to hold on to. Building something that feels adaptive is easy. Showing it does something is not.
>
> I'll take you through the loop, then into the code, then through the evidence. Roughly fifteen minutes, and then I'm happy to take whatever you want to throw at me.

**Delivery.** This is the only part where you get to set up why any of it matters, so don't rush it. Slow right down on the two questions.

FIG: docs/report-figures/01-landing.png | **Stage 1.** The landing page at localhost:3000. Stay here while you talk. Don't scroll.

---

# 2. The ethics gate

**1:10 to 2:10**

Click **Start free**, fill the sign-up form.

> Before I show you any learning, I want to show you what sits in front of it. Because this is a research artefact in a regulated space, and that shaped the build more than anything else did.
>
> Every chart in here is either simulated or a labelled historical case study. There's no broker connection, no signals, no live prices, and you have to be eighteen.

Try to submit without ticking the box. Let the error show.

> That's blocked in the interface. But it's also blocked down in the database rules, so you can't get round it from a console either. And the same gate sits on the Google button, which matters, because someone signing in with Google never sees this form at all.

FIG: docs/report-figures/02-sign-up.png | **Stage 2a.** The sign-up form. Point at the 18+ checkbox before you deliberately fail the submit.

Tick, submit. The consent screen appears.

> Then consent, and this is real GDPR copy rather than a formality. It tells you what gets recorded, that the lawful basis is consent, and that you can withdraw. Decline isn't decoration either. Press it and you're signed out and nothing is kept.
>
> I'm going to accept, or this becomes a very short demonstration.

FIG: docs/report-figures/03-consent.png | **Stage 2b.** The consent screen. Point at Decline as you say it's real, and at the "simulated or clearly labelled historical" line.

**Delivery.** Do the failed submit live. Showing the gate beats describing it, and it only works if you've practised the timing.

---

# 3. Placement, and the model initialising

**2:10 to 3:30**

> Now here's where it gets interesting. I haven't read a single lesson yet, so the system has no idea what I know. It needs a starting estimate before it can make any decision at all. So it asks.

Start placement. Answer the first two out loud.

> Sixteen modules, so sixteen questions, pulled from the thirty-six items I've marked as eligible for testing. And I'm going to get a couple wrong on purpose, because a model that only ever goes up isn't showing you much.

Answer the rest quickly, missing two deliberately.

FIG: docs/report-figures/04-placement.png | **Stage 3a.** A placement question. Answer two or three on camera, then say you'll speed up.

> And this next bit is my favourite thing in the whole product.

The initialisation plays.

> That's the model waking up. Every node is a module, and the ring around it is the probability that I know it, worked out from the answers I just gave. The caption says "your starting map", and it means it literally. That is the map.
>
> Most adaptive systems won't show you this. They just quietly decide things about you. I wanted the opposite, and you'll see the same idea again in a minute.

FIG: docs/report-figures/05-init-moment.png | **Stage 3b.** The model initialisation. Let the animation finish before you speak over it.

---

# 4. The dashboard, the brain, and the route

**3:30 to 5:00**

> Here's the dashboard. Look at the top of the page first, because the system has already decided what I do next. It picked this module because it's the weakest one I've unlocked, and it's telling me to practise rather than read, because I've already attempted it.
>
> That's not a menu I'm browsing. It's a decision, made by rules, and I'll show you those rules in the code shortly.

Point at the knowledge panel.

> And this is the learner model as an object you can look at. It's a brain, built out of a point cloud, with the sixteen modules sitting inside it as neurons and the curriculum chain running between them. Hover a node and you get the real estimate. Click one and it takes you to the lesson.
>
> Next to it, the same sixteen numbers as a plain list, which is the accessible version. The canvas is hidden from screen readers and only loads on desktop when motion isn't reduced. That rule runs through the whole build. Nothing decorative is allowed to carry meaning on its own.

Point at a greyed estimate.

> One detail I'd point out. Where a module is still sat at the twenty-five per cent prior, it's greyed and the page says why. Because "I haven't got any evidence yet" and "I estimate twenty-five per cent" are two different statements, and the interface shouldn't let them look the same.

FIG: docs/report-figures/06-dashboard.png | **Stage 4a.** The dashboard. Two things to point at: the Up Next card with its ring, then the knowledge model panel and the brain.

Click **Skill Tree**.

> And here's the curriculum as a single route. Sixteen modules, strict prerequisites, sixty-six lessons, a hundred and sixteen questions. Everything ahead of you stays locked until the model thinks you've got what comes before it.

FIG: docs/report-figures/07-skill-tree.png | **Stage 4b.** The skill map. Trace the route with the cursor from the first module forward.

---

# 5. A lesson

**5:00 to 6:30**

Open the current lesson.

> This is a lesson, and honestly this is where most of my time since the progress report has gone.
>
> Visuals come first. Recording, then walkthrough, then a real chart, then the prose. And that ordering came out of a mistake. I'd had the charts sitting underneath the text, and I couldn't find them myself, so I moved them.

Play two seconds of the video, then stop.

> That's the recording, where one exists. Thirty-three of the sixty-six lessons have one, and they're hosted now rather than sitting on my machine, so the deployed site plays them too.

Scroll to the walkthrough. Step through three or four steps with the arrow keys.

> This is what the other thirty-three have instead. And having built them, I'd now argue they're the better thing. It's a stepped, annotated chart. The price series is constructed from control points rather than recorded, which means the sweep and the break and the gap land on exactly the bars the caption says they do. Each step puts one layer on top. Older layers dim, the current one stays bright.
>
> Arrow keys move it. The caption is a live region, so a screen reader reads out each step as it happens. And there's a Describe button that turns the whole sequence into text.

Click Describe, show it, close it.

> There are forty-eight of these across the curriculum. For teaching a structure, that's more precise than a screen recording. And it's reachable in ways a video simply isn't.

Scroll to the real chart block.

> Then a real one. Sixteen lessons carry a case study cut from actual ES and NASDAQ futures bars. The caption quotes the real date and the real prices, and the frame says historical, attributed, not live, not a signal.
>
> And these were found by code, not by me. There's a detector for each concept that encodes that lesson's own rule, scores every instance in the data, and keeps the cleanest one. Which matters, because if I'd picked them by eye you'd have no way of knowing whether I'd gone hunting for the chart that flattered the idea.

FIG: docs/report-figures/08-lesson.png | **Stage 5.** A lesson page. Scroll slowly: recording, then walkthrough, then real chart. Don't rush past the walkthrough.

---

# 6. The adaptive loop, and the visible mind

**6:30 to 9:00**

Click **Practise**.

> Right, this is the core of it. Watch the launcher for a second before the questions start.

The routing readout plays.

> That's the engine talking you through its own decision. Which modules are open, which one has the weakest estimate, what band that puts me in, and what difficulty that earns me.
>
> Top of the screen is my live mastery for this topic. Keep an eye on that number as I answer.

Answer one correctly.

FIG: docs/report-figures/09-quiz.png | **Stage 6a.** A practice question. Point at the mastery figure top right before you answer.

> Right answer, and the estimate moves. Now this next thing is what I'd point at if you asked me what's actually original here.

Click **Why this question?**

> The learner can just ask the system why. And these are the real values the router used. My current estimate, the band, the difficulty it picked because of that band, and how likely the model thought I was to get it right.
>
> None of that is written for display. It's the actual decision object the engine handed back. Which means the explanation can't disagree with the behaviour, because there isn't a second version of it to drift.

FIG: docs/report-figures/10-why-this-question.png | **Stage 6b.** The open learner model popover. Leave it open for a good five seconds. This is the single most important screen in the demo.

Answer two deliberately wrong.

> Two wrong on purpose. Notice the feedback is amber rather than red. It doesn't shake and it doesn't flash. Getting something wrong while you're learning shouldn't feel like being told off. And after two consecutive misses the router drops into remediation and hands me something easier instead of pushing on.

FIG: docs/report-figures/11-after-wrong.png | **Stage 6c.** The state after a wrong answer. Point at the amber, and at the explanation rather than just the verdict.

Finish the session.

> And the summary at the end shows you the estimate before and after, module by module.

FIG: docs/report-figures/12-session-summary.png | **Stage 6d.** The session summary with the before and after bars.

**Delivery.** This section is the heart of the demo. If you're running long, take it out of somewhere else.

---

# 7. Review, and what's underneath

**9:00 to 9:50**

Click **Review answers**.

> Post-session review. Every question, what I put, what was right, and why.

FIG: docs/report-figures/13-answer-review.png | **Stage 7a.** The answer review. Scroll one or two items, no more.

Switch to the Firebase console.

> But underneath that is the thing the project is really for. Every answer I just gave is a row. The question, the module, whether I got it right, how long I took in milliseconds, and the part that matters most, the model's estimate before the answer and after it.
>
> That pair is what turns this into a research dataset rather than an application log. With the prior and the posterior on every single row you can rebuild a whole learning trajectory and test whether the estimates actually track performance. Which is exactly what I'll show you in two minutes.
>
> Two things about how it's built. The log is append-only, and that's enforced in the database rules, so not even the account that wrote a row can go back and change or delete it. And writes queue locally first, so losing your connection mid-session doesn't lose anything. There's a test that kills the network halfway through a session and then goes and counts the rows.

Optionally show the skill map again.

FIG: docs/report-figures/14-skill-tree-after.png | **Stage 7b.** The skill map after the session, if you have time. It shows the route having extended.

---

# 8. Into the code

**9:50 to 11:40**

VS Code, `lib/bkt/index.ts`.

> This is the Bayesian Knowledge Tracing engine, and it's the centre of the whole thing.
>
> BKT comes from Corbett and Anderson in 1994. It tracks the probability that a learner knows a skill, and updates it after every answer. Four parameters. The prior, the chance of learning on any given attempt, the chance of guessing right when you don't know, and the chance of slipping when you do.
>
> Here's the update. Condition on the evidence, then apply the learning step. About fifteen lines of actual maths.
>
> Two decisions I'd stand behind. This file has no dependencies and no Firebase imports at all, so it's trivial to test and it moves if the platform ever changes. And the thresholds are named constants in one place rather than magic numbers scattered about, because these are the same numbers the report quotes, and any drift between the two would be a defect.

Open `tests/unit/bkt.test.ts`.

> The tests are computed by hand. I worked the arithmetic out myself and asserted against those figures, so if the implementation ever drifts it fails against the maths rather than against its own opinion of itself.

Open `lib/routing/index.ts`.

> Routing is the other pure module. Give it a mastery map and the prerequisite graph and it decides what happens next and which question to serve. That's the same object the "why this question" panel puts on screen. Same data, no translation layer in between.

Open `lib/logging/logger.ts`.

> Last one, the response logger, and I want to be honest about why it looks like this. The obvious version just writes and hopes. But the Firebase SDK keeps its own retry queue, so if you put a queue in front of it, both of them end up holding the same write when the connection drops, and both deliver on reconnect. That's duplicate rows in the research data. Silently. Months later. So this one fails fast the moment the browser says it's offline, and my queue is the only thing retrying.
>
> That's the kind of bug that never shows up in a demo.

**Delivery.** Don't scroll fast. Land on one screenful, point at it, talk. If you're short on time, drop routing and keep the engine and the logger.

---

# 9. The evidence

**11:40 to 13:40**

Terminal.

CODE: npm run test

> A hundred and thirty-eight unit tests, sixteen on the database rules, and thirty-two end-to-end runs across desktop and mobile profiles. One of those finishes a whole session with the network cut halfway through and then checks every response arrived.
>
> Coverage on the modules the claims actually rest on. A hundred per cent of lines on the engine, the assessment code and the grading. Ninety-four on routing, ninety on the logger. Across all of lib it's forty-six, because the Firebase adapters and the React hooks are covered by browser journeys instead of unit tests. I'd rather tell you that than pad the number.

Open `docs/report/CALIBRATION.md`.

> Then two pieces of evidence about the model rather than about the code.
>
> First, calibration. Every logged answer carries the estimate from just before it. Push that through the emission model and it becomes a forecast. This learner has a seventy per cent chance of getting this right. And a calibrated model's forecasts come true at the rate they claim.
>
> Across eight thousand simulated answers the expected calibration error is 0.43 of a percentage point, and the Brier skill against a base-rate baseline is twenty-six per cent.
>
> And then a result I genuinely didn't expect. I tested whether fitting the parameters to each learner beats the fixed literature defaults, which is the step everyone assumes you should take. On held-out data, fitting makes it slightly worse. So the defaults stay, and that's now an evidence-based decision rather than something I did because it was easier.

FIG: docs/report-figures/17-calibration.png | **Stage 9a.** The calibration reliability chart. Point at a bin and say what it means: predicted about thirty per cent, observed 29.8.

Switch to `docs/EVALUATION.md`, routing policy simulation.

> Second piece, and this is the newer one. Calibration tells you the estimates are honest. It doesn't tell you the adapting is worth doing. So I built a second simulation that asks exactly that.
>
> Three hundred synthetic learners, each with a hidden true state per module. Three policies. My adaptive engine, a fixed syllabus that teaches every module in order, and a random baseline. Same item budget for all three. And the important bit, answers come from the learner's true state and the item's difficulty, never from the engine's estimate. So the engine is allowed to be wrong, and it gets punished when it is.
>
> The adaptive policy reaches the same true knowledge as the syllabus, about fifteen of sixteen modules, on seventy-four items instead of a hundred and sixty. And nearly all of that saving is items the syllabus wastes on modules the learner already knew. Forty-four per cent for mine, seventy-six for the syllabus.
>
> But the honest part is the cost column. My engine calls about one module in sixteen mastered that the learner doesn't actually know, because it stops asking once the estimate crosses 0.8, and a lucky guess or two can carry it there. The syllabus makes the opposite mistake and pays double the items to avoid it.
>
> That trade is the thing you'd tune with real data. And the pilot's post-test is built to measure exactly it.

---

# 10. The study is built, and the close

**13:40 to 15:00**

Go to the profile page, show the study card.

> Which brings me to the last thing, and it changes what the limitation of this project actually is.
>
> The human study is built. Not planned, built and tested. There's a post-test that's placement's twin. One question per module again, but form B, so fifteen of the sixteen questions are different ones. It never touches the learner model, and every answer gets logged with the model's current estimate. Which makes it a held-out check that practice answers can't give you, because practice moves the very estimate you'd be checking against.
>
> There's a ten-item System Usability Scale with three open questions. And there's an analysis script that reads the database and writes a results document. Per-learner placement, post-test, Hake's normalised gain, time on task, modules mastered, usability score. Pseudonymised, test accounts dropped. It runs clean against an empty database and reports zero rather than falling over.
>
> So the limitation isn't that I couldn't build the study. It's that I haven't recruited anybody yet. Those are two different sentences, and the second one is the true one.

FIG: docs/report-figures/15-settings.png | **Stage 10.** Settings, or the profile study card. Shows data export, deletion and the accessibility controls.

Show the live URL.

> It's deployed, at tmacademyuk.vercel.app, running against the real database. Accessibility, best practices and SEO all score a hundred on every public page, on mobile and desktop. And accessibility is checked automatically now with axe on every page including the signed-in ones, rather than by me looking at it.
>
> That suite found three real defects a Lighthouse pass had missed. One of them was a colour token sitting at three to one on every small label in the app.
>
> So, to close. The loop works end to end. It's tested at four levels with the engine at full coverage. The model is calibrated, and I've reported that calibration honestly, including the result that went against me. The adaptation is measurably more efficient than a syllabus, and I've put its cost next to its benefit rather than hiding one of them. The study instruments exist and they run. And the whole thing is live.
>
> What I haven't shown you is that anybody learns from it, because that needs participants and I haven't had any. That's the boundary, and it's the next thing I'd do.
>
> Thanks for listening. Happy to take questions.

---

# Question and answer preparation

This is the whole bank. You will not be asked all of it, and that's the point: the ones you get asked will feel easy because you've already thought about the twenty around them.

**How to answer.** Direct answer, one piece of evidence, stop. The commonest mistake isn't being wrong, it's carrying on talking past a perfectly good answer and walking into a weaker one. If you catch yourself starting a third sentence of evidence, stop and ask "does that answer it?"

**Three sentences you're allowed to use, and should.** "I don't know, and I'd want to check before giving you a wrong answer." "That's fair, and here's why I went the other way." "That's probably a longer conversation than we've got, but the short answer is X."

**The numbers you must have cold**, because half the questions below end in one:

TBL: Numbers to know without thinking
| Thing | Number |
| --- | --- |
| Modules, lessons, items | 16 · 66 · 116 |
| BKT parameters (prior, learn, guess, slip) | 0.25 · 0.12 · 0.20 · 0.10 |
| Thresholds (mastery, remediation) | 0.8 · 0.4 |
| Tests (unit, rules, end-to-end) | 138 · 16 · 32 |
| Coverage on the engine modules | 100% BKT, assessment, grading · 94% routing · 90% logger |
| Calibration | ECE 0.43 pp · Brier skill 26.0% over 8,000 answers |
| Routing simulation | 73.6 items against 160 for the same true knowledge |
| False mastery cost | about 1 module in 16 |
| Decisions logged | 85 |
| Report body | 10,988 words |

---

## A. The project and how it's framed

**In one sentence, what is this?**
An intelligent tutoring system for trading education that models what each learner knows as a probability per concept, and decides what they do next from that estimate alone.

**What's the research question?**
Whether a Bayesian Knowledge Tracing student model can drive a genuinely adaptive learning loop in trading education, and whether the system can produce interaction data good enough to evaluate whether the adaptation is doing anything. The second half matters as much as the first.

**Why does this need to exist?**
Because trading education online is a content pipe. Everyone gets the same videos in the same order, nothing holds any model of who you are, and progression is governed by what you click rather than by what you've shown you know. And the domain punishes that harder than most, because the market's own feedback is delayed, noisy and often wrong.

**Why is trading a good domain for this, and why is it a bad one?**
Good, because the feedback from the real world is so poor that structured practice has unusually high value. Bad, because it's ill-defined in Lynch's sense: correctness is contested and often unknowable in hindsight. The response was to decompose it into components that are individually checkable even though the whole activity isn't. Reading a candle is checkable. Whether a trade was right often isn't, and the tutor doesn't assess that.

**Is this computing research or is it finance?**
Computing. The research object is the pedagogical delivery, not the trading methodology. I make no claim that the content makes money, and the report says so repeatedly. That separation is what keeps it assessable as a computing dissertation rather than as an unregistered financial claim.

**Who is it for?**
An adult beginner who wants a structured path and honest feedback about what they've actually understood. And secondarily me as the researcher, because the system has to produce an analysable record of every interaction.

**What would success have looked like?**
Five objectives fixed at AE1 and not moved since. Four are met. The fifth, evaluating with real users, is not, and Chapter 7 says so without hedging.

**Why didn't you change the objectives once you knew the study wasn't happening?**
Because moving the goalposts after the fact makes the evaluation meaningless. The honest thing is to keep the criterion and report against it.

---

## B. Literature and theory

**How did you do the literature search?**
Searches from February to July 2026 across the ACM Digital Library, IEEE Xplore, ScienceDirect, SpringerLink, Google Scholar, SSRN and the Journal of Educational Data Mining archive, snowballing from three anchor papers. About 240 records screened, 57 cited and 18 more in the bibliography. Peer-reviewed empirical work, formal models and systematic syntheses kept, blogs and vendor material excluded, regulators cited only as evidence of the policy context.

**What are the limitations of your review?**
Two, and they're stated in the report. Screening was by one researcher, so there's no inter-rater check. And it was limited to English.

**Is this a literature review or a literature survey?**
A survey, which is what the brief asks for. There's a longer review chapter written mid-project that Chapter 2 condenses.

**What's the gap you identified?**
Knowledge tracing is built almost entirely on mathematics, language and programming datasets. I could find no published tutoring system applying a formal student model to trading education. That's the intersection that doesn't exist.

**How confident are you in that gap claim?**
It's a claim about what a systematic search found, not a proof of absence, and I'd phrase it that way. If a marker knows of one I'd want the reference.

**What does the evidence say about intelligent tutors actually working?**
Consistent in direction, varied in size. VanLehn found 0.76 against 0.79 for human tutors, Ma et al. 0.41 against large-group instruction, Kulik and Fletcher a median 0.66. The counterweight is Pane et al., a two-year randomised trial with about 18,700 students, which found roughly 0.20 in the second year.

**Why do you keep citing the study that weakens your case?**
Because it's the strongest study in my own supporting literature. A dissertation claiming big gains from a small evaluation would be contradicted by its own sources. Citing Pane is what stops me overclaiming later.

**Does financial education even work?**
The answer has shifted. Fernandes et al. meta-analysed 201 studies and found education explained about 0.1 per cent of the variance in later behaviour. Kaiser et al. then meta-analysed 76 randomised trials over 160,000 people and found real effects that survived correction for publication bias. The two reconcile once you notice the later studies used stronger designs and more interactive delivery. So the earlier null was about intervention quality, not education itself.

**None of that literature is about trading though.**
Correct, and I say so. The trials measure budgeting, saving and credit. Peer-reviewed evaluation of instruction in chart-based trading skills is essentially absent, even though a large industry sells it. That's part of the gap.

**What theory sits behind the curriculum design?**
Three things. Sweller's cognitive load theory for the isolated-to-integrated sequencing, because a populated price chart has very high element interactivity for a novice. Mayer's multimedia principles for pairing narration with visuals and segmenting into short units. And Ericsson on deliberate practice, which is the argument for structured tasks with immediate diagnostic feedback rather than exposure.

**Why is Bloom's two sigma in here?**
Because it's the target the whole ITS field set itself, and Corbett showed BKT-driven mastery learning recovers a meaningful share of it inside a computer tutor. It frames what adaptive tutoring is trying to buy.

**What's an open learner model and why does it matter?**
It's a system that shows the learner the model it holds of them. Bull and Kay review the evidence and report benefits for reflection, self-assessment and trust. It matters here because a tutor making decisions about someone in a domain where they're financially exposed ought to be able to show its working.

---

## C. Bayesian Knowledge Tracing

**Explain BKT in thirty seconds.**
Each concept is a two-state hidden Markov model. The learner either knows it or doesn't, and you infer that hidden state from their answers through four parameters: the prior chance of knowing, the chance of learning at each opportunity, the chance of guessing right while not knowing, and the chance of slipping while knowing. After each answer you condition on the evidence with Bayes' rule, then apply the learning step.

**Write the update.**
After a correct answer, P(L) times one minus slip, over that plus one minus P(L) times guess. After a wrong one, P(L) times slip, over that plus one minus P(L) times one minus guess. Then the learning step: the posterior plus one minus the posterior, times the learn rate.

**Walk me through the first two steps by hand.**
Prior 0.25, correct answer. 0.25 times 0.9 is 0.225. 0.75 times 0.2 is 0.15. So 0.225 over 0.375 is 0.6. Learning step: 0.6 plus 0.4 times 0.12 is 0.648. Next correct answer takes it to 0.905. So it crosses 0.8 on the second correct answer. Those exact numbers are the unit-test fixtures.

**Why BKT and not Deep Knowledge Tracing?**
Interpretability and data volume. DKT usually wins on raw predictive accuracy but needs far more interaction data than a single project can gather, and it can't tell a learner why it made a decision. Gervet et al. across nine datasets found deep models lead only on very large corpora and that calibration matters more than headline accuracy for a system that acts on its predictions. A dissertation-scale deployment is exactly the wrong regime for a deep model.

**But DKT dominates the recent literature.**
In publication volume, yes. In measured advantage at this data scale, no. Khajah, Lindsey and Mozer found BKT with modest extensions largely matches DKT. I chose by purpose rather than by fashion, which is Pelánek's argument as well.

**Why not Performance Factors Analysis, or item response theory?**
PFA has a weaker cold start, which matters because the system has no data on day one. IRT variants are in the bibliography. The selection table in Chapter 2 sets the four candidates against interpretability, cold start and data appetite, and BKT wins on all three at this scale.

**Where did your parameters come from?**
Literature defaults: 0.25, 0.12, 0.20, 0.10. They're in one constants object, configurable per concept, and they're the same numbers the report cites, because nothing else in the codebase is allowed to restate them.

**Shouldn't you fit them?**
I tested it. Fitting the prior and learn rate per learner on their first twenty answers made held-out forecasts slightly worse: Brier 0.1011 against 0.0994, and calibration error nearly doubled. So eventually yes, but not at this data volume, and I have the number rather than an opinion.

**Why did fitting make it worse?**
Because twenty answers can't identify the prior. The recovery experiment showed fitted priors collapsing to the edges of the search grid almost regardless of the true value, which is exactly the identifiability problem Beck and Chang described. A wrong fitted prior does more damage than a fixed one.

**So your model has a known flaw and you shipped it anyway?**
The flaw is in fitting, not in the model as used. The engine doesn't fit the prior. It initialises it from the placement test, which is a measurement rather than an inference from a short sequence. The simulation is what told me that was the right architecture, and the report presents it as a finding rather than hiding it.

**What is model degeneracy and have you got it?**
Degeneracy is when fitted guess or slip exceed 0.5 and the semantics invert, so the model reads a correct answer as evidence of not knowing. Baker, Corbett and Aleven characterised it. I don't have it, because my guess and slip aren't fitted, they're fixed at 0.2 and 0.1. The procedure if they ever are fitted is in the report: check against bounds and report them.

**Why 0.8 for mastery?**
It's a conventional threshold in the BKT literature and it's what my progress report committed to. The original cognitive tutors used 0.95, but with enormous item banks and compulsory classroom use. A voluntary consumer product with eight items a module punishes over-strict gating with attrition rather than compliance.

**Why 0.4 for remediation?**
That one's mine. It's set so a learner who genuinely doesn't know something drops into support quickly rather than grinding through questions they'll get wrong. And Pelánek's argument is that a mastery criterion conflates the system's uncertainty with the learner's knowledge, so it should be treated as a consequential design decision rather than a constant you inherit. It's one line to change.

**Isn't crossing mastery in two answers far too fast?**
It's fast, and it's a direct consequence of the literature defaults: with guess at 0.2 and slip at 0.1, two correct answers are strong evidence. The routing simulation quantifies the cost, which is about one module in sixteen called mastered when the learner doesn't know it. A fitted learn rate would probably slow it. That's the first thing the pilot data should tune.

**Your model assumes no forgetting. That's obviously false.**
It is, and it's stated as a limitation. Standard BKT has no forgetting transition. The review queue flags fading skills after three days by heuristic, which is a stand-in rather than a modelled term. A BKT variant with a forgetting transition is the second recommendation in Chapter 8.

**What does the mastery number actually mean to a learner?**
The system's probability that they know the concept, not a score and not a percentage correct. The interface is careful about that, and where a module is still sitting at the 0.25 prior it's greyed out and the page says the model doesn't know yet. "I have no evidence" and "I estimate twenty-five per cent" are different claims.

**Why one knowledge component per module rather than finer grained?**
Because the curriculum's natural unit is the module, the item bank is eight items a module, and splitting finer would leave each component with too few observations to trace. Finer granularity is a real improvement but it needs a deeper bank first, which is why those two recommendations sit together in Chapter 8.

---

## D. Routing and pedagogy

**How does the router decide?**
A module unlocks when every prerequisite is at or above 0.8. The target is the lowest-mastery unlocked module that isn't mastered. If it's never been practised the action is teach, so you get the lesson first. Otherwise the band decides: below 0.4 remediate, 0.4 to 0.8 practise, above 0.8 advance.

**And which question?**
A difficulty ladder off the estimate: easy below 0.4, medium below 0.7, hard above. It forces an easy item after two consecutive wrongs on a module, and never repeats an item inside a session.

**Why rules rather than a learned policy?**
Two reasons. A learned policy needs data I don't have, and it can't explain itself to the learner, which is the thing the open learner model depends on. Baker's argument is that the systems succeeding at scale are markedly simpler than the research prototypes and draw their value from solid student modelling and transparent pedagogy. That's the bet I made.

**Isn't a rule-based router just an if-statement? Where's the intelligence?**
The intelligence is in the student model, not the control layer, and that's deliberate. The router is a thin, readable policy over a probabilistic estimate. And the simulation shows that thin policy reaching the same true knowledge as a fixed syllabus on 46 per cent of the items, so it's doing real work even though you can read it in one screen.

**What does the "why this question" panel actually show?**
The real decision object the routing engine returned: my current estimate, the band it puts me in, the difficulty it chose as a result, and the predicted probability I'll get it right. Not a summary generated for display.

**Why does that distinction matter?**
Because most self-explaining systems explain a reconstruction, and a reconstruction can drift silently from the behaviour it claims to describe. There's only one object here, so the explanation is structurally incapable of disagreeing with the decision. That's one of the four contributions in Section 7.5.

**Could a learner game the system?**
Yes, in principle. Guess through easy items to cross 0.8. That's exactly the false-mastery cost the simulation measures, and it's why the post-test is a held-out check that practice answers can't provide. It's a stated weakness rather than something the design pretends away.

**Why a strict prerequisite chain rather than a graph?**
Because the domain genuinely is mostly sequential and a chain is inspectable. A learner can see the whole route. A denser graph would be more flexible and much harder to display, and the display is part of the research question.

**What if a learner already knows module twelve?**
Placement picks that up, because it asks one question per module regardless of lock state. Their starting map reflects it. What the chain still does is stop them practising twelve before the model believes eleven, which is a deliberate trade and the simulation shows it's the source of most of the efficiency.

**How do you know the sequencing is right?**
It came out of building the dependency graph of the concepts rather than keeping the recording order, and that changed things. Several videos quoted risk multiples like "2R" before position sizing had been taught, so risk and position sizing moved to module three rather than being appended at the end.

**Why does the router narrate itself on the practice launcher?**
Because it costs nothing and it makes the adaptation visible rather than mysterious. It's the same decision object again, shown a second way.

---

## E. The curriculum and the content

**Where did the content come from?**
Two sources, kept separate in the repository. The original nine-module chain came from a practitioner video curriculum of about four and a half hours, thirty-six recordings I transcribed and rewrote as structured markdown lessons. The September extension added thirty-three lessons across eight modules, written from cited public ICT and TTrades teaching, with a hundred and seventeen sources listed lesson by lesson.

**So it isn't a clean split?**
No, and the report says so. The extension reached back into modules 6, 7 and 9 as well as adding 10, 11, 13, 15 and 16. I'd rather say that than round it off.

**Did you write the trading content yourself?**
I wrote every lesson. The source material is a practitioner methodology, cited, and the report is explicit that it's grey literature with no peer-reviewed validation.

**Isn't teaching an unvalidated methodology a problem for a dissertation?**
It would be if I were claiming it works. I'm not. The research object is whether the delivery can be made adaptive and measurable. The curriculum has to be something, and this is something with a large real audience and an honest label on it. What it does limit is generalisation: any learning-gain result would be about learning this content, not about profitability.

**Why sixteen modules?**
Because that's what the dependency analysis produced once the September extension covered the material the video series didn't reach. It started at nine.

**How many items and of what kind?**
116 across six types: 55 multiple choice, 16 multi-select, 14 numeric, 15 ordering, 15 true/false with a confidence slider, and one chart annotation. Graded 23 easy, 60 medium, 33 hard.

**One annotation item? That's thin.**
It is, and I say so in the weaknesses. The type is built and works. Authoring them is slow because each needs a real chart and a correct zone. It's on the recommendations list.

**What are the walkthroughs?**
Stepped, annotated charts. Forty-eight of them. The price series is constructed from control points rather than recorded, so the sweep, the break and the gap the lesson is about land on exactly the bars the captions name. Annotation layers go on one step at a time, arrow keys step it, the caption is a live region so a screen reader announces each step, and a describe control lays the whole sequence out as text.

**Aren't the walkthrough charts fake data?**
Constructed, and the interface says so on every one. That's the point rather than a weakness. A randomly generated chart wouldn't reliably contain the pattern being taught, and a real chart I'd hand-picked to show the pattern would be worse science, not better.

**Then why have real charts at all?**
Because sixteen lessons carry a historical case study and those are genuine ES and NASDAQ futures bars, dated, attributed, and labelled as historical rather than live. The two kinds do different jobs: constructed for precision when teaching a structure, real for showing the thing exists outside the classroom.

**How did you choose the real examples?**
I didn't. A detector per concept encodes the lesson's own rule as code, scores every instance in the data and keeps the cleanest. A Candle 2 closure is "the low trades below the previous bar's low and the close is back above it". The captions are generated from the matched bars, so every date and price in them is the one on the chart.

**Why does that matter?**
Because an example chosen by eye to flatter the concept is cherry-picked and a reader has no way to tell. Finding them by code makes the selection auditable. It's an evidence-integrity practice, not a technical one.

**Why walkthroughs instead of recording the missing videos?**
Partly time, and I'd say so. But having built them I'd defend them on the merits. For a structural concept a stepped chart is more precise than a screen recording, because the bars are constructed so the thing being described is exactly where the caption says. It's keyboard operable, it announces each step to a screen reader, and it has a full text description. A video has none of that.

**How long are the videos and why that length?**
Thirty-three lessons have one, out of sixty-six. Guo, Kim and Rubin found MOOC engagement dropping sharply past about six minutes, so they're short and paired with the same material as on-page text.

**Why is the lesson layout visuals first?**
That was a fix, not a plan. I had the charts below the prose and couldn't find them myself. Recording, then walkthrough, then real chart, then text.

---

## F. Assessment and measurement

**How is placement built?**
One question per module, so sixteen questions, drawn from the thirty-six items flagged pre-test eligible. It runs the update sequence over those answers from the default prior, so the starting map reflects what the learner already knows rather than a flat 0.25 everywhere.

**Is placement logged differently?**
Yes. Placement responses are logged with the estimate before and after set equal, because no learning step is applied during measurement. That keeps placement evidence separately analysable in the dataset.

**How does the post-test differ from placement?**
Same shape, different form. Placement takes form A, the first eligible item per module in prerequisite order. The post-test takes form B, the last. Fifteen of the sixteen questions differ, so it isn't a memory test of the placement. Both forms come out of the same selector, so they can't drift apart.

**Why doesn't the post-test update the model?**
Because then it wouldn't be a measurement. Each answer is logged with the model's current estimate as its pLBefore, which makes the post-test a held-out check that practice answers structurally cannot provide, because practice answers move the estimate they'd be scored against.

**One module has only one eligible item.**
Liquidity and Wicks. It repeats between the two forms, the analysis script reports it, and authoring a second eligible item is on the recommendations. I'd rather surface it than let a marker find it.

**How would you measure learning gain?**
Hake's normalised gain per participant, which corrects for ceiling effects among learners with higher prior knowledge, reported with its spread and not only its mean. The spread matters because Doroudi and Brunskill's equity argument is that mastery-based adaptation narrows but doesn't close the gap between fast and slow learners.

**Why normalised gain rather than raw difference?**
Because a learner who starts at 12 of 16 can't gain as much as one who starts at 4, so a raw difference would systematically flatter the weaker starters and penalise the stronger ones.

**Why SUS?**
Because it's the standard instrument, it's ten items so it doesn't tax a volunteer, and it has a published average of 68 to compare against. Free-text feedback would be analysed thematically following Braun and Clarke.

**Is five to eight participants enough?**
For a hypothesis test, no, and I don't claim it is. It's framed as feasibility evidence. A controlled comparison against a fixed-order version of the same content would need roughly thirty to forty, and that's the more valuable study because it isolates the adaptation rather than the content.

---

## G. Architecture and the stack

**Describe the architecture.**
Six components and one loop. A content layer, an assessment engine that serves and grades, a student model that estimates mastery, a control layer of routing rules that reads the estimate and decides what happens next, a progress interface that shows the learner the model and its decisions, and an authentication and data layer holding accounts and the research log.

**What are the boundaries you wouldn't cross?**
Two. The BKT engine and the routing rules are pure TypeScript with no framework or database imports, so they're trivially testable and portable if the platform changes. And the response logger is the only path by which an answer reaches the database, so there's exactly one place where the research log can be got right or wrong.

**Why Next.js and Firebase?**
Firebase gave me authentication, a database and security rules that are themselves testable, which mattered because the append-only guarantee is a rule rather than a convention. Next.js because the app is content-heavy. Neither is load-bearing for the research, which is exactly why the engine and the routing are isolated from both.

**What would it take to move off Firebase?**
Rewrite the adapters. The engine, the routing and the grading don't import anything from it, so they'd move unchanged. That's the return on the purity constraint.

**Why TypeScript strict?**
Because the response schema is the research dataset and a type error there is a data error months later. Strict mode plus lint and typecheck enforced pre-commit and in CI.

**How big is it?**
About 25,700 lines of TypeScript across 166 files and 19 routes, 41 commits, six tagged phases.

**Forty-one commits for 25,000 lines?**
Yes, and the report is open about why. Implementation was AI-assisted under my direction, so the six build phases planned across ten weeks were completed and tagged in two intensive days in mid-July. The commit count reflects that, not a claim about effort. Appendix K sets out where the hours actually went, and implementation is only the fourth largest line.

---

## H. Data, security and the research log

**What does a response record hold?**
The item, its module, the question type, whether it was correct, what was selected, the latency in milliseconds, and the model's estimate before the answer and after it.

**Why the estimate before and after?**
That's the pair that makes it a research dataset rather than an app log. With the prior and the posterior on every row you can reconstruct a whole learning trajectory and test whether the estimates track performance, which is exactly what the calibration report does.

**What are the security rules doing?**
Deny by default. A learner reads and writes only their own subtree. A user document can only be created with the adult flag set to true, which is the 18+ gate. Sessions can't be deleted. Responses can be created and read by their owner and can never be updated or deleted by anyone through the client, including the owner.

**Why can't the owner delete their own responses? Isn't that a GDPR problem?**
It's create-only through the client, not undeletable. Deletion on request is done by an administrator, so it can't happen silently or by accident. That protects the research dataset from tampering and the learner from losing data they didn't mean to lose, and the right to erasure is still honoured, just not through a button that can misfire.

**How do you know the rules work?**
Sixteen tests running against the Firestore emulator that attempt every forbidden operation and assert refusal. That's the only way to prove those guarantees hold against a caller who never touches the interface.

**Tell me about the logger.**
It's designed like a payments system: it must never silently fail. Every submit enqueues an event, persists the queue to local storage, returns immediately so the interface stays responsive, and flushes in the background with exponential backoff to a thirty-second cap. Unflushed events survive a refresh and flush on the next start or on the browser's online event.

**What was the hardest bug?**
The duplicate-write problem in that logger. The Firebase SDK keeps its own internal write queue. If the transport was allowed to accept a write while the browser was offline, both queues would hold the same event and both would deliver on reconnect. That's duplicate rows in the research data, silently, months later. So the transport fails fast when the browser reports itself offline, and my queue is the single retry authority.

**How did you find it?**
By thinking about what happens on reconnect rather than by seeing it fail, which is the point. It doesn't show up in normal use. There's now an end-to-end test that cuts the network halfway through a ten-question session and counts the rows that arrive against the answers given.

**Where is the data stored and is it separated?**
Two projects. Development and tests run against a local emulator on its own port with its own build folder. A separate live project holds real users, and every automated path is pinned to the emulator by construction.

**By construction, or by discipline?**
By construction now, by discipline before, and the report says why. Early on Playwright auto-started a production build with the live configuration and seven test accounts reached the live project. I deleted them, verified zero remained, and then made it impossible by configuration rather than by remembering. It's in the decisions log with the date.

**Why volunteer that incident?**
Because it's the most instructive thing that happened, and because a marker who found it in the log and I hadn't mentioned it would reasonably wonder what else was in there.

---

## I. Testing and verification

**How is it tested?**
Four layers, chosen so each catches a class of defect the others structurally can't. 138 unit tests over the pure modules. 16 security-rule tests in the emulator. 32 end-to-end browser runs, which is 16 journeys across desktop and Pixel 7 profiles. And audits: Lighthouse, axe, and a manual guardrail sweep.

**Why are the BKT tests hand-computed?**
Because a test generated from the implementation only proves the code agrees with itself. I worked the arithmetic out by hand from the equations and asserted against those figures, so if the implementation drifts it fails against mathematics rather than against its own opinion.

**What's your coverage?**
100 per cent of lines on the BKT engine, the assessment code and grading. 94 on routing, 90 on the logger. Across all of lib it's 46, because the Firebase adapters and the React hooks are covered by the browser journeys rather than unit tests.

**Forty-six per cent sounds low.**
It is, and I'd rather report it than pad it. The claim the dissertation makes is about the engine, and the engine modules are the top four rows of that table. Coverage of a Firebase adapter by unit test would mostly be testing a mock.

**Which single test earns its keep?**
The network-cut journey. It completes a session with the network disabled partway through, restores it, then reads Firestore directly and asserts exactly as many responses arrived as answers were given, each with its estimates and latency. That's the test protecting the claim the whole project rests on.

**Why did you move the mobile tests off WebKit?**
WebKit's long-polling to the Firestore emulator failed intermittently in a way that had nothing to do with the application. The mobile project exists to verify layout, and deterministic tests protect the evaluation timeline, so it moved to a Chromium Pixel 7 profile and WebKit was checked by hand. The trade-off was recorded at the time.

**How do the tests survive the curriculum changing?**
They answer questions by reading the current item's identifier from the page and fetching its answer key from the emulator rather than hard-coding an option letter. That's why they survived the curriculum being replaced wholesale in September.

**Can I see it run?**
Yes. `npm run test`, `npm run test:rules`, `npm run test:e2e`, `npm run test:coverage`.

---

## J. Results and evaluation

**What did the simulated-learner harness show?**
Two hundred synthetic learners, forty opportunities each, seed 42. All three behaviours committed to at AE1 hold: a correct streak crosses 0.8 in two items, a wrong streak never rises above 0.1552, and 99 per cent of the cohort scores higher in the last quarter of their sequence than the first.

**What is calibration and why do you care?**
Every logged answer carries the estimate the engine held before it, and through the emission model that's a forecast: this learner has a seventy per cent chance of getting this right. A calibrated model's forecasts come true at the rate they claim. It matters because the numbers are shown to the learner, so they have to mean what they say.

**How calibrated is it?**
Across 8,000 simulated answers the expected calibration error is 0.43 of a percentage point and the Brier skill against a base-rate baseline is 26 per cent.

**What's a Brier score?**
Mean squared error of the forecasts. Zero is perfect, 0.25 is a coin toss. Mine is 0.1220 against a baseline of 0.1647, and the skill score is the fraction of the baseline's error the model removes.

**Isn't calibrating against simulated data circular?**
It's a real limit and the report states it: the simulated learners share the engine's guess and slip values, so the run tests what happens when the priors on initial knowledge and learning rate are wrong, which they are by construction, rather than testing the emission model itself. That second test needs real answers, and the same script scores a real log when there is one.

**What does the routing simulation actually prove?**
That against simulated learners, the adaptive policy reaches the same true knowledge as a fixed syllabus using 46 per cent of the items, and that the saving is almost entirely items the syllabus spends on modules the learner already knew: 44 per cent for mine against 76 for the syllabus.

**How do you stop that simulation being rigged in your favour?**
Two design choices, and they're the answer to this question. Answers come from the learner's hidden true state and the item's difficulty, never from the engine's estimate, so the engine is allowed to be wrong and gets punished when it is. And the generative model deliberately isn't BKT's own, so the engine is tested against a world it didn't assume.

**What's the cost column?**
My engine declares about one module in sixteen mastered that the learner doesn't actually know, because it stops asking once the estimate crosses 0.8 and a lucky guess can put it there. The syllabus has the opposite error, under-calling by 0.77 modules, and pays double the items for it. Neither is free. Mine is the error that shows on the learner's dashboard.

**Why report the cost at all?**
Because the trade is the finding. An efficiency claim without its error rate isn't evidence, it's marketing.

**Does the result hold if you change the seed?**
Yes, it holds over seeds. The run is seeded so the reported table reproduces to the digit, and it writes itself into the evaluation document between markers so the document can't drift from the run.

**What would change your mind about any of this?**
Real answers. If the pilot showed the model's forecasts were badly calibrated on people, or that the post-test contradicted the mastery calls much more often than one in sixteen, the threshold and the guess parameter are the first two things I'd move.

---

## K. The study that didn't run

**You haven't tested this with real learners. Isn't that a problem?**
It's the main limitation and I'd rather say it than have it drawn out of me. But the shape of it has changed. The instruments are built and tested end to end: a post-test, a usability questionnaire, and an analysis script that produces the results document. What's missing is recruitment, not engineering.

**Why didn't you run it?**
The curriculum only reached its final form in the second week of September. Before that the platform ran on placeholder lessons that existed to exercise the structure. A learning-gain study on placeholder content would have measured the placeholders, not the tutor, and usability feedback on lessons about to be replaced would have been feedback on the wrong thing. So the choice was between a meaningless result and finishing the content the study depended on.

**Isn't that just "I ran out of time"?**
It's more specific than that, and the specificity is the point. The progress report named content production as the biggest scope risk and it was right. Turning 36 videos and the wider published teaching into 66 lessons with 116 authored items took the weeks the study needed. Given the choice again I'd make the same one, but earlier: the content should have been the first milestone rather than the last, because the study depended on it and the engine didn't.

**Five to eight participants was never going to prove anything anyway.**
Correct, which is why it was framed as feasibility evidence from AE1 rather than as a hypothesis test. The thing it would have produced is a first look at whether the model's forecasts hold on people, and specifically at the false-mastery rate the simulation predicts.

**So what did you do with the time instead?**
Two things. I added a fifth evaluation strand the plan didn't have, the routing policy simulation, because "does the adaptivity add anything" turns out to be answerable without participants. And I built and tested the study's instruments end to end, so the study is now a matter of recruiting rather than building.

**Prove the instruments actually work.**
The analysis script has been run against the empty live database, where it reports n equals zero rather than failing, and against the emulator after an end-to-end test that drives a learner through placement half wrong, the post-test all right, and the questionnaire. Normalised gain and the SUS arithmetic have unit tests against worked examples.

**Could you run it now, before the deadline?**
Not honestly. Recruiting, consenting and running even five participants properly takes more than the days left, and a rushed study would be worse than no study. What I can say is that everything it needs is deployed and the first number to look at is already identified.

**What's the very first thing you'd look at in the data?**
How often the model calls a module mastered that the post-test says isn't. That's the number the simulation flagged and the post-test was built to measure.

---

## L. Ethics, legal and professional practice

**Trading education is sensitive. How did you handle it?**
By making the constraints structural rather than cosmetic. Simulated or clearly labelled historical data only, no broker connection, no signals, 18+ enforced in the database rules as well as the interface, real GDPR consent with a working decline, and download or delete your data in settings.

**Why in the rules rather than just the interface?**
Because an interface check is a suggestion and a rule is a guarantee. A Google user skips the sign-up form entirely, so the attestation has to be enforced where the write happens.

**What's your lawful basis for the data?**
Consent, and the consent screen states what's recorded, why, and that the learner can withdraw. Decline is a real button that signs the learner out with nothing stored beyond the account.

**What does the regulator actually say?**
ESMA intervened in the retail CFD market citing analyses showing 74 to 89 per cent of retail accounts lose money, and imposed leverage caps, negative balance protection and standardised risk warnings. The FCA made near-identical restrictions permanent in the UK and continues to warn about influencer promotion of high-risk products. So an artefact teaching trading has to be designed so it can't drift into a financial promotion.

**Did you ever have to say no to yourself?**
Twice, both in the decisions log. I wanted copy about producing profitable traders, and that's a claim the site can't make, because the financial-promotions rules bite on exactly that language. The path is framed as competence instead. And when I first wanted real market data the consent screen and the ethics application both said everything was simulated, so I didn't. The real charts only went in after the consent wording, the legal page and the report were all changed to say "simulated or clearly labelled historical".

**Why cut the mentor marketplace?**
Because paid guidance from strangers is the mechanism the FCA warns about, and it contributed nothing to the research question. No payment code of any kind ships.

**Where's your ethics approval?**
Obtained through the Solent ethics application on the portal and signed off by my supervisor before the progress report went in. Appendix A sets out what it covers and, more usefully, maps each condition of the approval to the place in the artefact that enforces it and the test that proves it.

**Why map it like that?**
Because an approval filed and forgotten is a document. An approval implemented is a design. The table is the difference.

**What about the BCS Code of Conduct?**
The work sits under it, particularly the duties to the public interest and to professional competence. That's the frame that makes the guardrails a professional obligation rather than a preference.

**Is any of the content financial advice?**
No, and the artefact is built so it can't be mistaken for it. No live data, no broker connection, no signals, no profitability language anywhere in the copy, and Chapter 6 reports a sweep of every string in the interface for exactly those things.

---

## M. Accessibility

**Why is the accessibility work so extensive?**
Because the target is a real standard rather than a gesture, and because an educational tool that excludes people isn't much of an educational tool. It was a gate from the first phase, not a final pass.

**What's actually there?**
Keyboard operation with a visible focus ring everywhere, 44-pixel targets, mastery changes announced through a live region, a text alternative on every chart, high contrast, a readable typeface, comfortable reading, calm mode, colour-blind candles, a font scale, skip to content, and a shortcuts sheet. Preferences live on the profile and are stamped onto the root element before first paint so there's no flash of the default look.

**How do you know it meets WCAG?**
It's automated now, which is the difference between a claim and a result. axe-core runs inside the Playwright suite against twelve pages including the signed-in ones, on two device profiles, failing the build on any serious or critical WCAG 2.1 AA violation.

**Did it find anything?**
Three real defects a manual Lighthouse pass had missed. A muted colour token sitting at 3.0 to 1 on every small label in the app, now raised to 4.6. Unearned profile badges whose whole-tile dimming took their text to 1.9 to 1. And a sideways-scrolling lesson table with no keyboard route to scroll it.

**Why did a manual pass miss those?**
Because Lighthouse samples and axe sweeps, and because two of the three only appear on signed-in pages a Lighthouse run against public URLs never sees.

**Is the brain visualisation accessible?**
It's hidden from screen readers and only mounts on desktop when motion isn't reduced, and the same sixteen estimates sit beside it as a list. Nothing decorative is load-bearing. That pattern runs through the whole build.

---

## N. Performance

**What are your Lighthouse scores?**
Accessibility, best practices and SEO are 100 on the landing, sign-in and legal pages on both mobile and desktop presets. Performance is 100 on all three on desktop, and 89, 91 and 93 on simulated slow 4G with a 4x CPU slowdown.

**What did it take to get there?**
Two structural fixes, and the second is the interesting one. The landing hero mounted its WebGL scene on hydration, so the headline queued behind it and the largest contentful paint was 7.8 seconds on mobile. Particles now mount on idle after first paint.

**And the second?**
Framer Motion was server-rendering every entrance block with an inline opacity of zero, so pages were blank until 940 kilobytes of JavaScript had hydrated. On a throttled phone the sign-in form took 6.6 seconds to appear. I rebuilt the entrance choreography as CSS with the same timing and the same component interface, and sign-in went from 77 to 91.

**What's the lesson from that?**
An entrance animation that hides server-rendered content behind JavaScript is a performance and an accessibility defect, not a polish choice. And it was completely invisible on a fast laptop, which is why it survived three months.

**Why is mobile performance still not 100?**
The remaining 3 to 4 seconds is the simulated slow-4G download of JavaScript the pages genuinely use: Firebase Auth, the animation library, the WebGL on the landing. The desktop scores show there's nothing left on the render path itself. I'd rather explain that than apologise for it.

**Tell me about the animation you deleted.**
A rotating blurred aurora layer. It looked good and it took the dashboard from 120 frames per second to 19. Pure GPU cost, no long tasks. I measured it and removed it. The general finding was that each animated full-screen layer costs about 18 frames of compositor budget while the identical layer held static costs nothing measurable, so the final design keeps every layer and animates one.

---

## O. AI assistance and academic integrity

**How much of this did you write?**
All the design decisions and the architecture. AI assistance during implementation, declared in the progress report and again in the methodology chapter. The research question, the choice of model and thresholds, the curriculum, the evaluation design and every entry in the decisions log are mine.

**How can we tell the difference?**
The decisions log, which is the evidence of reasoning rather than of typing. Eighty-five dated entries with the reason attached, including the ones I reversed. That's the part of a codebase that normally goes missing, and it's what Chapter 5 is reconstructed from.

**Give me an example of a decision only you could have made.**
Moving risk and position sizing to module three. Nothing in the code suggests that. It came from noticing that every module from five onwards quotes risk multiples that are meaningless before sizing is taught.

**Give me an example of a reversal.**
Three good ones. I built an animated background, measured it at 19 frames per second, and deleted it. I reversed the whole dev-server arrangement after landing on the emulator's fake Google sign-in page three times in one day. And I found Framer Motion was server-rendering everything at opacity zero and rebuilt the entrance animations as CSS.

**Isn't AI-assisted development a bit of a cheat?**
It's declared, and what it changed is worth being precise about. It compressed the build far below the planned ten weeks, which moved the project's constraint from writing code to writing content and running the evaluation. Appendix K shows the consequence in the hours: implementation is the fourth largest line, behind the literature, the curriculum and the video production. A plan written with that in mind would have looked very different, and that's the process finding in Section 7.4.

**Could you maintain this codebase?**
Yes, and the design is what makes that answerable. The engine is a hundred lines with fifteen of mathematics and zero dependencies. The routing is a decision table. The parts that are mine to defend are small enough to hold in your head, which was deliberate.

---

## P. Project management and the hours

**How did you manage the project?**
Six phases mirroring the milestone order set in the progress report, each with a written done-criterion, each ending with its verification checklist actually run and recorded before the phase was tagged in version control. And two practices running through all of it: every significant decision appended to a log with its reason, and "measured, not assumed" applied wherever it could be.

**Where did the 400 hours go?**
About 420 hours over roughly thirty-four weeks, set out by work package in Table 4.2 with the method in Appendix K. The largest lines are the curriculum at 80, the literature at 70, video production at 50 and implementation at 50.

**How do you know it was 420 and not 200?**
It's reconstructed rather than measured, and the appendix says so plainly. Every line is anchored to something countable: 41 commits and 76,800 insertions, 36 recordings totalling four hours and twenty-seven minutes, 66 lesson files at about 64,000 words, 117 logged sources, 85 dated decision entries. The rates applied are conservative and where a line could be argued either way it was rounded down.

**Why didn't you keep a timesheet?**
I didn't, and that's the honest starting point of that appendix. What I did keep was a dated decisions log, version control and the documents themselves, which is what the reconstruction is built from.

**What's the most interesting thing about the hours?**
The shape. Implementation, the line a computing project is assumed to spend its hours on, is only the fourth largest. That inversion is the same finding as Section 7.4.

**Did the risks you identified at AE1 materialise?**
Mostly as predicted. Cold start was handled by the planned contingency of literature defaults. Scope creep from content production was flagged as the biggest risk and it's the one that bit. Two weren't anticipated: the test-account leak, and misleading performance numbers from two development servers running at once.

---

## Q. The report itself

**How long is it?**
10,988 words in the main body, chapters one to eight, which is inside the 10,000 plus ten per cent. The count is declared on the title page.

**How many sources?**
57 cited with DOIs where they exist, and 18 more in the bibliography.

**What's in the appendices?**
Twelve. Ethics approval and where each condition is enforced, artefact access and how to run it, the BKT worked example and test fixtures, the security rules, the curriculum map, the simulation output, the full decisions log, the parked designs, the evaluation instruments, the traceability table from literature to design decisions, the effort reconstruction, and the implementation detail.

**What's Appendix J for?**
It links every significant design decision in chapters three to five to the evidence behind it and the place it's implemented, so nothing in those chapters is asserted without a source.

**What do you consider the contribution?**
Four things, and Section 7.5 states each at the strength the evidence supports. The domain application as an existence proof. The open learner model rendering the router's real decision object rather than a reconstruction. The routing simulation as a method for evaluating adaptivity without participants. And reporting the findings that went against me.

**Which of those is the strongest?**
The third, because it's the most transferable. Any project that can't recruit participants faces the same problem, and that's a way through it.

---

## R. Sceptical and hostile questions

**Isn't this just a quiz app with a progress bar?**
The difference is that progression is governed by a probabilistic estimate of knowledge rather than by completion, the estimate is shown to the learner and explains its own decisions, and every answer is recorded with that estimate before and after so the whole thing is analysable afterwards. A quiz app has none of those three.

**What's actually novel here? BKT is from 1994.**
The model is deliberately not novel, and I'd defend that choice. What's new is the domain application, which the literature doesn't have, and the design pattern of an explanation that renders the real decision object rather than a summary of it. The originality claim is in the application and the method, not in the mathematics.

**You've built a lot and proved very little.**
I'd push back on "very little" and accept the shape of it. What's proved: the loop works end to end under test, the engine is correct against hand-computed mathematics at full coverage, the model is calibrated to within half a percentage point on simulated data, and the adaptation is measurably more efficient than a syllabus under a stated generative model. What isn't proved is that anyone learns from it. That's the boundary and it's stated in four places.

**Your evidence is all simulated.**
All the model evidence is, yes, and each result carries that caveat where it's reported. The code evidence isn't simulated: the tests run against the real engine and the browser journeys drive the real application. Those are different claims and I keep them separate.

**Couldn't you have just used an existing platform?**
No existing platform applies a student model to this domain, which is the gap itself. That's precisely why it had to be built rather than studied.

**Why should anyone trust a system that teaches a methodology with no evidence base?**
They shouldn't trust the methodology, and the site doesn't ask them to. It says the framework is contested. What the system offers is a structured way to learn it and an honest account of what you've understood, which is a different and much smaller claim than the industry makes.

**Isn't teaching people to trade irresponsible given the statistics you cite?**
It would be irresponsible to teach it while implying it makes money, which is why the copy can't and doesn't. The position is that people are going to learn this material anyway, mostly from sources with a financial interest in their trading, and a version that's structured, simulated, 18+, ad-free and honest about the evidence is a better place for them to be than the alternative.

**What's the weakest part of the project?**
The item bank. Seven items a module on average is enough to demonstrate the loop and thin for repeated practice and for two assessment forms drawn from the same pool. Everything downstream, the difficulty ladder, the review queue, the two test forms, would work better with sixteen.

**If I gave you another month, what would you do?**
Run the study. Not another feature.

---

## S. Reflective questions

**What did you learn?**
That the interesting failures are invisible ones. The duplicate writes on reconnect, the race that only appears on real latency, the entrance animation hiding the page behind a megabyte of JavaScript, the leak into the wrong database. None of those show up when you use the thing. All four were caught by a check that existed because the specification said the dataset comes first.

**What would you do differently?**
Schedule the participant study first and fit the build around it. The content should have been the first milestone, not the last, because the study depended on it and the engine didn't.

**What are you most pleased with?**
The moment after placement where the model initialises and the caption says "your starting map". It's the point where the thing stops being a quiz and starts being a tutor, and it's made of the same data as everything else.

**What surprised you?**
That fitting the parameters made the forecasts worse. That's the step everyone assumes you should take, and it turned out to be wrong at this data volume. It's now an evidence-based decision rather than a convenience.

**How did your thinking change over the project?**
The biggest shift was realising the constraint wasn't going to be code. I planned for ten weeks of building and it took two days, so the real bottleneck turned out to be content and evaluation. Everything difficult after July was one of those two.

**Where does this go next?**
The participant study, then fitting the learn rate on real responses while leaving the prior to placement, then a forgetting term. A constrained generative tutor is the long-horizon option, scoped to the concept being studied and grounded in that lesson's text, with the BKT model unchanged as the sole authority over progression.

**Would you keep working on it?**
Yes, and the first thing is the study, because it's the only thing that turns the artefact into an answered research question.

---

## T. The awkward ones

**Are the commits pushed?**
Check this before you walk in, because it is the one answer you cannot improvise. If they are, say yes. If a marker opens the repository and finds it a week behind the demo, that is a bad thirty seconds.

**Can I see the live site right now?**
Yes, tmacademyuk.vercel.app, running against the real database with the recordings hosted.

**Is there real user data in it?**
No. The live project holds the seeded curriculum and no participant responses. The analysis script has been run against it and wrote a results file reporting n equals zero, which is committed, so the empty table is a matter of record rather than an absence.

**What happens if I sign up right now?**
You'd get the real thing: the 18+ attestation, the consent screen with a working decline, placement, and a routed session. And you'd be the first row in the dataset, which is why I'd rather you did that after the demo than during it.

**Did you use anyone else's code?**
Open source libraries under permissive licences, listed in the package manifest. The prototype designs were produced for this project and the video lessons were generated from my own source notes.

**What's the one thing you'd want us to take away?**
That the adaptation is measurable and that I measured it, including the parts that went against me.

**I don't think that answer is right.**
"That's fair, let me think about it." Then either give a better answer or say you'd want to check. Do not defend a weak answer by adding more words to it.

**A question you genuinely cannot answer.**
"I don't know, and I'd want to check before giving you a wrong answer." Then say how you'd find out: which file, which document, which script. Knowing where the answer lives is most of the credit.

---

## If something breaks

**The demo fails live.** "Let me show you this from the recording instead", and switch to your backup. Do not debug on camera.

**A question challenges a decision.** Don't defend reflexively. "That's fair, and here's why I went the other way" is stronger than pretending there was no trade-off.

**You get a question about something you cut.** The parked designs are in an appendix with the reason each was cut. Cut deliberately and documented is a strength, not a gap.

**Two markers disagree with each other in front of you.** Answer the question that was asked, acknowledge the other view exists, and don't take a side in their disagreement.

---

# Practice plan

Four run-throughs, and don't try to do them all in one sitting.

**One, script in hand, nothing recording.** Read it out loud at the speed you'd actually talk. Time every section and write the real number in the margin, because some of them will be twice as long as you think they are.

**Two, bullets only.** Cut each section down to about five words. "Ethics gate, eighteen plus, consent, decline is real." Then deliver from that. This is the run where it stops sounding like reading.

**Three, full recording, no stopping.** Whatever goes wrong, keep going and finish. Then watch it back with the sound on, which is the horrible bit and also the useful bit.

**Four, the real take.** Do it when you're fresh. Not at eleven at night.

**Questions on their own.** Get someone to read you prompts from the bank in random order and answer out loud. The written answers are there so you internalise them, not so you recite them.

## Things that go wrong

TBL: What to do when it breaks
| Problem | What to do |
| --- | --- |
| A page hangs | Refresh once. Hangs again, switch to the backup recording. |
| Port 3000 busy | `npm run stop && npm run dev`. The guard will tell you what's holding it. |
| A video won't play | Skip to the walkthrough. It's the better demo anyway and you have a line ready. |
| You lose your place | Stop. Breathe. "Let me pick that up again." It reads as composure. |
| Running long | Cut section 8's routing file and section 7b. Never cut section 6. |
| Running short | Open the decision log and talk through two reversals. |
| A question runs away | "That's probably a longer conversation than we've got, but the short answer is X." |

## Record a backup

The day before, record a clean run of just the clicking, sections 2 through 7, without saying anything. Then if something falls over on the day you play that and talk over the top of it. It takes twenty minutes and it removes nearly all of the risk.

---

# Alternative timings

**Ten minutes.** Sections 1, 2 with consent only, 3, 5 with the walkthrough only, 6, 9 with the routing simulation only, and 10. Drop the dashboard tour, the code and the database entirely. Section 6 stays whatever happens.

**Twenty minutes.** All of the above, and then: step a full walkthrough end to end with the Describe panel open, open `firestore.rules` and read the append-only rule out loud, run the routing simulation live so the table prints while they watch, walk through the post-test and questionnaire pages, and talk them through two entries from the decisions log.
