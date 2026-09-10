# TradeMind Academy: Demonstration Script

**Ogechukwu Adama, 10440379**
Module QHO656 Dissertation Project · Supervisor: Prashant Bikram Shah
Artefact: https://github.com/OGSOLENT/TradeMind_Academy

Target length 15 minutes plus Q&A. Timings in the margin. There's a 10 minute cut and a 20 minute extended version at the bottom if the slot is different.

**What this presentation is.** A demonstration that the artefact works, plus a walkthrough of how it was built. It is not about how I managed the project. That's in the report.

---

## Before you hit record

Run through this list every time, including the real take. Most demo failures are environment failures, not nerves.

**About 20 minutes before**

1. Restart the machine, or at least quit everything you don't need. The dev server degrades after long uptime and pages start timing out. I've had that happen mid session.
2. Open a terminal and start the emulator:
   ```bash
   cd ~/Documents/DIssertation/TradeMind_Academy && npm run emulators
   ```
   Wait for "All emulators ready".
3. Second terminal, seed and start the app:
   ```bash
   cd ~/Documents/DIssertation/TradeMind_Academy && npm run seed && npm run dev
   ```
4. Confirm only one server is running. Two will fight over the build folder and serve stale pages:
   ```bash
   ps aux | grep -c "[n]ext-server"
   ```
   You want 2 there (that's one server, it spawns a child). If you see 4, kill everything with `pkill -f "next dev"` and start over.

**Tabs to have open, in this order**

1. `localhost:3000` on the landing page
2. `localhost:4000` (the emulator UI, for the database section)
3. The GitHub repo
4. VS Code with `lib/bkt/index.ts` already open
5. `docs/EVALUATION.md`

**Do a throwaway run.** Sign up with a junk email, click through the whole flow once, then close that tab. It warms up every route so nothing compiles on camera. This is the single highest value thing on this list.

**Recording setup**

- Share the whole screen, not a window. You're switching between browser, terminal and editor.
- Zoom the browser to about 125%. Text that's readable on your monitor is unreadable in a compressed recording.
- Close Slack, mail, notifications. Do not skip this.
- Test your mic for 10 seconds and play it back before the real take.
- Have a glass of water off camera.

---

## The script

### 1. Opening (0:00 to 1:15)

> Hi, I'm Ogechukwu Adama. This is TradeMind Academy, an intelligent tutoring system for trading education, and it's the artefact for my dissertation project.
>
> I want to start with the problem, because it shapes everything you're about to see.
>
> Trading education online is mostly video. You watch someone explain a concept, you nod along, and then you've got no idea whether you've actually learned it. There's no model of what you know. Nothing adapts. Everybody gets the same content in the same order regardless of what they already understand, and the feedback loop is basically absent.
>
> So the research question I set was this. Can a Bayesian Knowledge Tracing model drive a genuinely adaptive learning loop in this domain, and can that system produce interaction data good enough to evaluate whether the adaptation actually works?
>
> That second half matters as much as the first. It's not enough to build something that feels adaptive. It has to record evidence.
>
> What I'll do now is demonstrate the full loop working, then take you into the code that drives it, then show you the evidence it produces. About fifteen minutes, and then I'm happy to take questions.

**Delivery note.** Don't rush this. It's the only part where you set up why anything else matters. Slow down on the research question.

---

### 2. The ethics gate (1:15 to 2:30)

Screen: `localhost:3000`, then click through to sign up.

> Before I show you the learning, I want to show you the gate in front of it, because this is a research artefact and that shaped the design.
>
> Here's the landing page. The disclaimer is not buried in a footer. Every chart in this system is simulated. There's no broker connection, no live market data, no signals, and it's eighteen plus.

Click **Start free**. Fill the sign up form.

> Sign up. Notice the eighteen plus checkbox. Let me try to submit without it.

*(Submit without ticking. Let the error show.)*

> That's blocked in the interface, and it's also blocked in the database rules, so you can't get past it by manipulating the client. I'll show you that rule later.

*(Tick the box, submit.)*

> And then consent. This is real GDPR copy. It tells the learner exactly what's recorded, that the lawful basis is consent, and that they can withdraw. And Decline is a real button, it isn't decoration. If you click it you get signed out and nothing is collected.
>
> I'm going to accept, because otherwise this is a very short demonstration.

**Delivery note.** The failed submit is worth doing live. It proves the gate rather than describing it. Practise it so the timing is smooth.

---

### 3. Placement and the model initialising (2:30 to 4:15)

> Now the interesting part. Before I've read anything, the system needs a starting estimate of what I know. So it runs a short placement test, one question per module.

Click **Start placement**. Answer the first two out loud.

> These are real questions written from the course content. I'll answer a few correctly and get a couple wrong deliberately, so you can see the model respond rather than just go up.

*(Answer the rest quickly. Get roughly two wrong on purpose.)*

> And this is what I think is the nicest moment in the product.

*(Constellation initialisation plays.)*

> That's the model initialising. Every node is a knowledge component, and the ring around each one is the probability that I know it, estimated from the answers I just gave. The caption says "your starting map", and that's literally what it is. The learner can see the model that's about to make decisions for them.
>
> That's a deliberate design position. A lot of adaptive systems are a black box. This one shows its working, and you'll see that again in a minute.

---

### 4. The dashboard and the routing decision (4:15 to 5:30)

Click through to the dashboard.

> Here's the dashboard. Top of the page, the system has picked what I should do next. It's chosen The Candle, because that's my lowest mastery unlocked module, and it's telling me to read the lesson rather than practise, because I haven't attempted it yet.
>
> That's not a menu I'm browsing. That's a routing decision, made by rules I'll show you in the code.
>
> Underneath, the mastery estimate per module over time, and a review queue for anything that's fading.

Click **Skill Tree**.

> And this is the whole curriculum as a route. Nine modules in a strict prerequisite chain. The lit part of the path is how far I've actually got, and that light at the head is my current position. Everything ahead is locked until I master what comes before it.
>
> Nine modules, thirty three lessons, seventy two assessment questions, all written from a real trading curriculum.

---

### 5. A lesson (5:30 to 6:45)

Click into the current lesson.

> Here's a lesson. Reading column, progress bar at the top, and the actual video embedded.
>
> This content is real. I built the curriculum from a set of video lessons, roughly three and a half hours of material, and I wrote each one up as a structured written lesson so the platform has both formats.
>
> Two accessibility things worth pointing out. Every figure has a "describe this chart" toggle, so a screen reader user gets a text alternative rather than a decorative image.

*(Click the toggle.)*

> And there's an inline knowledge check partway through, which collapses to a tick once you've got it.
>
> At the bottom, every lesson in this module, so nothing is unreachable.

---

### 6. The adaptive loop, and the visible mind (6:45 to 9:30)

Click **Practise**.

> Now the core of it. This is a practice session, and every question in it is chosen by the model.
>
> Top of the screen you can see my live mastery for this topic. Watch that number as I answer.

*(Answer one correctly.)*

> Correct, and the estimate moves up. Now this is the bit I'd point to if you asked me what's original about this project.

*(Click **Why this question?**)*

> The learner can ask the system why. And these are the real values the routing engine used. My current estimate, which band that puts me in, the difficulty it chose as a result, and the probability the model thinks I'll get this right. None of that is generated for display. It's the actual decision object.
>
> That's the "visible mind" idea. If a system is going to model you, you should be able to inspect the model.

*(Answer two deliberately wrong.)*

> Now I'll get a couple wrong on purpose. Notice the feedback is amber, not red. It doesn't shake, it doesn't flash. That's deliberate. Wrong answers in a learning system shouldn't feel like punishment, and after two consecutive misses the router drops me into remediation and serves an easier question rather than pushing on.

*(Finish the session. Let the mastery ceremony fire if it does.)*

> And when a module crosses the mastery threshold, which is 0.8, you get the ceremony, and the next module unlocks. Back on the map you can see the route has extended and the next node has opened up.

**Delivery note.** This section is the heart. If you're running long, cut from elsewhere, not here.

---

### 7. The research data (9:30 to 10:30)

Click **Review answers**, then switch to the emulator UI at `localhost:4000`.

> Post session review. Every question, what I answered, what was correct, and the explanation.
>
> But underneath that, this is what the project is actually for.

*(In the emulator UI, open a user's `sessions` then `responses`.)*

> Every answer I just gave is a record here. Question, topic, whether I got it right, how long I took in milliseconds, and critically, the model's estimate before the answer and after it.
>
> That last pair is what makes this a research dataset rather than an app log. With those two numbers on every response I can reconstruct the entire learning trajectory and test whether the model's estimates actually track performance.
>
> Two things about how this is built. The log is append only, enforced in the database rules, so not even the account owner can edit or delete a response. And the writes are queued locally, so if the network drops mid session nothing is lost. I test that by actually killing the connection during a session.

---

### 8. Into the code (10:30 to 13:15)

Switch to VS Code, `lib/bkt/index.ts`.

> Let me show you what's driving it. This is the Bayesian Knowledge Tracing engine, and it's the centre of the whole project.
>
> BKT is Corbett and Anderson, 1994. It models the probability a learner knows a skill, and updates that probability after every observation. Four parameters. The prior, the probability of learning on a given attempt, the probability of guessing correctly while not knowing, and the probability of slipping while knowing.
>
> Here's the update. When a learner answers, you condition on the evidence, then apply the learning step. It's about fifteen lines of actual maths.
>
> Two design decisions I'd defend. First, this file has zero dependencies and zero Firebase imports. It's pure TypeScript. That means it's trivially unit testable, and it means the model is portable if the platform changes. Second, the thresholds are constants, not magic numbers scattered around the codebase, because they're the same 0.8 and 0.4 that the report cites.

Open `tests/unit/bkt.test.ts`.

> And the tests for it are hand computed. I worked the arithmetic out by hand and asserted against those figures, so if the implementation drifts the test fails against maths rather than against itself.

Open `lib/routing/index.ts`.

> Routing is the other pure module. Given a mastery map and the prerequisite graph, it decides what happens next. Which modules are unlocked, whether to teach, practise or remediate, and which specific question to serve.
>
> That's the object the "why this question" popover displays. Same data, no translation layer, which is why the explanation can't drift out of sync with the decision.

Open `lib/logging/logger.ts`.

> And this is the response logger. I'll be honest about why it looks like this. The obvious implementation just writes to the database and hopes. But the Firebase SDK has its own retry queue, and if you let both queues hold the same write you get duplicates on reconnect, which would silently corrupt the research dataset. So this fails fast when the browser is offline and keeps my queue as the single authority.
>
> That's the kind of bug that doesn't show up in a demo. It shows up six months later in the data.

**Delivery note.** Don't scroll fast. Land on one screenful, point at it, talk. If you're short on time cut the routing file and keep BKT and the logger.

---

### 9. Evidence (13:15 to 14:30)

Terminal.

```bash
npm run test
```

> Fifty four unit tests on the engine, the routing rules, the grading and the logger.

*(While it runs, or after.)*

> On top of that there are fourteen tests on the database security rules, which check that the append only guarantee actually holds, and twenty four browser tests that drive the real user journeys end to end. One of those completes a full session with the network killed halfway through and then verifies every response still arrived.

Open `docs/EVALUATION.md`.

> And this is the validation of the model itself. I built a simulated learner harness. It generates two hundred synthetic learners with known parameters, has them answer through the true generative model, then runs the real engine over their responses and checks three things. That a correct streak crosses the mastery threshold in a sensible number of attempts. That a wrong streak stays in the remediation band. And that improving learners climb. All three pass, and there's a parameter recovery table showing how closely the engine recovers the parameters it was never told.
>
> Accessibility is audited too, and it scores a hundred on Lighthouse, which matters because an educational tool that excludes people isn't much of an educational tool.

---

### 10. Limitations and close (14:30 to 15:00)

> I want to be straight about the limits.
>
> This is validated against simulated learners, not human ones. That's the honest boundary of the evaluation, and it's the obvious next step.
>
> The BKT parameters are the standard literature defaults rather than fitted per knowledge component, which is a known improvement path.
>
> And I deliberately cut features. There was a mentor marketplace and a trading simulator in the original design. I cut both, documented why, and that's in the repository as future work. The marketplace in particular introduced paid guidance risks that don't belong in an educational research artefact.
>
> So, to close. The loop works end to end, it's tested, the model is validated against simulated learners, and it produces an exportable research dataset. The whole thing is on GitHub, and the link's in the report.
>
> Thanks for watching. Happy to take questions.

---

## Question and answer preparation

Answer in three parts. Say the direct answer, give one piece of evidence, then stop. The commonest mistake is not being wrong, it's carrying on talking past a perfectly good answer.

### About the model

**Why Bayesian Knowledge Tracing rather than a neural approach like Deep Knowledge Tracing?**
Interpretability and data volume. DKT usually beats BKT on raw predictive accuracy, but it needs far more interaction data than a single project can gather, and it can't tell a learner why it made a decision. Since one of my aims was that the model be inspectable, a four parameter model I can display in a popover was the right trade.

**Where do the parameters come from?**
Literature standard defaults. 0.25 prior, 0.12 learn rate, 0.2 guess, 0.1 slip. The schema supports per component parameters, so fitting them from real learner data is a straightforward extension. I didn't fit them because I don't have human data yet, and fitting to simulated data would just recover what I put in.

**Why 0.8 and 0.4 for the thresholds?**
0.8 is a conventional mastery threshold in the BKT literature and it's what my AE1 report committed to. 0.4 for remediation was my own decision, chosen so that a learner who genuinely doesn't know something drops into support quickly rather than grinding. They're constants in one file, so they're easy to change and easy to justify or revise.

**How do you know the engine is correct?**
Two ways. The unit tests assert against arithmetic I worked out by hand, so they test the maths rather than the code's opinion of itself. And the simulation harness generates learners with known parameters and checks the engine recovers sensible behaviour from their responses.

### About the evaluation

**You haven't tested this with real learners. Isn't that a problem?**
It's the main limitation and I'd rather state it than have it drawn out of me. What I have is a system that's verified to behave correctly and instrumented to collect exactly the data a human study would need. Ethics approval, recruitment and a pre post design would be the next phase. The artefact is the thing that makes that study possible.

**What would you actually measure with real learners?**
Normalised learning gain between a pretest and a posttest, and whether the model's predicted probability of a correct answer matches observed accuracy. The response log has predicted and actual on every row, so that's directly computable. I'd also want time to mastery per component against a non adaptive control.

**How many participants would you need?**
For a within subjects pre post design, somewhere around thirty to forty gets you reasonable power for a medium effect. A controlled comparison against a fixed order version of the same content would need more, probably double.

### About the build

**Why Next.js and Firebase?**
Firebase gave me authentication, a database and security rules that are themselves testable, which mattered because the append only guarantee on the response log is a rule, not a convention. Next.js because the app is content heavy and the framework handles routing and rendering without much ceremony. Neither choice is load bearing for the research. The engine is deliberately isolated from both.

**How much of this did you write?**
All of the design decisions and the architecture. I used AI assistance during implementation, which is declared in the AI declaration appendix. What I'd point to as mine is the decisions record. There are around twenty five documented decisions in the repository, each with the reasoning, including several where I built something, measured it, and removed it.

**Can you give an example of that?**
Yes. I built an animated background effect that looked good, then measured it and found it dropped the dashboard from 120 frames per second to 19. I cut it and got the same visual result from static layers at no cost. That's in the decisions file with the numbers.

**What was the hardest bug?**
The duplicate write problem in the logger. My retry queue and the Firebase SDK's internal queue would both hold the same write when the connection dropped, and both would deliver on reconnect. It doesn't show up in normal use. It shows up as duplicate rows in the research data much later. The fix was to fail fast when offline so my queue is the only authority.

**Why nine modules? Where did the content come from?**
The content is a real trading curriculum, about three and a half hours of video across thirty three lessons. I sequenced it by building the actual dependency graph of the concepts rather than keeping the recording order, because several videos used terms that hadn't been defined yet. The modules fell out of that dependency analysis.

### About ethics

**Trading education is a sensitive area. How did you handle that?**
By making the constraints structural rather than cosmetic. Simulated data only, no broker connection, no signals, eighteen plus enforced in the database rules as well as the interface, real GDPR consent with a working decline, and download or delete your data in settings. I also cut a mentor marketplace from the design specifically because paid trading guidance carries risks that don't belong in an educational artefact.

**Where's the data stored and is it separated?**
Two databases. Development and testing run against a local emulator that wipes on restart, and there's a separate live project reserved for real participants. That split is enforced by configuration, so a test account can't reach the research database. That's a lesson learned the hard way, actually. Early on some test users did leak into the live project. I deleted them and then made it impossible by construction, and that's documented.

### If something breaks

**If the demo fails live.** Say "let me show you this from the recording instead" and switch to your backup video. Do not debug on camera. Have the backup ready before you start.

**If you're asked something you don't know.** "I don't know, and I'd want to check before I gave you a wrong answer" is a completely acceptable response at this level. Then say what you'd do to find out. Guessing is much worse.

**If a question challenges a decision.** Don't defend reflexively. "That's fair, and here's why I went the other way" is stronger than pretending there was no trade off.

---

## Practice plan

Four rehearsals. Don't do them all in one day.

**Run one, script in hand, no recording.** Read it aloud at the pace you'd actually speak. Time each section and write the real timings in the margin. You'll find some sections are twice as long as you thought.

**Run two, bullet points only.** Reduce each section to about five words. "Ethics gate, 18 plus, consent, decline is real." Deliver from those. This is where it stops sounding read.

**Run three, full recording, no stopping.** Whatever goes wrong, keep going. The point is to find out what breaks under pressure, and to get used to recovering without stopping. Watch it back with the sound on, which is uncomfortable and useful.

**Run four, the real take.** Do this when you're fresh, not at eleven at night.

**Q&A practice, separately.** Get someone to read you the questions above in a random order. Answer out loud. The written answers are for you to internalise, not to memorise. Reciting them will sound like reciting them.

### Things that go wrong, and what to do

| Problem | What to do |
|---|---|
| A page hangs | Refresh once. If it hangs again, switch to the backup recording. |
| You lose your place | Stop. Breathe. "Let me pick that up again." It reads as composure. |
| You're running long | Cut the routing file walkthrough and the review queue. Never cut section 6. |
| You're running short | Open `docs/DECISIONS.md` and talk through two decisions. There's plenty there. |
| A question runs away | "That's probably a longer conversation than we've got, but the short answer is X." |

### Record a backup

Do this the day before. Record a clean run of just the demo, sections 2 through 7, with no talking. If anything fails on the day you can play that and narrate over it. It takes twenty minutes and it removes almost all of the risk.

---

## Alternative timings

**Ten minute version.** Sections 1, 2 (compressed to the consent screen only), 3, 6, 8 (BKT only), 9, 10. Drop the dashboard tour, the lesson, and the routing and logger code.

**Twenty minute version.** Everything above, plus: walk the constellation route and explain the prerequisite chain properly, open `firestore.rules` and read the append only rule out loud, run the simulated learner harness live so the output prints on screen, and talk through two entries from the decisions record.
