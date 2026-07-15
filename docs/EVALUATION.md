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
