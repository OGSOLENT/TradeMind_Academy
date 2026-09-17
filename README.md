# TradeMind Academy

An Intelligent Tutoring System for trading education — BSc dissertation artefact
(Solent University, QHO634). **Educational simulation only:** no live market data,
no signals, no broker links, 18+.

The adaptive loop is the research core: auth → lesson → per-topic test →
Bayesian Knowledge Tracing mastery update → rule-based routing → dashboard,
with an append-only response log exported for evaluation.

Live: https://tmacademyuk.vercel.app

## How it fits together

```mermaid
flowchart LR
  subgraph Browser["Browser (Next.js 14 App Router, TypeScript)"]
    UI["Pages: dashboard, lesson, quiz,\nskill tree, review, profile, settings"]
    Store["Session store (Zustand)\nitems · answers · mastery"]
    BKT["lib/bkt\nP(L) update, thresholds 0.8 / 0.4"]
    Route["lib/routing\nunlocked KCs → weakest → item ladder"]
    Log["lib/logging\nqueue in localStorage, retry, backoff"]
    Vis["Walkthroughs · real-chart case studies\n· diagrams · three.js knowledge model"]
  end
  subgraph Firebase["Firebase (rules: owner-only, 18+ gate, create-only responses)"]
    Auth["Auth"]
    FS[("Firestore\nusers/{uid}/mastery · sessions · responses · surveys\nkcs · lessons · items")]
  end
  subgraph Content["Content pipeline (build time)"]
    MD["content/lessons/*.md\n66 lessons, 16 KCs"] --> Gen["scripts/generate-content.ts"]
    Bank["scripts/level1-items.ts\n116 items"] --> Gen
    Gen --> JSON["content/level1.json"] --> Seed["scripts/seed.ts"]
    Bars["Yahoo bars → find-case-studies.ts"] --> Vis
  end
  subgraph Eval["Evaluation (scripts/)"]
    Sim["simulate.ts · simulate-routing.ts\n· calibration.ts"]
    An["analyse.ts → PILOT_RESULTS.md"]
  end
  UI --> Store --> BKT --> Route --> Store
  Store --> Log --> FS
  UI --> Auth
  UI <--> FS
  Seed --> FS
  FS --> An
  BKT -. same code .-> Sim
  Route -. same code .-> Sim
  Blob["Vercel Blob\n36 lesson recordings"] --> UI
```

The loop in one line: placement seeds the model → routing picks the weakest unlocked module and an item at the right difficulty → every answer updates P(L) and is logged with the estimate before and after → the dashboard, skill tree and knowledge model show the learner exactly what the model believes. The post-test and SUS survey close the study; `scripts/analyse.ts` turns the log into normalised gain, time on task and usability numbers.

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
npm run dev            # the app on :3000 (live project, real Google)
npm run dev:emulator   # a throwaway copy on :3100 against the local emulators
npm run emulators      # Firebase emulator suite (requires firebase-tools)
npm run test           # unit tests (Vitest)
npm run test:e2e       # E2E (Playwright; builds + serves automatically)
npm run lint && npm run typecheck
npm run simulate:routing   # adaptive vs fixed vs random routing, into docs/EVALUATION.md
npm run analyse            # pilot data (emulator) → docs/report/PILOT_RESULTS.md
npm run deploy             # production snapshot to Vercel (docs/DEPLOY.md)
```

Copy `.env.example` → `.env.local`. Local dev and tests target the emulator suite.

## Repository map

See `docs/BUILD_PROMPT.md` (canonical spec — re-read every session),
`docs/DECISIONS.md` (decision log), `design/prototype/` (Stitch screens,
reference only, never imported).
