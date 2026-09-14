# TradeMind Academy: Demonstration Script

**Ogechukwu Adama, 10440379**
Module QHO656 Dissertation Project · Supervisor: Prashant Bikram Shah
Live: https://tmacademyuk.vercel.app · Source: https://github.com/OGSOLENT/TradeMind_Academy

Written for a 15 minute slot plus Q&A. Timings are in the margin. There's a 10 minute cut and a 20 minute extended version at the bottom if the slot turns out to be different.

**What this presentation is.** A demonstration that the artefact works, plus a walkthrough of how it was built and what the evidence actually shows. It is not a summary of the report. The report covers the process; this covers the thing.

---

## Before you hit record

Run this list every time, including the real take. Most demo failures are environment failures, not nerves.

**About 20 minutes before**

1. Restart the machine, or at least quit everything you don't need. The dev server degrades after long uptime and pages start timing out. You've had that happen mid session.
2. One terminal, one command:
   ```bash
   cd ~/Documents/DIssertation/TradeMind_Academy && npm run stop && npm run dev
   ```
   That's the real app: live database, real Google sign-in, port 3000. The port guard refuses to start if something's already on 3000, which is what you want.
3. Wait for the compile, then open `http://localhost:3000`.

**Demo locally, not on Vercel.** The deployed site is real and you should show the URL, but the lesson recordings aren't hosted yet, so on Vercel a recorded lesson opens on its walkthrough instead. Locally the videos play. Run the demo on localhost and put the live URL on screen once, near the end, as proof it ships.

**Tabs to have open, in this order**

1. `localhost:3000` on the landing page
2. The Firebase console on the Firestore tab (`npm run db` opens it)
3. The GitHub repo
4. VS Code with `lib/bkt/index.ts` already open
5. `docs/report/CALIBRATION.md`

**Do a throwaway run.** Sign in, click through a lesson and a practice session, then close that tab. It warms every route so nothing compiles on camera. This is the single highest value thing on the list.

**Recording setup**

- Share the whole screen, not a window. You're switching between browser, terminal and editor.
- Zoom the browser to about 125%. Text that's readable on your monitor is unreadable in a compressed recording.
- Close Slack, mail, notifications. Do not skip this.
- Test your mic for 10 seconds and play it back before the real take.
- Water off camera.

---

## The script

### 1. Opening (0:00 to 1:15)

> Hi, I'm Ogechukwu Adama. This is TradeMind Academy, an intelligent tutoring system for trading education, and it's the artefact for my dissertation.
>
> I want to start with the problem, because it shapes everything you're about to see.
>
> Trading education online is a content pipe. Everyone gets the same videos in the same order, nothing in the system holds any idea of who you are, and progression is governed by what you click rather than by what you've shown you know. That matters more here than in most subjects, because the research on retail trading is blunt. Most day traders lose money, and performance doesn't improve with experience. Markets are a terrible teacher. Feedback arrives late, it's buried in variance, and quite often it's wrong, because a bad decision can be paid and a good one can lose.
>
> So the research question I set was this. Can a Bayesian Knowledge Tracing model drive a genuinely adaptive learning loop in this domain, and can that system produce evidence good enough to evaluate whether the adaptation actually works?
>
> That second half matters as much as the first. It isn't enough to build something that feels adaptive. It has to record what it did and let somebody else check.
>
> I'll demonstrate the loop end to end, take you into the code that drives it, then show you the evidence. About fifteen minutes, then I'm happy to take questions.

**Delivery note.** Don't rush this. It's the only part where you set up why anything else matters. Slow down on the research question.

---

### 2. The ethics gate (1:15 to 2:15)

Screen: `localhost:3000`, then click through to sign up.

> Before the learning, the gate in front of it, because this is a research artefact and that shaped the design.
>
> Here's the landing page. The disclaimer is not buried in a footer. Every chart in this system is either simulated or a clearly labelled historical case study, there's no broker connection, no signals, no live data, and it's eighteen plus.

Click **Start free**. Fill the form.

> Sign up. Note the eighteen plus checkbox. Let me try to submit without it.

*(Submit without ticking. Let the error show.)*

> That's blocked in the interface, and it's also blocked in the database rules, so you can't get past it from a console. Same gate on the Google button, which matters because a Google user skips the form entirely.

*(Tick, submit.)*

> Then consent. This is real GDPR copy. It tells the learner exactly what's recorded, that the lawful basis is consent, and that they can withdraw. Decline is a real button. If you click it you're signed out and nothing is collected.
>
> I'm going to accept, otherwise this is a very short demonstration.

**Delivery note.** The failed submit is worth doing live. It proves the gate rather than describing it. Practise it so the timing is smooth.

---

### 3. Placement and the model initialising (2:15 to 3:45)

> Now the interesting part. Before I've read anything, the system needs a starting estimate of what I know. So it runs a placement test, one question per module.

Click **Start placement**. Answer the first two out loud.

> Sixteen modules, so sixteen questions, drawn from the thirty-six items I marked as pretest-eligible. I'll get a couple wrong deliberately so you can see the model respond rather than just climb.

*(Answer the rest quickly. Miss two on purpose.)*

> And this is the moment I think is the nicest in the product.

*(Model initialisation plays.)*

> That's the model initialising. Every node is a module, and the ring around it is the probability I know it, estimated from the answers I just gave. The caption says "your starting map", and that's literally what it is.
>
> That's a deliberate position. Most adaptive systems are a black box. This one shows its working, and you'll see that again in a minute.

---

### 4. The dashboard and the routing decision (3:45 to 5:15)

Dashboard.

> Here's the dashboard. Top of the page, the system has already picked what I do next. It's chosen this module because it's my lowest-mastery unlocked one, and it's telling me to read rather than practise because I haven't attempted it yet.
>
> That isn't a menu I'm browsing. It's a routing decision made by rules I'll show you in the code.

Point at the knowledge panel.

> And this is the learner model as an object. It's a brain, built as a point cloud, with the sixteen modules as neurons inside it, the curriculum chain as an axon running through them, and the covered stretch lit to my actual mastery. Hovering a node gives you the real estimate. Clicking one takes you to the lesson.
>
> Beside it, the same sixteen estimates as a list, which is the accessible version. The canvas is hidden from screen readers and only mounts on desktop when motion isn't reduced. That pattern runs through the whole build: nothing decorative is load-bearing.

*(Point at a greyed estimate.)*

> One detail worth having. Where a module still sits at the 25% prior, it's greyed and the page says so. The model saying "I don't know yet" and the model saying "I estimate 25%" are different claims, and the interface shouldn't blur them.

Click **Skill Tree**.

> And this is the curriculum as a route. Sixteen modules in a strict prerequisite chain, sixty-six lessons, a hundred and sixteen questions. Everything ahead is locked until you master what comes before it.

---

### 5. A lesson (5:15 to 7:00)

Open the current lesson.

> Here's a lesson, and this is where most of the work since the progress report has gone.
>
> Visuals come first. The recording, then the walkthrough, then the real chart, then the prose. That ordering is deliberate and it was a fix: I had the charts below the text and couldn't find them myself.

Play a couple of seconds of the video, then stop.

> The recording, where there is one. Thirty-three of the sixty-six lessons have one.

Scroll to the walkthrough. Step through three or four steps with the arrow keys.

> And this is what the other thirty-three have instead, and honestly what I'd now argue is better. It's a stepped, annotated chart. The price series is built from control points rather than recorded, so the sweep and the break and the gap are exactly where the caption says they are. Each step lays one thing on top: a level, a zone, a session window, an arrow. Earlier layers dim, the current one is bright.
>
> Arrow keys step it. The caption is a live region so a screen reader announces each step. And there's a Describe button that lays the whole sequence out as text.

*(Click Describe, show it, close it.)*

> Forty-eight of these across the curriculum. For a structure concept this is more precise than a screen recording, and it's accessible in a way a video never was.

Scroll to the real chart block.

> And then, after the built example, a real one. Sixteen lessons carry a historical case study cut from actual ES and NASDAQ futures bars. The caption quotes the real date and the real prices, and the frame says historical, attributed, not live, not a signal.
>
> These were found by code, not by me hunting for a chart that flattered the idea. There's a detector per concept that encodes the lesson's own rule, scores every instance in the data, and keeps the cleanest one. That distinction matters: if I'd picked them by eye, they'd be cherry-picked.

Scroll to the end-of-lesson check.

> Every lesson ends on a check. Three questions from that module's bank. Get one wrong and it shows you the answer, explains the idea, and gives you a similar question. Miss that one too and it shows the answer and moves on rather than grinding you.
>
> Every answer in there, retries included, goes into the same log as everything else.

---

### 6. The adaptive loop, and the visible mind (7:00 to 9:30)

Click **Practise**.

> Now the core. Watch the launcher for a second.

*(The routing readout plays.)*

> That's the engine narrating its own decision. Which modules are unlocked, which has the lowest estimate, what band that puts me in, what difficulty that earns. Then the session starts.
>
> Top of the screen is my live mastery for this topic. Watch that number as I answer.

*(Answer one correctly.)*

> Correct, and the estimate moves. Now this is the bit I'd point at if you asked what's original here.

*(Click **Why this question?**)*

> The learner can ask the system why. And these are the real values the routing engine used: my current estimate, the band it puts me in, the difficulty it chose as a result, and the probability the model thinks I'll get this right.
>
> None of that is generated for display. It's the actual decision object the engine returned. Which means the explanation is structurally incapable of disagreeing with the behaviour, because there's only one of them.

*(Answer two deliberately wrong.)*

> Two wrong on purpose. Notice the feedback is amber, not red. It doesn't shake and it doesn't flash. Wrong answers in a learning system shouldn't feel like punishment. And after two consecutive misses the router drops into remediation and serves an easier question instead of pushing on.

*(Finish the session. Let the ceremony fire if it does.)*

> When a module crosses 0.8 you get the ceremony and the next one unlocks. Back on the map, the route has extended.

**Delivery note.** This section is the heart. If you're running long, cut from elsewhere.

---

### 7. The research data (9:30 to 10:30)

Click **Review answers**, then switch to the Firebase console.

> Post-session review. Every question, what I answered, what was right, and why.
>
> But underneath that, here's what the project is actually for.

*(Open a user's sessions, then responses.)*

> Every answer I just gave is a record. The question, the module, whether I was right, how long I took in milliseconds, and critically the model's estimate before the answer and after it.
>
> That last pair is what makes this a research dataset rather than an app log. With the prior and the posterior on every row I can reconstruct a whole learning trajectory and test whether the model's estimates actually track performance. Which is exactly what I'll show you in a minute.
>
> Two things about how it's built. The log is append-only, enforced in the database rules, so not even the account that wrote a row can edit or delete it. And writes are queued locally first, so if the network drops mid session nothing is lost. There's an end-to-end test that kills the connection halfway through a session and then counts the rows.

---

### 8. Into the code (10:30 to 12:45)

VS Code, `lib/bkt/index.ts`.

> Let me show you what's driving it. This is the Bayesian Knowledge Tracing engine and it's the centre of the project.
>
> BKT is Corbett and Anderson, 1994. It models the probability a learner knows a skill and updates it after every answer. Four parameters: the prior, the chance of learning on a given attempt, the chance of guessing right while not knowing, and the chance of slipping while knowing.
>
> Here's the update. Condition on the evidence, then apply the learning step. About fifteen lines of actual maths.
>
> Two decisions I'd defend. First, this file has zero dependencies and zero Firebase imports. Pure TypeScript. That makes it trivially testable and it means the model is portable if the platform changes. Second, the thresholds are constants in one file rather than magic numbers scattered about, because they're the same 0.8 and 0.4 the report cites and drift between the two would be a defect.

Open `tests/unit/bkt.test.ts`.

> The tests for it are hand-computed. I worked the arithmetic out by hand and asserted against those figures, so if the implementation drifts the test fails against maths rather than against itself.

Open `lib/routing/index.ts`.

> Routing is the other pure module. Given a mastery map and the prerequisite graph it decides what happens next: which modules are unlocked, whether to teach, practise or remediate, and which specific question to serve.
>
> That's the object the "why this question" panel displays. Same data, no translation layer.

Open `lib/walkthroughs/synth.ts` briefly.

> And this is the one people don't expect. The walkthrough charts aren't recorded data and they aren't random. It's a seeded generator that takes control points and forces specific candles, so when a caption says "price sweeps the high here and leaves a gap there", the bars do exactly that. There's a unit test that checks every step's markers land inside its own chart and sit on the candle they name, which is how I found the label collisions.

Open `lib/logging/logger.ts`.

> Last one, the response logger. I'll be honest about why it looks like this. The obvious version just writes and hopes. But the Firebase SDK keeps its own retry queue, so if you put a queue in front of it, both hold the same write when the connection drops and both deliver on reconnect. That's duplicate rows in the research data, silently, months later. So this fails fast when the browser reports itself offline and my queue is the single authority.
>
> That's the class of bug that never shows up in a demo.

**Delivery note.** Don't scroll fast. Land on one screenful, point at it, talk. If you're short, cut routing and the synth generator and keep BKT and the logger.

---

### 9. Evidence (12:45 to 14:15)

Terminal.

```bash
npm run test
```

> Unit tests across the engine, the routing rules, grading, the logger and the walkthrough geometry.

*(While it runs, or after.)*

> On top of that, fourteen tests on the database security rules, which check the append-only guarantee actually holds against a caller who never touches the interface. And end-to-end tests driving real browsers through the real journeys on desktop and mobile, one of which completes a session with the network killed halfway and then verifies every response still arrived.

Open `docs/report/CALIBRATION.md`.

> And this is the evidence I'd most want you to see, because it's the part that tests the model rather than the code.
>
> Every logged answer carries the model's estimate from before the answer. Push that through the emission model and it becomes a forecast: this learner has a 70% chance of getting this right. A calibrated model's forecasts come true at the rate they claim.
>
> Across eight thousand simulated answers, the expected calibration error is 0.43 of a percentage point. The Brier skill score against a base-rate baseline is 26%. In the reliability table, the bin where the model predicts about 30% comes in at 29.8% observed.
>
> And here's the result I didn't expect. I tested whether fitting the parameters per learner beats the fixed literature defaults, which is the obvious next step everyone assumes you should take. On held-out data, fitting makes the forecasts slightly worse. Brier goes from 0.0994 to 0.1011 and calibration error nearly doubles.
>
> So the defaults stay, and that's now an evidence-based decision rather than a convenience. I'm also clear about the limit: the simulation shares the engine's own guess and slip parameters, so this tests wrong priors, not the emission model. Real learner data is what settles that.

---

### 10. Limitations and close (14:15 to 15:00)

Show the live URL on screen.

> It's deployed, at tmacademyuk.vercel.app, running against the real database.
>
> Now the limits, because I'd rather state them than have them drawn out of me.
>
> This is validated against simulated learners, not human ones. Everything I've shown you is about correctness, behaviour and calibration. None of it is about whether anybody learns. That's the honest boundary, and it's the obvious next step.
>
> The parameters are literature defaults rather than values fitted to real responses, which the calibration work says is the right call for now but not forever.
>
> And I cut things deliberately. There was a mentor marketplace and a trading simulator in the original design. Both are documented, with the reasoning, in the repository. The marketplace in particular introduced paid-guidance risks that don't belong in an educational research artefact.
>
> So, to close. The loop works end to end, it's tested at four levels, the model is calibrated and the calibration is reported honestly, it produces an exportable research dataset, and it's live. The whole thing is on GitHub and the link's in the report.
>
> Thanks for watching. Happy to take questions.

---

## Question and answer preparation

Answer in three parts. Direct answer, one piece of evidence, then stop. The commonest mistake isn't being wrong, it's carrying on talking past a perfectly good answer.

### About the model

**Why Bayesian Knowledge Tracing rather than a neural approach like Deep Knowledge Tracing?**
Interpretability and data volume. DKT usually beats BKT on raw predictive accuracy, but it needs far more interaction data than a single project can gather, and it can't tell a learner why it made a decision. Since one of my aims was that the model be inspectable, a four-parameter model I can display in a panel was the right trade.

**Where do the parameters come from, and shouldn't you fit them?**
Literature defaults: 0.25 prior, 0.12 learn rate, 0.2 guess, 0.1 slip. And I tested exactly that question. The calibration report fits the prior and the learn rate per learner on twenty answers and scores the held-out half, and the fitted model comes out slightly worse than the fixed defaults. So fitting is the right thing to do eventually, but not at this data volume, and I have the number rather than the opinion.

**How do you know the engine is correct?**
Two ways. The unit tests assert against arithmetic I worked out by hand, so they test the maths rather than the code's opinion of itself. And the calibration report checks the model's forecasts against observed outcomes, which is a different question from whether the code runs.

**Why 0.8 and 0.4?**
0.8 is a conventional mastery threshold in the BKT literature and it's what my progress report committed to. 0.4 for remediation was my decision, chosen so a learner who genuinely doesn't know something drops into support quickly rather than grinding. They're constants in one file, so they're easy to revise and easy to justify.

**What does the calibration result actually mean?**
That when the model says 70%, it's right about 70% of the time. Expected calibration error of 0.43 of a percentage point across eight thousand answers. That matters more than raw accuracy for a system that acts on its predictions, because the routing reads the probability, not a label.

### About the evaluation

**You haven't tested this with real learners. Isn't that a problem?**
It's the main limitation and I'd rather say it than have it dragged out. What I have is a system verified to behave correctly, calibrated against a simulated cohort, and instrumented to collect exactly the data a human study would need. Ethics approval, recruitment and a pre-post design are the next phase. The artefact is what makes that study possible.

**What would you measure with real learners?**
Normalised learning gain between a pre-test and a post-test, and whether the model's predicted probability matches observed accuracy on real answers. The log carries predicted and actual on every row, so calibration is directly computable. I'd also want time-to-mastery against a non-adaptive control.

**How many participants?**
For a within-subjects pre-post design, thirty to forty gets reasonable power for a medium effect. A controlled comparison against a fixed-order version of the same content would need roughly double, and that's the more valuable study because it isolates the adaptation rather than the content.

### About the build

**Why Next.js and Firebase?**
Firebase gave me authentication, a database and security rules that are themselves testable, which mattered because the append-only guarantee on the response log is a rule, not a convention. Next.js because the app is content-heavy. Neither choice is load-bearing for the research, which is why the engine and the routing are isolated from both.

**How much of this did you write?**
All of the design decisions and the architecture. I used AI assistance during implementation, declared in the report. What I'd point at as mine is the decisions record: over seventy documented decisions with the reasoning, including the ones I reversed.

**Give me an example of a reversal.**
Two good ones. I built an animated background effect, measured it, found it dropped the dashboard from 120 frames per second to 19, and deleted it. And I reversed the whole dev-server arrangement: `npm run dev` used to be the emulator with the real app on a second port, I landed on the emulator's fake Google page three times in one day reading it as a bug, and two servers sharing a build folder corrupted it three times. Now `npm run dev` is the real app and the emulator moved to its own port and its own build folder.

**What was the hardest bug?**
The duplicate-write problem in the logger. My retry queue and the Firebase SDK's internal queue would both hold the same write when the connection dropped, and both would deliver on reconnect. It doesn't show up in normal use. It shows up as duplicate rows in the research data, much later. The fix was to fail fast when offline so my queue is the only authority.

**Why sixteen modules? Where did the content come from?**
Two sources, and they're separated in the repository. The first nine modules came from a video curriculum of about three and a half hours that I transcribed and rewrote as structured lessons. The remaining seven were written from cited public ICT and TTrades teaching, with ninety-three sources listed per lesson in `docs/LESSON_SOURCES.md`. None invented. The sequencing came out of a dependency analysis rather than the recording order, which is why risk and position sizing sits third: every module from five onward quotes risk multiples that are meaningless before sizing is taught.

**Why build walkthroughs instead of just recording the missing videos?**
Partly time, honestly. But having built them I'd defend them on the merits. A stepped chart is more precise than a screen recording for a structure concept, because the bars are constructed so the thing being described is exactly where the caption says. It's keyboard operable, it announces each step to a screen reader, and it has a full text description. A video has none of that.

**Aren't the walkthrough charts fake data?**
They're constructed, and the interface says so on every one. That's the point rather than a weakness: a randomly generated chart wouldn't reliably contain the pattern being taught, and a real chart cherry-picked by me to show the pattern would be worse science than one I built openly. And the sixteen real-chart case studies are genuine historical bars, attributed and dated, found by detectors rather than by eye.

### About ethics

**Trading education is sensitive. How did you handle that?**
By making the constraints structural rather than cosmetic. Simulated or clearly labelled historical data only, no broker connection, no signals, eighteen plus enforced in the database rules as well as the interface, real GDPR consent with a working decline, and download or delete your data in settings. I also cut a mentor marketplace specifically because paid trading guidance carries risks that don't belong here.

**Did you ever have to say no to yourself?**
Twice, and both are in the decision log. I wanted copy about producing profitable traders, and that's a claim the site can't make: the FCA's financial-promotions rules bite on exactly that language and no course can honestly promise it. The path is framed as competence instead. And when I first wanted real market data, the consent screen and the ethics application both said everything was simulated, so I didn't do it. The real charts only went in after the consent wording, the legal page and the report were changed to say "simulated or clearly labelled historical".

**Where's the data stored, and is it separated?**
Two projects. Development and tests run against a local emulator on its own port with its own build folder, and a separate live project holds real users. Every automated path is pinned to the emulator by construction. That's a lesson learned the hard way: early on some test accounts did reach the live project. I deleted them, verified, and then made it impossible by design rather than by discipline.

### If something breaks

**If the demo fails live.** Say "let me show you this from the recording instead" and switch to your backup video. Do not debug on camera. Have the backup ready before you start.

**If you're asked something you don't know.** "I don't know, and I'd want to check before giving you a wrong answer" is completely acceptable at this level. Then say how you'd find out. Guessing is much worse.

**If a question challenges a decision.** Don't defend reflexively. "That's fair, and here's why I went the other way" is stronger than pretending there was no trade-off.

---

## Practice plan

Four rehearsals. Don't do them all in one day.

**Run one, script in hand, no recording.** Read it aloud at the pace you'd actually speak. Time each section and write the real timings in the margin. Some sections will be twice as long as you think.

**Run two, bullet points only.** Reduce each section to about five words. "Ethics gate, 18 plus, consent, decline is real." Deliver from those. This is where it stops sounding read.

**Run three, full recording, no stopping.** Whatever goes wrong, keep going. The point is to find what breaks under pressure and to get used to recovering without stopping. Watch it back with the sound on.

**Run four, the real take.** Do this when you're fresh, not at eleven at night.

**Q&A practice, separately.** Get someone to read you the questions above in random order. Answer out loud. The written answers are to internalise, not to memorise. Reciting them will sound like reciting them.

### Things that go wrong, and what to do

| Problem | What to do |
| --- | --- |
| A page hangs | Refresh once. If it hangs again, switch to the backup recording. |
| Port 3000 is busy | `npm run stop && npm run dev`. The guard will tell you if something's still holding it. |
| A video won't play | Skip to the walkthrough. It's the better demo anyway and you have a line ready. |
| You lose your place | Stop. Breathe. "Let me pick that up again." It reads as composure. |
| Running long | Cut section 8's routing and synth files, and the review queue. Never cut section 6. |
| Running short | Open the decision log and talk through two reversals. There's plenty there. |
| A question runs away | "That's probably a longer conversation than we've got, but the short answer is X." |

### Record a backup

Do this the day before. Record a clean run of just the demo, sections 2 through 7, with no talking. If anything fails on the day you play that and narrate over it. Twenty minutes, and it removes almost all of the risk.

---

## Alternative timings

**Ten minute version.** Sections 1, 2 (consent screen only), 3, 5 (walkthrough only), 6, 9 (calibration only), 10. Drop the dashboard tour, the code walkthrough and the database.

**Twenty minute version.** Everything above, plus: step a full walkthrough end to end with the Describe panel open, open `firestore.rules` and read the append-only rule aloud, run the simulated-learner harness live so the output prints on screen, and talk through two entries from the decision log.
