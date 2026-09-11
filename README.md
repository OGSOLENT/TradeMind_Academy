# TradeMind Academy

An Intelligent Tutoring System for trading education — BSc dissertation artefact
(Solent University, QHO634). **Educational simulation only:** no live market data,
no signals, no broker links, 18+.

The adaptive loop is the research core: auth → lesson → per-topic test →
Bayesian Knowledge Tracing mastery update → rule-based routing → dashboard,
with an append-only response log exported for evaluation.

## Running it

Read [START_HERE.md](START_HERE.md). It's one page: kill everything, run the real app,
run the practice app, open the database. [RUNNING.md](RUNNING.md) has the longer version.

## Stack

Next.js 14 (App Router, TS strict) · Tailwind (custom tokens) · Framer Motion ·
GSAP · react-three-fiber · lightweight-charts · Firebase (Auth/Firestore/Storage,
Emulator Suite locally) · React Query · Zustand · Vitest · Playwright.

## Development

```bash
npm install
npm run dev            # app on :3000
npm run emulators      # Firebase emulator suite (requires firebase-tools)
npm run test           # unit tests (Vitest)
npm run test:e2e       # E2E (Playwright; builds + serves automatically)
npm run lint && npm run typecheck
```

Copy `.env.example` → `.env.local`. Local dev and tests target the emulator suite.

## Repository map

See `docs/BUILD_PROMPT.md` (canonical spec — re-read every session),
`docs/DECISIONS.md` (decision log), `design/prototype/` (Stitch screens,
reference only, never imported).
