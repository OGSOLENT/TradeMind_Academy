# TradeMind Academy: Code Defence Pack

## How to use this

- This is a reference for answering questions about the build, not a script. The script is a separate document.
- Everything in here is true of the build as it stands on 17 September 2026, commit `ae66449`. Where a number could move, the command that produces it is given so you can re-check on the day.
- Read it once end to end, then drill the last two sections. Those are the ones that get asked.
- If you only memorise one page, memorise **Numbers you must know cold**.

## Do this before Friday

- **Push your commits.** There are **18** commits on `main` that aren't on GitHub. If a marker opens the repository they'll be looking at a much earlier build, not this one. `git push` and confirm the count matches. This is the highest-value item on the list and it takes ten seconds.
- **Run the suites once** and write the numbers down: `npm run test`, `npm run test:rules`, `npm run test:e2e`, `npm run test:coverage`. The counts in this pack come from `docs/EVALUATION.md` on the current commit, so a fresh run is what confirms them.
- **Open the live site** and click through it once, so you know what a marker sees if they visit it while you talk.
- **Record the backup demo.** Twenty minutes the day before removes almost all the risk.

---

# 1. The sixty-second answer

- TradeMind Academy is an intelligent tutoring system for trading education. It models what each learner knows, per topic, as a probability, and decides what they do next from that estimate alone.
- The model is Bayesian Knowledge Tracing, Corbett and Anderson 1994. Four parameters, one probability per topic per learner, updated after every answer.
- The routing is deliberately rule-based, not learned, so every decision can be shown to the learner and inspected by a marker.
- Every answer is written to an append-only log carrying the model's estimate before and after it, which turns the system into a research instrument rather than just an app.
- It's live at tmacademyuk.vercel.app, running against a real database, with sixteen modules, sixty-six lessons and a hundred and sixteen questions.
- What it has not shown is that anyone learns from it. The study instruments are built and tested, so what's missing is recruitment rather than engineering. Everything claimed is about correctness, behaviour, calibration and policy efficiency.

# 2. Numbers you must know cold

## The curriculum

- **16** modules, in a single prerequisite chain, grouped into **6** stages on the landing page.
- **66** lessons. **33** have a recorded video, **33** don't.
- **116** assessment questions across **6** question types.
- **36** questions are marked pretest-eligible, so placement is one question per module, sixteen questions.
- **48** stepped chart walkthroughs.
- **16** real-chart historical case studies.
- **117** cited sources for the lessons written from published teaching, **33** lessons across **8** modules, listed lesson by lesson in `docs/LESSON_SOURCES.md`.
- Difficulty split across the item bank: **23** easy, **60** medium, **33** hard.

## The model

- Parameters: prior **0.25**, learn rate **0.12**, guess **0.2**, slip **0.1**. All literature defaults.
- Mastery threshold **0.8**. Remediation threshold **0.4**.
- Difficulty ladder: easy below 0.4, medium below 0.7, hard at 0.7 and above.
- Remediation trigger: **two consecutive wrong answers** on a module forces an easy item.
- A worked chain you should be able to recite: a fresh topic answered correctly three times runs **0.25 → 0.648 → 0.905**. Those are the hand-computed unit-test fixtures and the same numbers appear in the exported CSV.

## The evidence

- Simulated harness: **200** learners, **40** opportunities each, seed 42.
- Sanity checks: a correct streak crosses 0.8 in **2** items; a wrong streak peaks at **0.1552**, well inside the remediation band; **99.0%** of improving learners are tracked upward.
- Parameter recovery: RMSE **0.2348** on the prior (bias −0.1023), RMSE **0.1139** on the learn rate (bias +0.0609).
- Calibration, fixed priors, all 8,000 answers: accuracy **79.2%**, Brier **0.1220** against a baseline of **0.1647**, skill **26.0%**, expected calibration error **0.43 percentage points**.
- Calibration, held-out second half: Brier **0.0994** against baseline **0.1090**, skill **8.9%**, ECE **0.68 pp**.
- Fitting the prior and learn rate per learner on twenty answers: held-out Brier **0.1011**, skill **7.3%**, ECE **1.17 pp**. That is **worse**. Fitting doesn't help at this data volume.
- Routing policy simulation, **300** learners, **160**-item budget, seed 7, learners starting at **3.66** of 16 modules known:
  - Adaptive: **73.6** items, **14.97** of 16 modules truly known, **44%** of items spent on modules already known, **1.03** falsely called mastered.
  - Fixed syllabus: **160** items, **14.77** modules, **76%** waste, **0.05** falsely mastered but **0.77** under-called.
  - Random unlocked: **160** items, **8.50** modules, **89%** waste.
  - The headline: same true knowledge as a syllabus for **46%** of the items, and the cost is stated rather than hidden.

## The build

- **41** commits, six phase tags from `v0.1-phase1` to `v1.0-phase6`.
- **25,675** lines of TypeScript and TSX across **166** files in app, components, lib, scripts and tests.
- **19** routes.
- **85** entries in the decision log, each with its reasoning.
- Suite totals on the current commit: **unit 138 · database rules 16 · end-to-end 32** (16 journeys across 2 device profiles). Lint and typecheck clean.
- Unit coverage on the modules the claims rest on: `lib/bkt` **100%**, `lib/assessment` **100%**, `lib/quiz/grade` **100%**, `lib/routing` **94%**, `lib/logging/logger` **90%**. All of `lib` is **46%**, because the Firebase adapters, stores and hooks are covered by the browser journeys rather than unit tests.
- Four verification layers: unit, database rules, end to end, and audits.

# 3. How the project was built

- Six sequential phases, each ending in a demonstrated done-criterion and a git tag. Not a sprint cadence, because a solo project has nobody to hold a sprint review with, but it does need a hard stop where work is checked before more is built on top.
- The riskiest component, the student model, was built fourth rather than first. That was deliberate: it landed into an application that already had working authentication, content and assessment, so any misbehaviour could only be the engine.
- Every significant decision was written into `docs/DECISIONS.md` at the moment it was taken, with the reason. That log contains the reversals as well as the decisions that stuck, which is the point of it.
- After the six phases, the project carried on: the curriculum was rebuilt twice, the walkthroughs were added, the calibration work was done, and it was deployed.
- The code comments were rewritten across the whole codebase in first person, in my own voice, because the marker reads this code and the commentary should read like me explaining my decisions.

# 4. Architecture

- Six components around one loop: content, assessment, student model, routing, progress interface, and the auth and data layer.
- The loop: read the lesson, answer an item, update that topic's mastery, route on the new estimate, refresh the display. Everything else is scaffolding around that cycle.
- **The architectural decision that matters most:** the student model and the routing engine are pure TypeScript modules with zero dependencies and no Firebase imports at all.
  - They're trivially unit-testable, because there's nothing to mock.
  - The model is portable if the platform changes.
  - The "why this question" panel renders the engine's actual decision object rather than a reconstruction of it, so the explanation cannot drift out of sync with the behaviour.
- Stack: Next.js 14 App Router, TypeScript in strict mode, Tailwind with custom design tokens, Framer Motion, three.js via react-three-fiber, Firebase for auth and Firestore, React Query for server state, Zustand for session state, Vitest and Playwright for tests.
- Nothing in the stack is load-bearing for the research, and that's on purpose. The claim is about the model, not about the framework.

# 5. The BKT engine

- File: `lib/bkt/index.ts`. Around a hundred lines including comments.
- Two-state hidden Markov model. The learner either knows a knowledge component or doesn't, and that hidden state is inferred from observed right and wrong answers.
- Each response does two things in order: condition on the evidence with Bayes' rule, then apply the learning step.
- The evidence update on a correct answer is the prior times one-minus-slip, over that plus one-minus-prior times guess. On a wrong answer it's the prior times slip, over that plus one-minus-prior times one-minus-guess.
- The learning step is the posterior plus one-minus-posterior times the learn rate.
- It also computes P(correct) from the prior estimate before the update, and that prediction is logged with every response. That single field is what makes the calibration report possible.
- **Why these parameters:** they're standard values from the BKT literature and they were committed to in the progress report. All four sit well inside the degeneracy bounds that Baker, Corbett and Aleven warn about, where a guess or slip above 0.5 inverts the model's meaning.
- **Why they're constants in one file:** they're the same values the report cites. Scattering them through the codebase would let the two drift apart, and that would be a defect rather than an inconsistency.
- **Cold start** is handled by the placement test: one item per module. Placement answers run the evidence update but are logged with the before and after estimates equal, so no learning is credited during measurement and placement evidence stays separately analysable in the data.

# 6. The routing engine

- File: `lib/routing/index.ts`. Pure functions over a mastery map and a prerequisite graph.
- Four rules do all the work:
  - A module unlocks when every prerequisite has reached 0.8.
  - The module to work on is the lowest-mastery unlocked module that isn't yet mastered.
  - The action is teach if never attempted, remediate below 0.4, practise between 0.4 and 0.8, advance at 0.8 and above.
  - Difficulty follows the ladder, falling back to the nearest available rung when the preferred one is exhausted, and no item repeats inside a session.
- One behavioural rule sits across those: two consecutive wrong answers force an easy item regardless of the ladder, and the lesson is re-served. Grinding a struggling learner against harder questions produces attrition, not learning.
- **Why rules rather than a learned policy:** Baker's argument that the tutoring systems succeeding at scale earn their value from solid student modelling plus transparent pedagogy, not from elaborate machine learning. The payoff is that you can show a learner why a question was chosen.
- Every selection returns a reason object: the module, the current estimate, the band, the chosen difficulty, the predicted probability of a correct answer, and whether remediation is active. That object **is** the decision, not a summary of it.

# 7. The visible mind

- The design position: if a system is going to model you, you should be able to inspect the model. Bull and Kay on open learner models is the reference.
- **The "Why this question?" panel** opens the routing engine's decision object verbatim. Same data, no translation layer.
- **The dashboard routes rather than lists.** It opens on the module the model chose and the action it chose, so the learner sees a decision, not a menu.
- **The knowledge brain** (`components/three/mind-orb.tsx`) is the learner model as a 3D object: a point cloud in the shape of a brain, with the sixteen modules as neurons inside it, the curriculum chain as an axon running through them, and the covered stretch lit to actual mean mastery. Hovering gives the real estimate; clicking goes to the lesson.
  - It's built by walking a regular lattice through the shape's bounding box and keeping the points that land in a thin shell around the surface, which is what makes it read as a rendered object rather than dust.
  - The accessible version is the list of sixteen estimates beside it. The canvas is `aria-hidden`, only mounts on desktop after idle, and never under reduced motion or calm mode.
- **The honesty detail worth mentioning unprompted:** where a module is still at the 0.25 prior, the interface greys it and says so. "I don't know yet" and "I estimate 25%" are different claims and the display shouldn't blur them.
- The gamified surface, streaks and badges and ceremonies, decorates progression. Nothing unlocks except through mastery.

# 8. The content pipeline

- Lesson prose lives in markdown files. That is the single source of truth.
- `scripts/generate-content.ts` parses the markdown into `content/level1.json`, which is what the application and the seed script consume. No lesson copy lives in TypeScript.
- That decision looked minor and turned out to matter enormously: the curriculum was replaced wholesale twice, and each time it was a regeneration rather than a rewrite.
- Lessons are keyed by filename prefix rather than a parsed integer, so a lesson can be inserted mid-module without renumbering the whole corpus.
- **Where the content came from, and keep these separate when asked:**
  - The original nine-module chain came from a practitioner video curriculum of about three and a half hours, thirty-six recordings, transcribed, scene-extracted and rewritten as structured lessons.
  - The September extension added **33** lessons across **8** modules, written from cited public ICT and TTrades teaching, with **117** sources listed lesson by lesson in `docs/LESSON_SOURCES.md`, found by search. None invented.
  - If you're asked whether it's a clean split: it isn't. The extension reached back into modules 6, 7 and 9 as well as adding 10, 11, 13, 15 and 16. Say that rather than rounding it off.
- **Sequencing** came out of a dependency analysis, not the recording order. Several videos used terms that hadn't been defined yet. Risk and position sizing sits third because every module from five onward quotes risk multiples that are meaningless before sizing is taught.
- Lesson layout is visuals first: recording, walkthrough, real chart, diagram, then prose. That was a fix, not a plan. The charts were below the text and I couldn't find them myself.

# 9. Walkthroughs

- 48 stepped, annotated charts across `lib/walkthroughs/`, rendered by `components/learn/walkthrough.tsx`.
- **The price series is constructed, not recorded and not random.** `lib/walkthroughs/synth.ts` is a seeded generator that takes control points and forces specific candles, so the sweep, the break and the gap are exactly where the caption says they are.
- Each walkthrough is a sequence of steps that lay levels, zones, session windows, markers, arrows and notes on top one at a time. Earlier layers dim, the current one is bright.
- Arrow keys step it. The caption is an ARIA live region so a screen reader announces each step. A **Describe** button lays the entire sequence out as text.
- **Why these instead of recording 33 more videos:** partly time, and say so. But on the merits, a stepped chart is more precise than a screen recording for a structure concept, and it is accessible in a way a video never was.
- The chart drawing is a pure component, so `scripts/render-walkthroughs.tsx` can render every step to PNG and build a contact sheet. That's how the label collisions were found. Chart labels became pills with a dark backing, which removed most collisions at source.
- A unit test checks that every step's bars and prices sit inside its own chart and that markers sit on the candle they name.

# 10. Real-chart case studies

- 16 lessons carry a historical case study after the walkthrough.
- Source: ES and NASDAQ futures bars from Yahoo Finance's public endpoint, pulled by `scripts/fetch-bars.ts`, with the retrieval date recorded in each file.
- **They were found by code, not by eye.** `scripts/find-case-studies.ts` runs one detector per concept that encodes the lesson's own rule, scores every instance in the data, and keeps the cleanest.
  - Windows must be contiguous, so no weekend inside except for the New Week Opening Gap, and free of freak bars.
  - Intraday examples prefer the New York cash session.
- Captions quote real dates and prices that are visibly on the chart. The pill, the frame line and the description all say historical, attributed, not live, not a signal.
- **The ethics sequence matters and you should volunteer it.** When this was first proposed I declined it, because the consent screen, the legal page and the report all said every chart was simulated. The case studies only went in after that wording was changed to "simulated or clearly labelled historical" across the consent screen, the legal page, the footer, the FAQ, the lesson banner and the report's ethics section.
- Only the sixteen small slices are committed. The raw pulls are gitignored.

# 11. Assessment

- Six question types, and each one establishes something different:
  - **Multiple choice** (55 items): recognition and discrimination between close alternatives.
  - **Multiple select** (16): whether a set is complete, not just recognisable.
  - **Numeric** (14): procedural computation, mainly position sizing.
  - **Ordering** (15): whether a procedure is known as a sequence rather than a list.
  - **True or false with confidence** (15): separates confident error from uncertainty, which routes differently.
  - **Chart annotation** (1): visual identification against a rubric.
- Every item is tagged to exactly one knowledge component. That is a hard requirement of the model, not a convention: BKT traces one skill at a time.
- Grading lives in `lib/quiz/grade.ts`, separately unit-tested per type.
- **The end-of-lesson check** runs three questions from that module's bank, spread across item types, excluding the inline check's item. A miss shows the answer, explains the idea, and offers a similar question at the same difficulty and type. A second miss shows the answer and moves on.
  - Every answer, retries included, goes to the append-only log with the before and after estimates.
  - It only starts on a button press, so reading isn't interrupted.
- The assessment surface runs a calmer variant of the ambient background than the rest of the app. Anything drifting beside a question is a confound in the response latency being recorded as research data.

# 12. Data layer and security rules

- Firestore, with the rules file as the enforcement point rather than the interface.
- Four properties are enforced in `firestore.rules` and tested by a suite that never touches the interface:
  - **Owner-only subtree.** A user can read and write their own documents and nobody else's.
  - **Eighteen plus at create.** A profile cannot be created without `isAdult == true`. The same gate applies whether the learner arrives through the email form or through Google.
  - **Responses are create-only.** No update, no delete, not even by the account that wrote them.
  - **Content is authenticated-read, admin-write.** Learners can't edit the curriculum.
- **Why in the rules rather than the interface:** both could have been interface checks and both would then have been bypassable by anyone willing to open a console. In the rules they're properties of the system, and they can be tested automatically.
- One deliberate asymmetry, and you should state it before it's asked: deleting an account removes the auth user and the profile immediately, but purging the response log needs admin tooling. That's a direct consequence of the create-only rule. Client code that could destroy research records could also destroy them by accident.

# 13. The response logger

- File: `lib/logging/logger.ts`. Treated like a payments system, deliberately.
- Every answer writes one record: the item, the module, the question type, what was selected, whether it was correct, the response latency in milliseconds, the mastery estimate before and after, and a timestamp.
- The before-and-after pair is what makes the log a research dataset rather than an app log. With the prior and the posterior on every row you can reconstruct a learning trajectory and test the model's calibration.
- Flow: enqueue, persist to browser storage, return optimistically, flush in the background with exponential backoff. A failed write is re-queued, never dropped. Unflushed events survive a refresh.
- The transport is injected, so unit tests drive the queue with a fake sender and the app injects the Firestore one.
- **The bug worth telling:** the obvious implementation writes and hopes. But the Firebase SDK keeps its own retry queue, so with a custom queue in front of it both hold the same write when the connection drops and both deliver on reconnect. That's duplicate rows in the research data, silently, months later. The fix is to fail fast when the browser reports itself offline so my queue is the single retry authority. This is the class of bug that never appears in a demo.
- `scripts/export.ts` flattens the log to a tidy CSV. The estimate chains in the export reproduce the hand-computed unit-test fixtures exactly.

# 14. Authentication

- Email and password, plus Google, on both sign-in and sign-up.
- Google sign-in is extracted into `lib/firebase/google.ts` with the SDK error codes mapped to plain reasons: cancelled, popup blocked, provider not enabled, domain not authorised.
  - The old catch-all reported a disabled provider as "cancelled", which hid the real cause for a day. Both auth pages share the module now so the messages can't drift.
- Google sign-up sits behind the same eighteen plus checkbox as the email form, because the database rule refuses a profile without it either way.
- "Keep me signed in" is ticked by default, since Firebase persists locally by default. Unticking switches to session persistence before the sign-in call, and the choice is remembered per device.
- `lib/firebase/errors.ts` wraps the three profile calls in a retry and surfaces the real error code in the toast.
- A signed-in Google user is never stranded on the sign-up page. If the profile write fails they go to consent, which can create the profile itself.

# 15. Accessibility

- The position: an educational tool that excludes people isn't much of an educational tool. The target is WCAG 2.1 AA and it's audited rather than claimed.
- What's actually there:
  - **High contrast** mode: a pushed-apart palette on true black, solid panels, underlined prose links.
  - **Readable typeface**: Atkinson Hyperlegible, loaded through `next/font` behind the font variable so Tailwind follows it.
  - **Comfortable reading**: looser leading and a 62-character measure on lesson prose.
  - **Calm mode**: the ambient field, the particles and every three.js scene come down.
  - **Colour-blind candles**: flips the bull and bear tokens live.
  - **Font scale**: 100, 115 and 130 per cent on the root.
  - **Reduced motion** as an in-app setting as well as honouring the system preference.
  - **Skip to content** link and a **keyboard shortcuts sheet** on `?`.
  - Every chart carries a text alternative, and every walkthrough has a full text description.
- Preferences live on the profile but are mirrored to local storage and stamped onto the root element by an inline script before first paint. That's what stops the flash of the default look and keeps the choices working on signed-out pages.
- The assessment loop is fully keyboard operable, with mastery changes announced to assistive technology through a live region.
- Lighthouse accessibility is 100 on every public page, on both the mobile and the desktop preset.
- **It's automated now, and that's the part to lead with.** `tests/e2e/axe.spec.ts` runs axe-core against the public pages (`/`, `/sign-in`, `/sign-up`, `/legal`) and the signed-in ones (dashboard, skill tree, a lesson, profile, settings, survey, post-test, a live quiz question), on desktop and Pixel 7 profiles, tagged wcag2a, wcag2aa, wcag21a and wcag21aa. Canvases are excluded. Serious and critical violations fail the build.
- It found **three real defects** a manual Lighthouse pass had missed:
  - `--fg-muted` at `#5b5b6b`, a contrast ratio of **3.0 to 1**, on every small label, the footer and the quiz meta. The token was raised to `#82829a`, which is 4.6 to 1 on all three elevations.
  - Unearned badges rendered at 40 per cent tile opacity, putting their text at **1.9 to 1** on the profile. Fixed by dimming the icon and swapping the text tones while the tile stays at full opacity.
  - A sideways-scrolling lesson table that wasn't keyboard reachable. Its wrapper is now a focusable `role="region"` with an accessible name.
- The line to use: the difference between a claim and a result is whether a machine checks it on every run.

# 16. Performance

- Every performance figure in this project was measured rather than estimated, and that habit caught two things I'd have got wrong.
- **The effect I deleted:** a rotating blurred aurora layer looked good and dropped the dashboard from 120 frames per second to 19. Pure GPU cost, zero long tasks. Removed and replaced with static gradient layers.
- **The systematic finding:** each animated full-screen ambient layer costs about 18 frames of compositor budget. Eight animated layers took the dashboard from 120 to 48. The identical layers held static cost nothing at all.
- The final design keeps every visual layer and animates exactly one. Motion goes where it's perceptible, into entrance choreography and hover states, not into a forty-second drift nobody can see.
- Candle layers are emitted as SVG data-URI background images rather than live SVG, because a hundred vector nodes re-rasterise per frame when animated.
- Heavy canvases are wrapped so they only mount when the slot is on screen, the browser is idle, the viewport is desktop-sized and motion isn't reduced.
- The dashboard scored 68 on performance at first audit and reached 86 through four changes: unchaining the layout guard so the profile check and the page data fetch run in parallel, lazy-loading the charting library, server-rendering the page heading as the early largest contentful paint element, and rebuilding the loading skeletons to mirror the final layout, which took cumulative layout shift from 0.215 to about zero.
- **Production Lighthouse, three runs per page per preset, medians reported.** Accessibility, best practices and SEO are **100** on the landing, sign-in and legal pages on both mobile and desktop. Performance is **100** on all three on desktop, and **89 / 91 / 93** on simulated slow 4G with a 4x CPU slowdown.
- **The finding that matters most, and the one to tell if performance comes up:** Framer Motion was server-rendering every entrance block with inline `opacity:0`, so the pages painted nothing until **940 KB** of JavaScript had hydrated. On a throttled phone the sign-in form took **6.6 seconds** to appear. Rebuilding `Stagger`, `StaggerItem` and `Reveal` as CSS animations, so the server HTML paints immediately, took sign-in from **77 to 91** and its largest contentful paint from 6.6 s to 3.5 s.
  - The lesson worth stating: an entrance animation that hides server-rendered content behind JavaScript is a performance and an accessibility defect, not a polish choice, and it is completely invisible on a fast laptop.
  - The follow-on: the scroll-driven reveal that replaced it faded blocks in, which left a paragraph straddling the viewport edge sitting at partial opacity, text at 3.3 to 1. The reveal now moves but never fades. Legal went back to 100 on accessibility.
- The three.js hero was the other one: it mounted on hydration, so the headline queued behind the WebGL chunk and the landing page's largest contentful paint was **7.8 s** on mobile. Particles now mount on `requestIdleCallback` after first paint and fade in with CSS.
- The remaining 3 to 4 second mobile largest contentful paint is the simulated slow-4G download of JavaScript the pages genuinely use, Firebase Auth, Framer Motion and GSAP. The desktop scores show there is nothing left on the render path itself. Say that rather than apologising for the mobile number.

# 17. Testing and verification

- Four layers, chosen so each catches a class of defect the others structurally cannot.
- **Unit tests** over the pure modules: the BKT engine, the routing rules, grading, the logger and the walkthrough geometry.
  - The BKT tests assert against arithmetic worked out by hand, so if the implementation drifts the test fails against maths rather than against the code's own opinion of itself. Say this one out loud if testing comes up.
  - The routing tests include a decision table, the unlock boundary at exactly 0.8, the difficulty ladder, non-repetition inside a session and the remediation trigger.
- **Security-rules tests** run against the Firebase emulator. Sixteen of them. They're the only way to prove the append-only and eighteen-plus guarantees hold against a caller who never touches the interface.
- **End-to-end tests** drive real browsers, desktop and mobile projects, through the real journeys.
  - The one that earns its keep completes a full session with the network killed halfway through, then verifies every response arrived with its model state intact.
  - Test answering is content-independent: the quiz exposes item ids and the helper fetches the answer key from the emulator, so the tests survive curriculum edits instead of hardcoding "option B".
- **Audits**: Lighthouse on every page including the authenticated ones, a keyboard and reduced-motion specification, and a manual guardrail sweep at each gate confirming no live data, broker links, signals or profitability claims have crept into the copy.
- Static checks: TypeScript strict and ESLint, enforced pre-commit and in CI.
- The commands, in case you're asked to prove any of it:
  - `npm run test` unit
  - `npm run test:rules` database rules in the emulator
  - `npm run test:e2e` end to end
  - `npm run lint` and `npm run typecheck`
  - `npm run test:coverage` unit coverage, v8
  - `npx tsx scripts/simulate.ts` the simulated-learner harness
  - `npx tsx scripts/calibration.ts` the calibration report
  - `npm run simulate:routing` the routing policy comparison
  - `npm run analyse` / `npm run analyse:live` the pilot analysis, writing `docs/report/PILOT_RESULTS.md`
  - `npx tsx scripts/export.ts` response log to CSV

# 18. Calibration and the simulated harness

- **The distinction to lead with:** testing that the code is correct is a different question from testing that the model behaves sensibly. The unit tests do the first. The harness and the calibration report do the second.
- **The harness** generates 200 synthetic learners with known parameters, has them answer through the true generative model, then runs the real engine over those responses and checks whether it recovers sensible behaviour from data it was never told the truth about.
  - The three sanity behaviours all pass, and they matter because the routing rules depend on them. If a correct streak didn't cross the threshold, mastery gating would never release anyone. If a wrong streak drifted above the remediation line, struggling learners would be pushed on rather than supported.
  - Parameter recovery is honest rather than flattering. The learn rate recovers decently. The prior recovers poorly, with a negative bias meaning the engine underestimates how much learners already knew. That's expected: at forty binary observations the prior is only weakly identified once the learn rate has lifted the estimate. It's the identifiability problem Beck and Chang described, arriving exactly where the literature says it should.
  - **A harness that produced clean recovery on forty observations would be evidence the harness was wrong, not that the model was right.** Have that line ready.
- **The calibration report** is the newer and stronger evidence. Every logged answer carries the estimate from before the answer; pushed through the emission model that becomes a forecast. A calibrated model's forecasts come true at the rate they claim.
  - Reliability bins the forecasts into deciles and compares mean forecast with observed accuracy. The Brier score is the mean squared error of the forecasts; the baseline always forecasts the overall accuracy, and the skill score is the fraction of the baseline's error the model removes. ECE is the count-weighted mean gap across bins.
  - Result: 0.43 percentage points of calibration error across 8,000 answers, 26% Brier skill. In the bin where the model predicts about 30%, observed accuracy is 29.8%.
  - **And the result I didn't expect, which is the best thing in the pack:** fitting the prior and learn rate per learner on twenty answers makes the held-out forecasts slightly worse than the fixed literature defaults. So the defaults stay, and that's now an evidence-based decision rather than a convenience.
  - **State the limit before it's asked:** the simulation shares the engine's own guess and slip values, so this tests wrong priors, not the emission model. Real learner data settles that, and the script has a CSV path ready to score the real log when there is one.

# 19. The routing policy simulation

- **The question it answers.** Calibration tells you the estimates are honest. It doesn't tell you the adaptation is worth anything. `scripts/simulate-routing.ts` asks exactly that, and `npm run simulate:routing` writes the table into `docs/EVALUATION.md` between markers, so the document can't drift from the run.
- **The design**, and this is the part to defend:
  - 300 synthetic learners, each with a hidden true state per module, drawn so they start knowing 3.66 of 16 on average. Seed 7.
  - Three policies on the same item budget of 160: the adaptive engine, a fixed syllabus that teaches every module in order, and a random pick from the unlocked set.
  - **Answers come from the learner's true state and the item's difficulty, never from the engine's estimate.** That's the whole design. The engine is allowed to be wrong about the learner and the simulation will punish it for that.
- **The result.** Adaptive: 73.6 items for 14.97 modules truly known. Syllabus: 160 items for 14.77. Random: 160 items for 8.50. Same knowledge, 46 per cent of the items.
- **Where the saving comes from.** Items spent on modules the learner already knew: 44 per cent for the adaptive policy, 76 per cent for the syllabus, 89 per cent for random. It isn't teaching faster, it's not re-teaching.
- **The cost, and volunteer it.** The adaptive policy declares 1.03 modules mastered that the learner doesn't actually know. The syllabus declares 0.05, and under-calls 0.77 instead, which it pays for with double the items. The engine stops asking once an estimate crosses 0.8, and a guess or two on easy items can put it there.
- **The knob** is the mastery threshold and the guess parameter. The post-test is a held-out measurement of exactly this error, which is why the two pieces of work belong together.
- **What it does not prove**: anything about humans. It is a policy comparison under a stated generative model. Say that before anyone says it to you.

# 20. The study instruments, built and tested

- The human study is built rather than planned, and that changes the shape of the project's main limitation.
- **Post-test** at `/post-test`. It is placement's twin: one question per module, sixteen questions, but drawn as **form B**, so fifteen of the sixteen items differ from the placement form.
  - `pickAssessment(kcs, eligible, "A" | "B")` is the shared selector, so the two forms are constructed by the same code.
  - `isAssessment()` in the session store means **the post-test never updates the learner model**. It reads it and logs it.
  - Every answer is logged with `pLBefore`, the model's current estimate. That makes it a **held-out check** that practice answers structurally cannot give you, because practice moves the estimate it would be measured against.
- **Usability survey** at `/survey`: the ten-item System Usability Scale plus three open questions, written to `users/{uid}/surveys/sus`. Owner-only in the rules, and there's a rules test proving a stranger is denied.
- **Analysis** via `npm run analyse` (emulator) or `npm run analyse:live`, writing `docs/report/PILOT_RESULTS.md`: per-learner placement score, post-test score, **Hake's normalised gain**, time on task, modules mastered, SUS score, all pseudonymised, with test accounts dropped.
  - It runs clean on the empty live database, reports n = 0 and says so, which is how you know it will run on real data rather than hoping.
  - Normalised gain and the SUS arithmetic have unit tests against worked examples in `tests/unit/assessment.test.ts`.
- **The sentence to use:** the limitation isn't that I couldn't build the study, it's that I haven't recruited anyone yet. Those are different sentences and the second one is the honest one.

# 21. Environments and deployment

- Two Firebase projects, and the split is enforced by configuration rather than by discipline.
  - `demo-trademind` is the local emulator suite. Every automated path is pinned to it.
  - `trademind-academy` is the live project with real users.
- Ports: the app on 3000, the emulator app on 3100 with its own build folder, Firestore on 8080, Auth on 9099, the emulator UI on 4000.
- **The reversal you should be ready to explain.** Originally `npm run dev` started the emulator and the real app lived on a second port. I landed on the emulator's fake Google sign-in page three times in one day and read it as a bug every time, and two servers sharing a build folder corrupted it three times. Now `npm run dev` **is** the app, live project, real Google, port 3000, and it refuses to start if the port is busy. The emulator moved to `npm run dev:emulator` on 3100. The dataset-protection rule still holds, because every automated path is pinned to 3100.
- **The incident you should volunteer rather than be caught on.** Early in the project the Playwright configuration auto-started a production-configured server and created seven test accounts in the live research database. They were deleted and the deletion verified. The fix was structural: local end-to-end runs are emulator-only by construction now. A later screenshot run created seven more `@example.com` accounts, none with sessions; those were deleted too, and two real users remain. The honest reading is that the original separation was a convention and I had designed it that way.
- **Deployment**, at `https://tmacademyuk.vercel.app`, with `trademind-academy.vercel.app` still attached so older links work. Three things bit on the way:
  - The CLI uploaded 485 MB of local build caches before failing on a 100 MB file limit, so `.vercelignore` now excludes build folders, docs, tests and content. The content entry needed a leading slash, because a bare `content` also matched `lib/content` and broke the build.
  - The lesson videos are a 1.1 GB symlink and stay out of the deployment. That's why the live site opens recorded lessons on their walkthrough. Hosting them needs a Storage bucket, which needs billing enabled.
  - A Hobby account blocks any deployment whose commit author email isn't the login email, which mine isn't, so `npm run deploy` pushes a git-less snapshot through `scripts/deploy.mjs`.
- The `.vercel.app` domain was added to Firebase Auth's authorised list, and a headless check confirmed the deployed sign-in talks to live Auth: a wrong password produces the real error, protected routes bounce to sign-in, and there's no emulator reference in the bundle.

# 22. Ethics and guardrails

- Teaching trading carries a responsibility that a tutoring system in algebra doesn't, and this shaped the design more than any other single factor.
- The guardrails are build constraints, not disclaimers:
  - Simulated or clearly labelled historical data only.
  - No live market feed, no broker connectivity, no affiliate relationship.
  - No trade signals.
  - No payment code of any kind anywhere in the repository.
  - No claim about returns or profitability in any copy.
  - Eighteen plus, enforced in the sign-up form **and** the database rules.
  - A data-source pill on every chart surface.
- Each phase gate included a sweep against that list.
- Data protection: only what the model and the evaluation need is collected. Consent is versioned, requested before any learning data is written, and the decline path genuinely signs the user out. Learners can export their data as CSV and delete their account from settings.
- Professional standards: the BCS Code of Conduct, particularly the public-interest duty, is what turns those guardrails from a preference into an obligation given the subject matter and the beginner audience.
- **Two requests I turned down, and both are in the decision log.** Volunteer these if you're asked how you handled ethics, because they're stronger than any policy statement.
  - Copy about producing profitable traders. The FCA's financial-promotions rules bite on exactly that language and no course can honestly promise it. The path is framed as competence instead, and the prop-firm lesson ends by saying that no course, firm or method can promise profitability.
  - Replacing the simulated charts with real data, at the time it was first asked. The consent screen, the ethics application and the report all said everything was simulated. The real case studies only went in later, after that wording was changed everywhere.
- The prop-firm lesson is a framework with dated facts rather than a ranking, and says so. Naming a best firm would be a recommendation the artefact's ethics position doesn't allow.

# 23. Evidence of process

- 39 commits with six phase tags.
- Over 70 decision-log entries with reasoning attached, written at the moment each decision was taken.
- The log contains reversals as well as decisions that stuck. That's the evidence of judgement rather than output, and it's what to point at if asked how the project was managed.
- Three reversals worth being able to name:
  - The blurred aurora effect, built, measured at 19 frames per second, deleted.
  - The dev-server arrangement, reversed after it caused the same confusion three times in one day.
  - The skill-map ordering, which sorted by prerequisite count and produced an arbitrary route because every module after the first has exactly one prerequisite. Replaced with a walk of the chain.
- `docs/EVALUATION.md` holds the per-phase verification record. `docs/PARKED.md` records what was designed and deliberately not built.

# 24. Limitations, stated before they're asked

- **No human learners yet, and the shape of that has changed.** The instruments are built and tested end to end: a post-test, a usability survey and an analysis script that produces the results document. What's missing is recruitment, not engineering. Everything demonstrated is still about correctness, behaviour and calibration rather than about whether anyone learns. Say it before the panel does, and say it in the new form: I haven't recruited anyone, not I couldn't build the study.
- **Parameters are defaults, not fitted.** The calibration work says that's currently the better choice, but it's a finding about this data volume, not a principle.
- **The model assumes no forgetting.** Plainly false for human learners, and the most obvious extension. The review queue currently identifies fading topics by time since last seen, which is a heuristic standing in for a model term.
- **The mastery threshold is a defensible choice, not a derived one.** Pelánek is right that a single probability can't carry both the system's uncertainty and the learner's degree of knowledge.
- **The curriculum content is practitioner material with no peer-reviewed validation.** The project treats its pedagogical delivery as the research object and makes no claim about profitability. That separation is what keeps the whole thing assessable as computing research.
- **The calibration evidence is simulated.** It shares the engine's emission parameters, so it tests the priors rather than the emission model.
- **The routing evidence is a policy comparison, not a learning outcome.** The simulation shows the adaptive policy reaches the same true knowledge for 46 per cent of the items under a stated generative model. It says nothing about humans, and the over-calling it predicts, about one module in sixteen, is exactly what the post-test is built to measure.

# 25. The questions most likely to come, with answers

- **"Why BKT and not a neural model?"** Interpretability and data volume. Deep knowledge tracing usually wins on raw predictive accuracy but needs far more interaction data than a single project can gather, and it can't tell a learner why. A four-parameter model I can display in a panel was the right trade, and the calibration report shows it's well calibrated at this scale.
- **"Shouldn't you fit the parameters?"** I tested it. Fitting the prior and learn rate per learner on twenty answers makes held-out forecasts slightly worse than the fixed defaults. So eventually yes, but not at this data volume, and I have the number rather than an opinion.
- **"How do you know any of this works?"** Be precise about what "works" means. The code is verified at four levels, with the engine modules at full line coverage. The model is calibrated to within half a percentage point on simulated data. The adaptation is measurably more efficient than a fixed syllabus under a stated generative model, with its cost stated. Whether it teaches anyone is an open question that needs participants, and the instruments to answer it exist.
- **"How much of this did you write?"** All the design decisions and the architecture. AI assistance during implementation, declared in the report. The evidence of my own reasoning is the decision log, including the reversals.
- **"Isn't the chart data fake?"** Constructed, and labelled as constructed on every one. That's the point: a random chart wouldn't reliably contain the pattern being taught, and a real chart I'd hand-picked to show the pattern would be worse science. The sixteen real case studies are genuine historical bars, attributed and dated, found by detectors rather than by eye.
- **"Why is the accessibility work so extensive for a dissertation?"** Because the target is a real standard rather than a gesture, and because an educational tool that excludes people isn't much of an educational tool. It's also automated now, with axe running over every page including the signed-in ones on two device profiles, which is the difference between a claim and a result. It found three things a manual Lighthouse pass had missed.
- **"Does the adaptation actually buy anything?"** Against simulated learners, yes: the same true knowledge as a fixed syllabus for 46 per cent of the items, and most of the saving is items the syllabus spends on modules the learner already knew. The cost is that it declares about one module in sixteen mastered that the learner doesn't know, because it stops asking once the estimate crosses 0.8 and a lucky guess can put it there. That trade is the thing the pilot is set up to tune. It is a policy comparison, not a learning outcome, and I'd say so unprompted.
- **"What would you do differently?"** Schedule the participant study first and fit the build around it. The build absorbed the time and by the time the curriculum was finished the window had closed. And make the development and research environment separation structural from the first commit rather than after test accounts reached the live database.
- **"What's the single most original thing here?"** The open learner model rendering the routing engine's actual decision object rather than a summary of it. Most systems that explain themselves are explaining a reconstruction, which can drift. This one structurally can't, because there's only one object.
- **"Where does this go next?"** The participant study, then fitting the parameters on real responses, then a forgetting term. Deep knowledge tracing is the long-horizon option and the comparative evidence is clear that its advantage arrives with data volume, which is precisely what a system that has just started collecting responses doesn't have.

# 26. Things that are true but easy to get wrong under pressure

- It's **16** modules now, not 9. The report figures showing a nine-module climb are the earlier curriculum, and the skill map switches to a two-row switchback above nine modules.
- It's **66** lessons and **116** items, not 33 and 72.
- **33** of the 66 lessons have recordings, not all of them. They are hosted on Vercel Blob now (`tmacademy-lessons`, 36 files, 1.1 GB), so the deployed site plays them. The old line about them not playing live is out of date, don't say it.
- Placement is **16** questions, one per module, drawn from 36 pretest-eligible items.
- The live URL is **tmacademyuk.vercel.app**. The older `trademind-academy.vercel.app` still works but isn't the one to quote.
- `npm run dev` is the **real app** on port 3000. The emulator is `npm run dev:emulator` on 3100. This was the other way round until 11 September.
- The calibration numbers are from **simulated** answers, not real learners. Say "simulated" every time you say "calibrated".
- The parameter recovery result is a **limitation you're reporting**, not a success. Frame it that way or it sounds like you didn't notice.
- Responses are create-only, so **account deletion doesn't purge the log**. That's by design and you should say so before it's framed as a GDPR gap.
