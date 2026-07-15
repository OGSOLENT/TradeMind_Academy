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

Generated 2026-07-15 by `scripts/simulate.ts` (seeded, reproducible).

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
