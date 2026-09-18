# TradeMind Academy: Demonstration Script

**Ogechukwu Adama, 10440379** · Module QHO656 Dissertation Project · Supervisor: Prashant Bikram Shah
**Live:** https://tmacademyuk.vercel.app · **Source:** https://github.com/OGSOLENT/TradeMind_Academy

Written for a 15 minute slot plus Q&A. Timings are in the margin, and there's a 10 and a 20 minute variant at the end. Every stage carries a screenshot of the screen you should be on when you say those words.

**What this is.** A demonstration that the artefact works, a walkthrough of how it was built, and an honest account of what the evidence shows. It's not a summary of the report.

# Before you record

Run this every time, including the real take. Most demo failures are environment failures, not nerves.

**Twenty minutes before.** Restart the machine, or at least quit everything you don't need. Then one terminal, one command:

CODE: cd ~/Documents/DIssertation/TradeMind_Academy && npm run stop && npm run dev

That's the real app: live database, real Google sign-in, port 3000. The port guard refuses to start if anything's already holding it, which is what you want.

**Demo locally, show the live URL.** The recordings are now hosted on Vercel Blob, so the deployed site plays them too, but local is faster and has no network between you and a video. Put the live URL on screen once, near the end, as proof it ships.

**Tabs, in this order.** localhost:3000 on the landing page. The Firebase console on Firestore (`npm run db` opens it). The GitHub repo. VS Code with `lib/bkt/index.ts` open. And `docs/EVALUATION.md`, scrolled to the routing policy simulation.

**Do a throwaway run.** Sign in, click through a lesson and a practice session, close the tab. It warms every route so nothing compiles on camera. Highest value item on this list.

**Recording setup.** Share the whole screen, not a window. Browser at about 125%. Close Slack, mail, notifications. Test the mic for ten seconds and play it back. Water off camera.

---

# 1. Opening

**0:00 to 1:10**

> Hi, I'm Ogechukwu Adama. This is TradeMind Academy, an intelligent tutoring system for trading education, and it's the artefact for my dissertation.
>
> I'll start with the problem, because it shapes everything else.
>
> Trading education online is a content pipe. Everyone gets the same videos in the same order, nothing in the system holds any idea of who you are, and progression is governed by what you click rather than by what you've shown you know. That matters more here than in most subjects, because the research on retail trading is blunt. Most day traders lose money, and performance doesn't improve with experience. Markets are a terrible teacher. The feedback arrives late, it's buried in variance, and quite often it's wrong, because a bad decision can be paid and a good one can lose.
>
> So the question I set was whether a Bayesian Knowledge Tracing model can drive a genuinely adaptive learning loop in this domain, and whether the system can produce evidence good enough to tell if the adaptation is doing anything.
>
> That second half matters as much as the first. It isn't enough to build something that feels adaptive.
>
> I'll show you the loop end to end, take you into the code, then show the evidence. About fifteen minutes, then questions.

**Delivery.** Don't rush this. It's the only part where you set up why any of it matters. Slow down on the research question.

FIG: docs/report-figures/01-landing.png | **Stage 1.** The landing page at localhost:3000. Stay here while you talk. Don't scroll.

---

# 2. The ethics gate

**1:10 to 2:10**

Click **Start free**, fill the sign-up form.

> Before the learning, the gate in front of it, because this is a research artefact and that shaped the design.
>
> Every chart in this system is either simulated or a clearly labelled historical case study. No broker connection, no signals, no live data, eighteen plus.

Try to submit without ticking the box. Let the error show.

> That's blocked in the interface and it's also blocked in the database rules, so you can't get past it from a console. Same gate on the Google button, which matters because a Google user skips the form entirely.

FIG: docs/report-figures/02-sign-up.png | **Stage 2a.** The sign-up form. Point at the 18+ checkbox before you deliberately fail the submit.

Tick, submit. The consent screen appears.

> Then consent. This is real GDPR copy. It says exactly what's recorded, that the lawful basis is consent, and that they can withdraw. Decline is a real button. Click it and you're signed out and nothing is collected.
>
> I'm going to accept, otherwise this is a very short demonstration.

FIG: docs/report-figures/03-consent.png | **Stage 2b.** The consent screen. Point at Decline as you say it's real, and at the "simulated or clearly labelled historical" line.

**Delivery.** Do the failed submit live. It proves the gate instead of describing it. Practise the timing.

---

# 3. Placement, and the model initialising

**2:10 to 3:30**

> Now the interesting part. Before I've read anything, the system needs a starting estimate of what I know. So it runs a placement test, one question per module.

Start placement. Answer the first two out loud.

> Sixteen modules, so sixteen questions, drawn from the thirty-six items marked pretest-eligible. I'll get a couple wrong on purpose so you see the model respond rather than just climb.

Answer the rest quickly, missing two deliberately.

FIG: docs/report-figures/04-placement.png | **Stage 3a.** A placement question. Answer two or three on camera, then say you'll speed up.

> And this is the moment I think is the nicest in the product.

The initialisation plays.

> That's the model initialising. Every node is a module and the ring around it is the probability I know it, estimated from the answers I just gave. The caption says "your starting map", and that's literally what it is.
>
> That's a deliberate position. Most adaptive systems are a black box. This one shows its working, and you'll see that again in a minute.

FIG: docs/report-figures/05-init-moment.png | **Stage 3b.** The model initialisation. Let the animation finish before you speak over it.

---

# 4. The dashboard, the brain, and the route

**3:30 to 5:00**

> Here's the dashboard. Top of the page, the system has already picked what I do next. It's chosen this module because it's my lowest-mastery unlocked one, and it's telling me to practise because I've already attempted it.
>
> That isn't a menu I'm browsing. It's a routing decision, made by rules I'll show you in the code.

Point at the knowledge panel.

> And this is the learner model as an object. It's a brain, built as a point cloud, with the sixteen modules as neurons inside it and the curriculum chain running through them. Hovering a node gives the real estimate. Clicking one goes to the lesson.
>
> Beside it, the same sixteen estimates as a list, which is the accessible version. The canvas is hidden from screen readers and only mounts on desktop when motion isn't reduced. That pattern runs through the whole build: nothing decorative is load-bearing.

Point at a greyed estimate.

> One detail worth having. Where a module is still at the twenty-five per cent prior, it's greyed and the page says so. The model saying "I don't know yet" and the model saying "I estimate twenty-five per cent" are different claims, and the interface shouldn't blur them.

FIG: docs/report-figures/06-dashboard.png | **Stage 4a.** The dashboard. Two things to point at: the Up Next card with its ring, then the knowledge model panel and the brain.

Click **Skill Tree**.

> And this is the curriculum as a route. Sixteen modules in a strict prerequisite chain, sixty-six lessons, a hundred and sixteen questions. Everything ahead is locked until you master what comes before it.

FIG: docs/report-figures/07-skill-tree.png | **Stage 4b.** The skill map. Trace the route with the cursor from the first module forward.

---

# 5. A lesson

**5:00 to 6:30**

Open the current lesson.

> Here's a lesson, and this is where most of the work since the progress report has gone.
>
> Visuals come first: the recording, then the walkthrough, then the real chart, then the prose. That ordering was a fix, not a plan. I had the charts below the text and couldn't find them myself.

Play two seconds of the video, then stop.

> The recording, where there is one. Thirty-three of the sixty-six lessons have one, and they're hosted rather than local now, so the deployed site plays them too.

Scroll to the walkthrough. Step through three or four steps with the arrow keys.

> This is what the other thirty-three have instead, and honestly what I'd now argue is better. A stepped, annotated chart. The price series is built from control points rather than recorded, so the sweep and the break and the gap are exactly where the caption says. Each step lays one thing on top. Earlier layers dim, the current one is bright.
>
> Arrow keys step it. The caption is a live region so a screen reader announces each step. And there's a Describe button that lays the whole sequence out as text.

Click Describe, show it, close it.

> Forty-eight of these across the curriculum. For a structure concept that's more precise than a screen recording, and it's accessible in a way a video never was.

Scroll to the real chart block.

> Then a real one. Sixteen lessons carry a historical case study cut from actual ES and NASDAQ futures bars. The caption quotes the real date and the real prices, and the frame says historical, attributed, not live, not a signal.
>
> These were found by code, not by me hunting for a chart that flattered the idea. A detector per concept encodes the lesson's own rule, scores every instance in the data, and keeps the cleanest. If I'd picked them by eye they'd be cherry-picked.

FIG: docs/report-figures/08-lesson.png | **Stage 5.** A lesson page. Scroll slowly: recording, then walkthrough, then real chart. Don't rush past the walkthrough.

---

# 6. The adaptive loop, and the visible mind

**6:30 to 9:00**

Click **Practise**.

> Now the core. Watch the launcher for a second.

The routing readout plays.

> That's the engine narrating its own decision. Which modules are unlocked, which has the lowest estimate, what band that puts me in, what difficulty that earns.
>
> Top of the screen is my live mastery for this topic. Watch the number as I answer.

Answer one correctly.

FIG: docs/report-figures/09-quiz.png | **Stage 6a.** A practice question. Point at the mastery figure top right before you answer.

> Correct, and the estimate moves. Now the bit I'd point at if you asked what's original here.

Click **Why this question?**

> The learner can ask the system why. And these are the real values the routing engine used: my current estimate, the band it puts me in, the difficulty it chose as a result, and the probability the model thinks I'll get this right.
>
> None of that is generated for display. It's the actual decision object the engine returned, which means the explanation is structurally incapable of disagreeing with the behaviour, because there's only one of them.

FIG: docs/report-figures/10-why-this-question.png | **Stage 6b.** The open learner model popover. Leave it open for a good five seconds. This is the single most important screen in the demo.

Answer two deliberately wrong.

> Two wrong on purpose. The feedback is amber, not red. It doesn't shake and it doesn't flash. Wrong answers in a learning system shouldn't feel like punishment. And after two consecutive misses the router drops into remediation and serves an easier question instead of pushing on.

FIG: docs/report-figures/11-after-wrong.png | **Stage 6c.** The state after a wrong answer. Point at the amber, and at the explanation rather than just the verdict.

Finish the session.

> And the summary at the end shows the estimate before and after, per module.

FIG: docs/report-figures/12-session-summary.png | **Stage 6d.** The session summary with the before and after bars.

**Delivery.** This section is the heart. If you're running long, cut from elsewhere.

---

# 7. Review, and what's underneath

**9:00 to 9:50**

Click **Review answers**.

> Post-session review. Every question, what I answered, what was right, and why.

FIG: docs/report-figures/13-answer-review.png | **Stage 7a.** The answer review. Scroll one or two items, no more.

Switch to the Firebase console.

> But underneath that, here's what the project is actually for. Every answer I just gave is a record: the question, the module, whether I was right, how long I took in milliseconds, and critically the model's estimate before the answer and after it.
>
> That last pair is what makes this a research dataset rather than an app log. With the prior and the posterior on every row I can reconstruct a whole learning trajectory and test whether the estimates track performance, which is exactly what I'll show you in a minute.
>
> Two things about how it's built. The log is append-only, enforced in the database rules, so not even the account that wrote a row can edit or delete it. And writes are queued locally first, so a network drop mid-session loses nothing. There's an end-to-end test that kills the connection halfway through a session and then counts the rows.

Optionally show the skill map again.

FIG: docs/report-figures/14-skill-tree-after.png | **Stage 7b.** The skill map after the session, if you have time. It shows the route having extended.

---

# 8. Into the code

**9:50 to 11:40**

VS Code, `lib/bkt/index.ts`.

> This is the Bayesian Knowledge Tracing engine and it's the centre of the project.
>
> BKT is Corbett and Anderson, 1994. It models the probability a learner knows a skill and updates it after every answer. Four parameters: the prior, the chance of learning on a given attempt, the chance of guessing right while not knowing, and the chance of slipping while knowing.
>
> Here's the update. Condition on the evidence, then apply the learning step. About fifteen lines of actual maths.
>
> Two decisions I'd defend. This file has zero dependencies and zero Firebase imports, so it's trivially testable and portable if the platform changes. And the thresholds are constants in one file rather than magic numbers scattered about, because they're the same numbers the report cites and drift between the two would be a defect.

Open `tests/unit/bkt.test.ts`.

> The tests are hand-computed. I worked the arithmetic out by hand and asserted against those figures, so if the implementation drifts the test fails against maths rather than against itself.

Open `lib/routing/index.ts`.

> Routing is the other pure module. Given a mastery map and the prerequisite graph it decides what happens next, and which specific question to serve. That's the object the "why this question" panel displays. Same data, no translation layer.

Open `lib/logging/logger.ts`.

> Last one, the response logger, and I'll be honest about why it looks like this. The obvious version just writes and hopes. But the Firebase SDK keeps its own retry queue, so if you put a queue in front of it, both hold the same write when the connection drops and both deliver on reconnect. That's duplicate rows in the research data, silently, months later. So this fails fast when the browser reports itself offline and my queue is the single authority.
>
> That's the class of bug that never shows up in a demo.

**Delivery.** Don't scroll fast. Land on one screenful, point, talk. Short on time: cut routing and keep BKT and the logger.

---

# 9. The evidence

**11:40 to 13:40**

Terminal.

CODE: npm run test

> A hundred and thirty-eight unit tests, sixteen on the database rules, and thirty-two end-to-end runs across desktop and mobile profiles. One of those completes a session with the network killed halfway and then verifies every response arrived.
>
> Coverage on the modules the claims rest on: a hundred per cent of lines on the BKT engine, the assessment code and grading, ninety-four on routing, ninety on the logger. Across all of `lib` it's forty-six, because the Firebase adapters and the React hooks are covered by the browser journeys rather than unit tests. I'd rather say that than pad the number.

Open `docs/report/CALIBRATION.md`.

> Then two pieces of evidence about the model rather than the code.
>
> First, calibration. Every logged answer carries the estimate from before the answer. Push it through the emission model and it becomes a forecast: this learner has a seventy per cent chance of getting this right. A calibrated model's forecasts come true at the rate they claim.
>
> Across eight thousand simulated answers the expected calibration error is 0.43 of a percentage point, and the Brier skill against a base-rate baseline is twenty-six per cent.
>
> And a result I didn't expect. I tested whether fitting the parameters per learner beats the fixed literature defaults, which is the step everyone assumes you should take. On held-out data, fitting makes it slightly worse. So the defaults stay, and that's now an evidence-based decision rather than a convenience.

FIG: docs/report-figures/17-calibration.png | **Stage 9a.** The calibration reliability chart. Point at a bin and say what it means: predicted about thirty per cent, observed 29.8.

Switch to `docs/EVALUATION.md`, routing policy simulation.

> Second, and this is the newer one. The calibration tells you the estimates are honest. It doesn't tell you the adaptation is worth anything. So I built a second simulation that asks exactly that.
>
> Three hundred synthetic learners with a hidden true state per module. Three policies: my adaptive engine, a fixed syllabus that teaches every module in order, and a random baseline. Same item budget. Critically, answers come from the learner's true state and the item's difficulty, never from the engine's estimate, so the engine is allowed to be wrong.
>
> The adaptive policy reaches the same true knowledge as the syllabus, roughly fifteen of sixteen modules, using seventy-four items instead of a hundred and sixty. And most of the saving is items the syllabus spends on modules the learner already knew: forty-four per cent for mine, seventy-six for the syllabus.
>
> But the honest part is the cost column. My engine declares about one module in sixteen mastered that the learner doesn't actually know, because it stops asking once the estimate crosses 0.8 and a lucky guess can put it there. The syllabus has the opposite error and pays double the items for it.
>
> That trade is the thing to tune with real data, and the pilot's post-test is designed to measure exactly it.

---

# 10. The study is built, and the close

**13:40 to 15:00**

Go to the profile page, show the study card.

> Which brings me to the last thing, and it changes what the limitation of this project actually is.
>
> The human study is built. Not planned, built and tested. There's a post-test that's placement's twin: one question per module, but form B, so fifteen of the sixteen questions are different. It never touches the learner model, and every answer is logged with the model's current estimate, which makes it a held-out check that practice answers can't give you, because practice moves the estimate.
>
> There's a ten-item System Usability Scale with three open questions. And there's an analysis script that reads the database and writes a results document: per-learner placement, post-test, Hake's normalised gain, time on task, modules mastered, SUS, pseudonymised, test accounts dropped. It runs clean on an empty database and says so.
>
> So the limitation isn't that I couldn't build the study. It's that I haven't recruited anyone yet. That's a different sentence and it's the honest one.

FIG: docs/report-figures/15-settings.png | **Stage 10.** Settings, or the profile study card. Shows data export, deletion and the accessibility controls.

Show the live URL.

> It's deployed, at tmacademyuk.vercel.app, against the real database. Accessibility, best practices and SEO all score a hundred on every public page on both mobile and desktop presets, and the accessibility is now checked automatically with axe on every page including the signed-in ones, not just eyeballed.
>
> That suite caught three real defects a Lighthouse pass had missed, including a colour token sitting at three to one on every small label in the app.
>
> So, to close. The loop works end to end. It's tested at four levels with the engine at full coverage. The model is calibrated and the calibration is reported honestly, including the result that went against me. The adaptation is measurably more efficient than a syllabus, with its cost stated rather than hidden. The study instruments exist and run. And it's live.
>
> What I haven't shown you is that anyone learns from it, because that needs participants and I haven't had any. That's the boundary, and it's the next thing.
>
> Thanks for watching. Happy to take questions.

---

# Question and answer preparation

Answer in three parts. Direct answer, one piece of evidence, stop. The commonest mistake isn't being wrong, it's carrying on talking past a perfectly good answer.

## About the model

**Why BKT and not a neural approach like Deep Knowledge Tracing?**
Interpretability and data volume. DKT usually beats BKT on raw predictive accuracy but needs far more interaction data than a single project can gather, and it can't tell a learner why it made a decision. Since one of my aims was that the model be inspectable, a four-parameter model I can display in a panel was the right trade, and the calibration report shows it's well calibrated at this scale.

**Shouldn't you fit the parameters?**
I tested it. Fitting the prior and the learn rate per learner on twenty answers makes held-out forecasts slightly worse than the fixed defaults. So eventually yes, but not at this data volume, and I have the number rather than an opinion.

**Why 0.8 and 0.4?**
0.8 is a conventional mastery threshold in the BKT literature and it's what my progress report committed to. 0.4 for remediation was my decision, so a learner who genuinely doesn't know something drops into support quickly rather than grinding. They're constants in one file, easy to revise. And the routing simulation shows the threshold is the knob that trades items against false mastery, which is exactly the thing the pilot is set up to tune.

**How do you know the engine is correct?**
Two different questions and two different answers. The code is verified by unit tests asserting against arithmetic I worked out by hand, at a hundred per cent line coverage on the engine. The model is verified by the calibration report, which checks its forecasts against outcomes. Those are separate claims and I'd keep them separate.

**What does the routing simulation actually prove?**
That against simulated learners, the adaptive policy reaches the same true knowledge as a fixed syllabus using about forty-six per cent of the items, and that the saving comes from not re-teaching things the learner already knew. It also shows the cost, which is that it over-calls mastery on about one module in sixteen. What it doesn't prove is anything about humans. It's a policy comparison under a stated generative model, not a learning outcome.

## About the evaluation

**You haven't tested this with real learners. Isn't that a problem?**
It's the main limitation and I'd rather say it than have it dragged out. But the shape of it has changed. The instruments are built and tested end to end: post-test, SUS, and an analysis script that produces the results document. What's missing is recruitment, not engineering.

**What would you measure?**
Normalised learning gain between placement and the post-test, which the analysis script already computes with Hake's formula. Whether the model's predicted probability matches observed accuracy on real answers, which the log supports directly. And specifically the over-calling the routing simulation predicts, because the post-test is a held-out check on exactly that.

**How many participants?**
Thirty to forty for a within-subjects pre-post design at reasonable power for a medium effect. A controlled comparison against a fixed-order version of the same content would need roughly double, and that's the more valuable study because it isolates the adaptation rather than the content.

## About the build

**Why Next.js and Firebase?**
Firebase gave me authentication, a database and security rules that are themselves testable, which mattered because the append-only guarantee is a rule, not a convention. Next.js because the app is content-heavy. Neither is load-bearing for the research, which is why the engine and the routing are isolated from both.

**How much of this did you write?**
All the design decisions and the architecture. AI assistance during implementation, declared in the report. The evidence of my own reasoning is the decision log: eighty-five entries with the reasoning attached, including the ones I reversed.

**Give me an example of a reversal.**
Three good ones. I built an animated background, measured it at nineteen frames per second, and deleted it. I reversed the whole dev-server arrangement after landing on the emulator's fake Google page three times in one day. And most recently I found that Framer Motion was server-rendering every entrance block with inline opacity zero, so pages were blank until nearly a megabyte of JavaScript had hydrated. On a throttled phone the sign-in form took six and a half seconds to appear. I rebuilt the entrance animations as CSS and it went from seventy-seven to ninety-one. The lesson I'd write down is that an entrance animation which hides server-rendered content behind JavaScript is a performance and an accessibility defect, not a polish choice, and it was completely invisible on a fast laptop.

**What was the hardest bug?**
The duplicate-write problem in the logger. My retry queue and the Firebase SDK's internal queue would both hold the same write when the connection dropped, and both would deliver on reconnect. It doesn't show up in normal use. It shows up as duplicate rows in the research data much later.

**Why sixteen modules, and where did the content come from?**
Two sources, kept separate in the repository. The original nine-module chain came from a practitioner video curriculum of about three and a half hours, thirty-six recordings I transcribed and rewrote as structured markdown lessons. The September extension added thirty-three lessons across eight modules, written from cited public ICT and TTrades teaching, with a hundred and seventeen sources listed lesson by lesson in `docs/LESSON_SOURCES.md`. None invented. Sequencing came from a dependency analysis rather than the recording order, which is why risk and position sizing sits third: every module from five onward quotes risk multiples that are meaningless before sizing is taught.

**Why walkthroughs instead of recording the missing videos?**
Partly time, and say so. But having built them I'd defend them on the merits. A stepped chart is more precise than a screen recording for a structure concept, because the bars are constructed so the thing being described is exactly where the caption says. It's keyboard operable, it announces each step to a screen reader, and it has a full text description. A video has none of that.

**Aren't the walkthrough charts fake data?**
Constructed, and the interface says so on every one. That's the point rather than a weakness. A randomly generated chart wouldn't reliably contain the pattern being taught, and a real chart I'd cherry-picked to show the pattern would be worse. The sixteen real case studies are genuine historical bars, attributed and dated, found by detectors rather than by eye.

## About ethics and accessibility

**Trading education is sensitive. How did you handle it?**
By making the constraints structural rather than cosmetic. Simulated or clearly labelled historical data only, no broker connection, no signals, eighteen plus enforced in the database rules as well as the interface, real GDPR consent with a working decline, and download or delete your data in settings. I also cut a mentor marketplace specifically because paid trading guidance carries risks that don't belong here.

**Did you ever have to say no to yourself?**
Twice, both in the decision log. I wanted copy about producing profitable traders, and that's a claim the site can't make: the FCA's financial-promotions rules bite on exactly that language. The path is framed as competence instead. And when I first wanted real market data, the consent screen and the ethics application both said everything was simulated, so I didn't. The real charts only went in after the consent wording, the legal page and the report were all changed to say "simulated or clearly labelled historical".

**Why is the accessibility work so extensive?**
Because the target is a real standard rather than a gesture, and because an educational tool that excludes people isn't much of one. It's also automated now, with axe running over every page including the signed-in ones on two device profiles, which is the difference between a claim and a result. It found three things a manual Lighthouse pass had missed.

**Where's the data stored, and is it separated?**
Two projects. Development and tests run against a local emulator on its own port with its own build folder; a separate live project holds real users, and every automated path is pinned to the emulator by construction. That's a lesson learned the hard way: early on some test accounts did reach the live project. I deleted them, verified, and then made it impossible by design rather than by discipline.

## If something breaks

**The demo fails live.** "Let me show you this from the recording instead", and switch to your backup. Do not debug on camera.

**You don't know the answer.** "I don't know, and I'd want to check before giving you a wrong answer" is completely acceptable. Then say how you'd find out.

**A question challenges a decision.** Don't defend reflexively. "That's fair, and here's why I went the other way" is stronger than pretending there was no trade-off.

---

# Practice plan

Four rehearsals, not all in one day.

**Run one, script in hand, no recording.** Read it aloud at speaking pace. Time each section and write the real timings in the margin. Some will be twice as long as you think.

**Run two, bullet points only.** Reduce each section to five words. "Ethics gate, 18 plus, consent, decline is real." Deliver from those. This is where it stops sounding read.

**Run three, full recording, no stopping.** Whatever goes wrong, keep going. Watch it back with the sound on.

**Run four, the real take.** When you're fresh, not at eleven at night.

**Q&A separately.** Get someone to read you the questions in random order. Answer out loud. The written answers are to internalise, not to memorise.

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

The day before, record a clean run of just the demo, sections 2 to 7, no talking. If anything fails on the day you play that and narrate over it. Twenty minutes, and it removes almost all the risk.

---

# Alternative timings

**Ten minutes.** Sections 1, 2 (consent only), 3, 5 (walkthrough only), 6, 9 (routing simulation only), 10. Drop the dashboard tour, the code and the database.

**Twenty minutes.** Everything above, plus: step a full walkthrough end to end with the Describe panel open, open `firestore.rules` and read the append-only rule aloud, run the routing simulation live so the table prints on screen, walk the post-test and survey pages, and talk through two entries from the decision log.
