# Evaluation Log

Verification evidence per phase. BKT simulated-learner results land here in
Phase 4; full audit pass in Phase 6.

## Phase 1 — Foundations (2026-07-15, tag `v0.1-phase1`)

All checks run locally against the production build (`next build` + `next start`).

| Check | Result |
| --- | --- |
| `npm run lint` (ESLint, next/core-web-vitals) | ✅ no warnings or errors |
| `npm run typecheck` (tsc --noEmit, strict) | ✅ clean |
| `npm run test` (Vitest) | ✅ 6/6 passed |
| `npm run test:e2e` (Playwright, desktop Chrome + iPhone 13) | ✅ 4/4 passed |
| Lighthouse accessibility — `/dev/kitchen-sink` | ✅ **100** (gate: ≥ 90) |
| Lighthouse accessibility — `/` | ✅ **100** |
| Production build | ✅ static, first-load JS 87–147 kB |

Accessibility fixes made during the audit (kept, not waived):

- Toast region: `aria-label` on a bare `div` is prohibited ARIA → added `role="region"`.
- Input hint text: `fg-muted` fails AA contrast on `bg-deep` → switched to `fg-secondary`; token policy recorded in DECISIONS.md.
- Home: added `<main>` landmark; removed a redundant `aria-label` on the logo link that mismatched its visible text.

Screenshots (also the report figures): `docs/screenshots/kitchen-sink-desktop.png`,
`kitchen-sink-mobile.png`, `home-desktop.png`.

Environment: Node 22.22, npm 10.9, Next 14.2.25, React 18.3, Tailwind 3.4,
Framer Motion 12, Playwright 1.x (Chromium + WebKit), Lighthouse 12 (latest via npx)
against headless Chrome 150.

## Phase 2 — Auth, data layer, content layer (2026-07-15, tag `v0.2-phase2`)

All checks run locally: dev server on :3000, Firebase Emulator Suite
(auth :9099, firestore :8080), curriculum seeded via `npm run seed`.

| Check | Result |
| --- | --- |
| `npm run lint` / `npm run typecheck` | ✅ clean |
| `npm run test` (Vitest unit) | ✅ 6/6 |
| `npm run test:rules` (rules-unit-testing in Firestore emulator) | ✅ **14/14** — owner-only subtree, 18+ create gate, create-only responses (no update/delete even by owner), authed-read/admin-write content |
| `npm run test:e2e` (kitchen sink + auth journey, desktop + mobile) | ✅ 8/8 |
| Done-criterion journey | ✅ sign up (18+ hard gate verified) → GDPR consent (Decline verified: signs out, learn area bounces to sign-in) → full seeded lesson (video placeholder, describe-this-chart toggle, inline check → ✓ chip) |
| Seed | ✅ 1 course, 8 KCs, 8 lessons, 64 items into the emulator |

Defects caught by the E2E journey during development (fixed, not waived):
stale React Query profile cache bounced freshly-consented users back to the
consent screen; the Decline flow raced the auth guard's sign-in redirect;
parallel test workers could mint colliding signup emails.

Screenshots: `docs/screenshots/sign-up.png`, `consent.png`, `lesson-top.png`,
`lesson-full.png`.

## Phase 3 — Assessment engine + question bank (2026-07-15, tag `v0.3-phase3`)

| Check | Result |
| --- | --- |
| `npm run lint` / `npm run typecheck` | ✅ clean |
| `npm run test` (Vitest unit) | ✅ **27/27** — BKT hand-computed fixtures + threshold crossings (11), grading per type (6), logger queue/retry/persistence/backoff (4), utils (6) |
| Rules tests (against live emulator) | ✅ 14/14 |
| `npm run test:e2e` | ✅ **12/12** (kitchen sink, auth journey, quiz — desktop + mobile) |
| Done-criterion | ✅ Playwright completes a full **10-question mixed-type session** (all six renderers exercised), with the network killed mid-session: events queue in localStorage, the queue drains on reconnect, and **all 10 responses verifiably land in the emulator's Firestore, each carrying `pLBefore`/`pLAfter`/`latencyMs`** |
| Refresh resume | ✅ mid-session reload resumes at the same question (Zustand persist) |

Engineering notes for the report:
- The Firestore transport fails fast when `navigator.onLine` is false so the
  custom queue is the *single* retry authority — otherwise the SDK's internal
  write queue would double-deliver on reconnect and contaminate the research
  log with duplicates.
- BKT runs live in the session store from Phase 3 so every logged response
  carries true model state; routing/dashboard wiring remains Phase 4 scope.
- WebKit (Safari) long-polling to the Firestore emulator proved flaky
  ("access control checks"); the mobile E2E project now uses Chromium-based
  Pixel 7 emulation (see DECISIONS.md).

Screenshots: `docs/screenshots/quiz-question.png`, `quiz-feedback.png`.

## Phase 6 — Landing, polish, audits (2026-07-15, tag `v1.0-phase6`)

Final audit pass against the production build (`next start`), authenticated
pages audited via a signed-in Chrome profile (`scripts/audit.ts`).

### Lighthouse

| Page | Accessibility (gate ≥ 95) | Performance |
| --- | --- | --- |
| Landing | **96** | **88** |
| Sign-in | **96** | — |
| Legal | **95** | — |
| Dashboard (authed) | **96** | **86** (gate ≥ 85 ✅) |
| Skill tree (authed) | **100** | — |
| Settings (authed) | **100** | — |
| Kitchen sink | **100** | — |

Dashboard performance was 68 at first audit; fixed by (1) un-chaining the
learn-layout guard so the profile check and page data fetch in parallel,
(2) lazy-loading lightweight-charts (389 → 333 kB first-load), (3) a
server-rendered `h1` header as the early LCP element, (4) skeletons that
mirror final layout exactly (CLS 0.215 → ~0). LCP 5.9s → within gate.

### Keyboard & reduced motion (Playwright, `tests/e2e/a11y.spec.ts`)

- Quiz fully keyboard-operable: number keys select, Enter submits/continues,
  `aria-checked` asserted, mastery changes announced via `aria-live`.
- Skill-tree nodes focusable; Enter opens the detail panel.
- `prefers-reduced-motion: reduce`: landing + dashboard render fully; focus
  ring lands visibly on the primary CTA.

### Final state

- **Unit 54/54 · E2E 24/24 · rules 14/14 · lint/typecheck clean.**
- New in Phase 6: landing (r3f particle hero — 2.5k/800 particles, static
  frame under reduced motion; GSAP-core split headline; pinned visible-mind
  bento; FAQ; full risk-disclaimer footer), legal/privacy page, candle-glyph
  404, offline banner.
- Guardrail sweep: no live data, no broker links, no signals, no
  profitability claims anywhere in copy; simulated-data pills on every chart
  surface; response log create-only end to end.

Screenshots: `docs/screenshots/landing.png`, `404.png`.

## Phase 5 — Learner-support features (2026-07-15, tag `v0.5-phase5`)

| Check | Result |
| --- | --- |
| `npm run lint` / `npm run typecheck` / build | ✅ clean (16 routes) |
| `npm run test` | ✅ 54/54 |
| `npm run test:e2e` | ✅ **18/18** (adds learner-support spec) |
| Answer review | ✅ per-item verdicts, learner answer vs key, explanations; annotation charts re-render with the learner's marker + correct zone overlay |
| Settings | ✅ colour-blind candles flip `--bull/--bear` live (asserted via `data-candles`), font scale 100/115/130% on the root, in-app reduced motion, **Download-my-data** produces a CSV (download event asserted), **Delete account** gated by typing DELETE with a working 5-second Undo |
| Mistake bank | ✅ missed items grouped by KC with re-drill (fixed `review`-type session) |
| Review queue | ✅ amber "fading skills" card stack (3+ days unseen, unmastered), swipe-to-defer fly-off; empty state verified |
| Profile | ✅ stats + six computed badges + sign out |
| `scripts/export.ts` | ✅ 164 responses exported to tidy CSV from live emulator data — `pLBefore`/`pLAfter` chains match the hand-computed BKT fixtures (0.25 → 0.648 → 0.905…) |

Note: account deletion removes the auth user + profile immediately; purging
the (rules-protected, create-only) response log requires the admin tooling —
by design, so learner data can't be silently destroyed client-side. Recorded
in DECISIONS.md.

## Phase 4 — BKT + routing + the visible mind (2026-07-15, tag `v0.4-phase4`)

The dissertation core. All checks with emulators + seed running.

| Check | Result |
| --- | --- |
| `npm run lint` / `npm run typecheck` | ✅ clean |
| `npm run test` (Vitest unit) | ✅ **54/54** — adds routing decision table, prereq unlock gating (boundary at exactly 0.8), difficulty ladder, non-repetition, remediation trigger (2 consecutive wrongs → easy item), `newlyUnlocked` ceremony trigger |
| `npm run test:e2e` | ✅ **14/14** (kitchen sink, auth, quiz offline, adaptive journey — desktop + mobile) |
| Done-criterion journey | ✅ **placement (8 questions) → model-initialization moment ("Your starting map.") → dashboard routes to lowest-mastery KC → lesson → adaptive topic test (mastery HUD live, "Why this question?" shows real model values) → mastery celebration at pL ≥ 0.8 → summary "65% → 100%" → skill tree: mastered ✓ / newly available / locked states all asserted** |
| Simulated learners | ✅ table below — 3/3 sanity behaviours, parameter-recovery RMSE reported |

Behaviour notes for the report:
- Adaptive sessions may end before the nominal 10 questions when the unlocked
  item pool is exhausted (one unlocked KC × 8 items after a skipped
  placement) — correct routing behaviour, asserted in the offline E2E by
  matching the Firestore response count to the actual answers given.
- Placement responses are logged with `pLBefore == pLAfter` (no learning step
  during measurement); `initialiseFromPlacement` then seeds each KC's prior —
  placement evidence is analysable separately in the dataset.
- pL0 recovery (RMSE ≈ 0.23) is expectedly weak at 40 binary observations —
  the prior is only weakly identified once pT lifts pL; pT recovers well
  (RMSE ≈ 0.11). Honest limitation to discuss in the evaluation chapter.

Screenshots: `docs/screenshots/placement-intro.png`, `init-moment.png`,
`dashboard.png`, `quiz-hud-why.png`, `skill-tree.png`.

<!-- SIMULATION:START -->

### Simulated-learner harness (BKT validation)

Generated 2026-09-17 by `scripts/simulate.ts` (seeded, reproducible).

| Metric | Value |
| --- | --- |
| Learners (N) | 200 |
| Opportunities per learner | 40 |
| Sanity 1 — correct streak crosses 0.8 | 2 items ✅ |
| Sanity 2 — wrong streak stays < 0.4 | max pL 0.1552 ✅ |
| Sanity 3 — improving learners climb | 99.0% of cohort ✅ |
| RMSE(pL0) — recovery vs ground truth | 0.2348 (bias -0.1023) |
| RMSE(pT) — recovery vs ground truth | 0.1139 (bias 0.0609) |
| Ground-truth priors | pL0 ~ U(0.05, 0.45) · pT ~ U(0.05, 0.25) · pG=0.2 · pS=0.1 fixed |

<!-- SIMULATION:END -->


## Routing policy simulation (2026-09-17)

Run: `npm run simulate:routing`. Same synthetic learners, three policies, one item budget; answers come from the learner's hidden true state, not from the engine's estimate. "Items spent on KCs the learner already knew" is the waste measure; the last two columns are the estimate's errors in each direction at the end of the run.

Reading it: the adaptive policy reaches the same true knowledge as the syllabus with 46 per cent of the items, and most of the saving is items the syllabus spends on modules the learner already knew. The cost is in the second-to-last column. The engine stops asking about a module once its estimate crosses 0.8, and a guess or two on easy items can put it there, so about one module in sixteen is declared mastered that the learner doesn't actually know. The syllabus has the opposite error (it under-calls, because it keeps asking) and pays for it with double the items. The knob is the mastery threshold and the guess parameter, and the pilot's post-test is designed to measure exactly this (analyse.ts, "held-out check").

<!-- routing-sim:start -->
Routing policy simulation: 300 learners, 160 items each, seed 7. Learners start knowing 3.66 of 16 KCs on average.

| Policy | Items used (of 160) | KCs actually known at the end (of 16) | Items spent on KCs the learner already knew | Estimated mastered but not known | Known but not yet estimated mastered |
| --- | ---: | ---: | ---: | ---: | ---: |
| Adaptive (the engine) | 73.6 | 14.97 (sd 0.97) | 32.6 (44%) | 1.03 | 0.00 |
| Fixed syllabus | 160.0 | 14.77 (sd 1.00) | 121.4 (76%) | 0.05 | 0.77 |
| Random unlocked | 160.0 | 8.50 (sd 1.58) | 142.3 (89%) | 0.03 | 1.28 |
<!-- routing-sim:end -->


## Study instruments, axe, coverage (2026-09-17)

### The pilot pipeline, end to end

| Piece | Where | Checked by |
| --- | --- | --- |
| Placement (form A) | `/placement`, `pickAssessment(kcs, eligible, "A")` | `adaptive-journey.spec.ts`, `study.spec.ts` |
| Post-test (form B, 15 of 16 items differ, no model update, pLBefore logged) | `/post-test`, `isAssessment()` in the session store | `study.spec.ts`, `assessment.test.ts` |
| SUS + open questions | `/survey` → `users/{uid}/surveys/sus` | `study.spec.ts`, `firestore.rules.test.ts` (owner-only, stranger denied) |
| Analysis | `npm run analyse` / `analyse:live` → `docs/report/PILOT_RESULTS.md` | Runs clean on the empty live database (n = 0) and on the emulator after the E2E run |

Normalised gain and the SUS arithmetic have unit tests against worked examples (`tests/unit/assessment.test.ts`).

### axe-core WCAG 2.1 AA (`tests/e2e/axe.spec.ts`)

Public pages (`/`, `/sign-in`, `/sign-up`, `/legal`) and signed-in pages (dashboard, skill tree, a lesson, profile, settings, survey, post-test, a live quiz question) on desktop and Pixel 7 profiles, tags wcag2a/2aa/21a/21aa, canvases excluded, serious and critical violations fail the test. Three real defects found and fixed before it went green:

| Found | Where | Fix |
| --- | --- | --- |
| `--fg-muted` #5b5b6b at 3.0:1 | every small label, footer, quiz meta | token raised to #82829a (4.6:1 on all three elevations) |
| Unearned badges at 40% tile opacity → text at 1.9:1 | profile | dim the icon and swap text tones; tile stays at full opacity |
| Sideways-scrolling lesson table not keyboard reachable | lesson markdown tables | wrapper is a focusable `role="region"` with a name |

### Unit coverage (`npm run test:coverage`, v8)

| Module | Lines | Branches |
| --- | ---: | ---: |
| `lib/bkt` | 100% | 91% |
| `lib/assessment` | 100% | 100% |
| `lib/quiz/grade` | 100% | 93% |
| `lib/routing` | 94% | 90% |
| `lib/logging/logger` | 90% | 58% |
| `lib/walkthroughs` (synth + registry) | 78 to 90% | 71% |
| all of `lib/` | 46% | 35% |

The whole-`lib` figure is low because the Firebase adapters, stores and hooks are exercised by the Playwright journeys, not unit tests. The claim the dissertation makes is about the engine, and the engine modules are the top four rows.

### Suite totals on this commit

Unit 138 · rules 16 · E2E 32 (16 journeys × 2 profiles) · lint and typecheck clean.

### Lighthouse, production (https://tmacademyuk.vercel.app)

<!-- lighthouse-prod:start -->
Lighthouse 12, headless Chrome, three runs per page per preset, medians reported (first cold run on this machine is usually an outlier; the individual performance scores are listed). Mobile is the default preset: simulated slow 4G, 4× CPU slowdown. Desktop is `--preset=desktop`.

| Page | Preset | Performance (runs) | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Landing `/` | mobile | **89** (62, 89, 89) | 100 | 100 | 100 | 1.0 s | 3.8 s | 16 ms | 0 |
| Sign-in | mobile | **91** (65, 91, 91) | 100 | 100 | 100 | 1.0 s | 3.5 s | 0 ms | 0 |
| Legal | mobile | **93** (66, 100, 93) | 100 | 100 | 100 | 1.0 s | 3.2 s | 0 ms | 0 |
| Landing `/` | desktop | **100** (100, 100, 100) | 100 | 100 | 100 | 0.3 s | 0.7 s | 0 ms | 0 |
| Sign-in | desktop | **100** (100, 100, 100) | 100 | 100 | 100 | 0.3 s | 0.7 s | 0 ms | 0 |
| Legal | desktop | **100** (100, 100, 100) | 100 | 100 | 100 | 0.2 s | 0.6 s | 0 ms | 0 |

What it took to get there, in order, each verified by re-running:

| Before | Cause | Fix | After |
| --- | --- | --- | --- |
| Landing mobile 61, LCP 7.8 s, accessibility 96 | The three.js hero mounted on hydration, so the headline and copy (the LCP) queued behind the WebGL chunk; `--fg-muted` at 3:1 on the footer | Particles mount on `requestIdleCallback` after first paint and fade in with CSS; token raised to 4.6:1 | 98 on that run, 89 median; accessibility 100 |
| Sign-in mobile 77, LCP 6.6 s; legal 92 | Framer Motion page entrances rendered every block with inline `opacity:0` in the server HTML, so nothing was visible until 940 KB of JavaScript had hydrated | `Stagger`/`StaggerItem`/`Reveal` rebuilt as CSS animations (nth-child stagger, scroll-driven reveal where supported); server HTML paints immediately | Sign-in 91, LCP 3.5 s; legal 93 |
| Legal accessibility 96 after the above | The scroll-driven reveal faded blocks in, so a paragraph straddling the bottom of the viewport sat at partial opacity, which is text at 3.3:1 | The reveal moves but never fades | 100 |

The remaining mobile LCP of 3 to 4 s is the simulated slow-4G download of the JavaScript the pages genuinely use (Firebase Auth, Framer Motion, GSAP on the landing); the desktop numbers show there is nothing left on the render path itself. Signed-in pages were audited in July via `scripts/audit.ts` (dashboard 86 performance, accessibility 96 to 100) and are covered by the axe suite above rather than re-audited here.
<!-- lighthouse-prod:end -->
