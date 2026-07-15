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
