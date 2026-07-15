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
