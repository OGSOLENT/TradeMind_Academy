# CLAUDE CODE MASTER BUILD PROMPT — TradeMind Academy

*Paste this whole document into Claude Code as the opening prompt. Before you do: (1) create the repo folder, (2) unzip `stitch_trademind_intelligent_tutor.zip` into `design/prototype/` at the repo root, (3) put this file at `docs/BUILD_PROMPT.md`. Claude Code should re-read this file at the start of every session.*

---

## 0. MISSION

You are building **TradeMind Academy** — an Intelligent Tutoring System for trading education. It is a BSc dissertation artefact (Solent University, QHO634), so the priorities are unusual and you must respect them:

1. **The adaptive learning loop is the dissertation.** Auth → lesson → per-topic test → BKT mastery update → rule-based routing → dashboard. This vertical slice must work end-to-end, be unit-tested, and produce exportable interaction logs for evaluation. Everything else is secondary.
2. **The response log is a research dataset.** Every answer event must be captured with enough fidelity to compute learning gains and validate BKT behaviour later. Treat the logger like a payments system: it must never silently fail.
3. **Ethics is a feature.** Education only, simulated data only, 18+, no signals, no live money, no broker links. These constraints appear in the UI (banners, disclaimers, copy) — not just in a footer.
4. **It must look like the prototype.** `design/prototype/` contains 40+ high-fidelity Stitch screens (each folder = one screen: `screen.png` + `code.html`). The PNG is the visual source of truth; the HTML is a reference for exact colors/spacing — extract from it, do not copy its markup (it's Tailwind-CDN prototype code, not production code).

**Working style (non-negotiable):**
- Work in phases (Section 6). At the start of each phase, present a short plan and the file tree you intend to create; wait for my approval. At the end of each phase, run the verification checklist before claiming completion — show me the actual test output and a screenshot (use Playwright screenshots for UI phases).
- Commit per feature with conventional commits (`feat:`, `fix:`, `test:`, `chore:`). Never commit secrets. Tag the repo at the end of each phase (`v0.1-phase1` etc.).
- If a decision isn't covered here, choose the option that (a) protects the evaluation dataset, (b) reduces scope. Ask only when a decision is irreversible.
- Never fabricate: no fake test output, no "should work". If something is untested, say so.

---

## 1. TECH STACK (fixed — do not substitute)

- **Next.js 14+ (App Router, TypeScript, strict), Tailwind CSS** with a custom token config (Section 3), **Framer Motion** for UI state animation, **GSAP + ScrollTrigger** for landing choreography, **react-three-fiber + drei** for the landing hero only, **lightweight-charts** (TradingView OSS) for all financial charts.
- **Firebase:** Auth (email/password + Google), Firestore, Storage (lesson videos), Cloud Functions only where client-side is impossible (data export endpoint). Use the **Firebase Emulator Suite** for all local dev and tests.
- **Testing:** Vitest for unit tests (BKT engine, routing rules, utilities), Playwright for the 5 core E2E journeys, `@firebase/rules-unit-testing` for security rules.
- **Tooling:** ESLint + Prettier, Husky pre-commit (lint + typecheck + unit tests), GitHub Actions CI running the same.
- State: React Query (TanStack) for Firestore reads + optimistic mutations; Zustand only for ephemeral UI state (quiz session, replay transport). No Redux.
- Fonts: **Inter** (UI) + **JetBrains Mono** (all numerals — mastery %, XP, prices, timers — with `font-variant-numeric: tabular-nums`).

---

## 2. REPO LAYOUT

```
/app                    # Next.js App Router
  /(marketing)/         # landing, legal, 404
  /(auth)/              # sign-in, sign-up, consent
  /(learn)/             # dashboard, skill-tree, lesson/[id], quiz/[sessionId], review, mistakes, profile, settings
  /(admin)/             # content CMS, analytics
/components/ui          # design-system primitives (button, input, card, ring, drawer, toast...)
/components/learn       # mastery ring, skill node, question renderers, HUD
/lib/bkt                # THE ENGINE: pure TypeScript, zero Firebase imports
/lib/routing            # mastery→routing rules, pure functions
/lib/firebase           # client init, typed converters, repositories
/lib/logging            # response logger (queue + retry + flush)
/content                # seed curriculum JSON (Level 1)
/scripts                # seed script, data export → CSV, simulated-learner runner
/tests                  # unit / rules / e2e
/design/prototype       # the Stitch export (reference only, never imported)
/docs                   # this file, DECISIONS.md, EVALUATION.md
```

**`docs/DECISIONS.md`:** append one line per significant decision (date, decision, why). This becomes report material — maintain it without being asked.

---

## 3. DESIGN SYSTEM (extract → tokenize → enforce)

**First task of Phase 1:** open `design/prototype/trademind_design_system/code.html` and `screen.png`, plus the landing and dashboard screens, and extract the exact palette into `tailwind.config.ts` + CSS variables. The canonical tokens (verify against prototype, prototype wins on conflict):

```
bg-deep #050507 · bg-base #0A0A0F · bg-elevated #101018 · surface-glass rgba(255,255,255,0.04)+blur(20px)
border-hair rgba(255,255,255,0.08) · fg-primary #EDEDF2 · fg-secondary #908F9E · fg-muted #5B5B6B
accent #5E6AD2 (+glow rgba(94,106,210,.25)) · mastery #2DD4BF (+glow) · warning #FFB955 · danger #FFB4AB-family (soft, from prototype)
bull #2DD4BF / bear (soft red family) — colour-blind mode swaps to #3B82F6/#F59E0B
radius: card 16 / control 10 / pill 999 · never pure #000 backgrounds
```

**Motion constants** in `/lib/motion.ts`, used everywhere (no inline magic numbers):
- `spring.ui = { type:"spring", stiffness:260, damping:24 }` (state changes, presses at scale 0.97)
- `ease.choreo = cubic-bezier(0.16,1,0.3,1)`, entrances = fade + 12–24px rise, stagger 0.06, max 8 children
- Micro 150–250ms, panels 300–500ms, landing set-pieces ≤800ms. All interruptible.
- `prefers-reduced-motion`: transforms collapse to ≤150ms fades; three.js renders one static frame.
- **Emotional rule:** gains animate with overshoot (spring), losses animate slower/softer in amber — wrong answers never flash red, never shake.

**Component build order (Phase 1):** Button (5 variants × 7 states) → Input family → Card → MasteryRing (flagship: SVG stroke-dashoffset, spring overshoot, rolling mono number; 3 sizes; document its timeline in the component file) → Pill/Chip → Progress (bar/segmented) → Toast system (Sonner-style stack, 4 variants, swipe-dismiss) → Drawer (Vaul-style: snap points 40/90%, background scale 0.97) → Modal → Tabs (spring underline) → Skeletons → Kbd chip. Build a `/dev/kitchen-sink` route rendering every component in every state — this is your visual regression page and my report screenshot page.

---

## 4. DATA MODEL (Firestore)

```
users/{uid}                     { displayName, createdAt, consent: {agreedAt, version}, isAdult: true, settings {theme, reducedMotion, colorBlindCandles, fontScale} }
users/{uid}/mastery/{courseId}  { kcs: { [kcId]: { pL: number, attempts, lastSeen, masteredAt|null } }, updatedAt }   // ONE doc per course — no per-KC docs
users/{uid}/sessions/{sid}      { type: placement|lesson-check|topic-test|review, startedAt, endedAt, kcIds[] }
users/{uid}/sessions/{sid}/responses/{rid}   // APPEND-ONLY research log
  { itemId, kcId, questionType, correct, selected, latencyMs, pLBefore, pLAfter, ts }
courses/{courseId}              { title, levels[] }
kcs/{kcId}                      { courseId, title, prereqIds[], level, description }
lessons/{lessonId}              { kcId, blocks[] (markdown/figure/video/checkQuestion), videoUrl|null, videoFallbackUrl|null }
items/{itemId}                  { kcId, type: mcq|multi|numeric|ordering|annotation|tf-confidence, difficulty: easy|med|hard, payload, answerKey, explanation, isPretestEligible }
```

- **BKT thresholds (from the AE1 report — canonical): unlock/mastered at pL ≥ 0.8; remediation band pL < 0.4; between = practice band.**
- Mastery writes: batch per question (transaction on the single mastery doc). Response log: client-side queue in `/lib/logging` — enqueue → optimistic UI → flush with retry/backoff → localStorage persistence of unflushed events across refresh. A failed log write must surface a toast and re-queue, never drop.
- **Security rules + tests:** users read/write only their own subtree; `content/kcs/lessons/items` read-only to authed users, write only via admin custom claim; responses are create-only (no update/delete) — enforce and test all of this with rules-unit-testing.
- `scripts/export.ts`: pulls one user's (or all users', admin) responses → tidy CSV (one row per response, columns matching the schema) for the Python evaluation notebook.

---

## 5. THE BKT ENGINE (`/lib/bkt` — pure, tested, zero dependencies)

Implement classic Corbett & Anderson (1994) BKT per KC with parameters `{ pL0, pT, pG, pS }` (defaults: 0.25, 0.12, 0.20, 0.10 — configurable per KC via `kcs` doc later):

```
evidence update:  pL|correct = pL(1-pS) / (pL(1-pS) + (1-pL)pG)
                  pL|wrong   = pL·pS   / (pL·pS   + (1-pL)(1-pG))
learning step:    pL' = pL|evidence + (1 - pL|evidence)·pT
predict P(correct) = pL(1-pS) + (1-pL)pG
```

- API: `updateMastery(pL, correct, params) → { pL, pCorrectPredicted }`, plus `initialiseFromPlacement(responses[]) → pL0 per KC`.
- **Routing rules** (`/lib/routing`, pure): given the mastery map + prereq graph → `{ unlockedKcIds, nextAction: lesson|practice|remediate|advance, nextItem(kcId, history) }`. Item selection: lowest-mastery unlocked KC; difficulty ladder easy→med→hard as pL rises; 2 consecutive wrongs on a KC → route to remediation (re-serve micro-lesson, then an easy item); never repeat an item within a session.
- **Simulated-learner harness** (`scripts/simulate.ts`): generate N=200 synthetic learners with known ground-truth params answering via the BKT observation model; run them through the real engine; assert the three sanity behaviours from the AE1 report (streak of correct → crosses 0.8 within a few items; streak of wrong → stays < 0.4; improving learner climbs monotonically-ish) and output a parameter-recovery RMSE table to `docs/EVALUATION.md`. This script is dissertation evidence — make its output pretty.
- Unit tests: update math against hand-computed fixtures, threshold crossings, routing decision table (given mastery state X expect action Y), item-selection non-repetition, placement initialisation.

---

## 6. BUILD PHASES (mirror the AE1 milestone order — do not reorder)

### PHASE 1 — Foundations (repo, tokens, components, emulators)
Scaffold, CI, emulator suite, design tokens from prototype, component library + kitchen sink, motion constants, app shell (glass nav from `trademind_landing_page`, mobile bottom tab bar with raised Practice FAB). **Done when:** CI green, kitchen sink matches prototype aesthetics side-by-side, Lighthouse a11y ≥ 90 on the shell.

### PHASE 2 — Auth, data layer, content layer
Sign-in/up matching `auth_sign_in` + `auth_sign_in_mobile` (floating labels, strength bar, 18+ checkbox, consent screen with real GDPR copy, Decline is a real button). Firestore repositories + converters + security rules + rules tests. Seed script loading Level 1 curriculum from `/content` — **create placeholder content for 8 Level-1 KCs** (candlestick anatomy → market structure → support/resistance → liquidity basics → fair value gaps → kill zones → risk management → position sizing) with 2 lesson blocks + 8 items each (I will replace copy later; structure and KC ids are what matter). Lesson view per `trademind_lesson_view` + `lesson_view_mobile`: reading column, 2px progress bar, video block with `videoUrl` + fallback poster (NotebookLM videos slot in later), inline check questions that collapse to ✓ chips, "Describe this chart" text-alternative toggle on every figure. **Done when:** a seeded user can sign up, consent, read a full lesson with video placeholder, and rules tests pass.

### PHASE 3 — Assessment engine + question bank
All six question renderers (MCQ, multi-select, numeric+stepper, ordering drag with spring layout, chart-annotation on lightweight-charts with tap-marker + reveal-zone, true/false with confidence slider incl. detents). Focus-mode quiz shell per `question_quiz_session(+_mobile)`: segmented progress, card transitions (exit -24px left / enter from right, reversed on back), keyboard 1–4/Enter with kbd chips, autosave session to Zustand+localStorage (refresh resumes). Feedback panel (check/cross draws in, one-line why, lesson link). Response logger wired to EVERY submit with `pLBefore/pLAfter`. **Done when:** Playwright completes a full 10-question mixed-type session offline-tolerant (kill network mid-session → events flush on reconnect).

### PHASE 4 — BKT + routing + the visible mind (the dissertation core)
Wire engine to sessions. Placement test flow per `onboarding_placement_test(+_mobile)` → **model-initialization moment**: constellation assembles from particles, nodes fill to starting pL with 0.06 stagger, skippable, caption "Your starting map." Mastery HUD in quiz (live bar, spring gains / soft amber losses, rolling mono numbers). "Why this question?" popover with real model values. Dashboard per `trademind_dashboard(+_mobile,+_adjustment_tracking_*)`: Continue-learning hero with MasteryRing, review-due card, activity strip, mastery-over-time chart (lightweight-charts area, KC pill selector). Skill tree per `skill_tree_constellation_map` + `skill_tree_mobile`: pan/zoom constellation, node states (locked 40% + padlock tooltip / available breathing glow / mastered closed ring / remediation amber pulse), side panel desktop → Vaul drawer mobile, **unlock ceremony** (edge draws 600ms → node spring pop → 12-particle burst → toast, queued if multiple). Mastery celebration per `mastery_celebration_review(+_mobile)` — the ONE big ceremony (dim 20%, ring sweep, ~40 particle burst, 2s auto-dismiss). Session summary with per-KC deltas ("62% → 71%"). **Done when:** simulated-learner script output is in EVALUATION.md, all routing unit tests pass, and a Playwright journey goes placement → routed lesson → topic test → mastery event → unlocked next KC.

### PHASE 5 — Learner-support features (build ONLY after Phase 4 is verified)
- **Answer review** per `full_feedback_detail_desktop` + `full_feedback_detail_mobile`: post-session review of each answered item — the question, the learner's answer vs the key, the explanation, and for chart-annotation items the chart re-rendered with the learner's marker and the correct zone overlaid. Rule-based feedback text only (no AI tutor — that is documented future work in AE1).
- **Review queue** (card stack, fly-off spring physics, amber "fading skills" framing), **mistake bank** (grouped by KC, re-drill), **profile/badges**, **settings** (colour-blind candles with live preview, font scale, reduced motion, Download-my-data calling the export, Delete-account with type-DELETE + 5s undo toast).

### PARKED — designed, deliberately NOT built (do not implement; do not delete the designs)
The following prototype screens are **out of scope for this build** and exist as dissertation appendix evidence of the full product vision. If any instruction elsewhere in this document or in the prototype seems to reference them, this section wins:
- **Mentor marketplace** (`mentor_*` screens, all six): cut entirely — no directory, no profiles, no booking, no checkout, no payment code of any kind. Rationale for the report: no contribution to the research question; introduces paid-guidance/signals ethics risks AE1 explicitly warns against.
- **Terminal simulator / order flow** (`trademind_terminal_simulator`, `trademind_terminal_mobile`, `trademind_dashboard_order_flow_animated`): cut — no bar-by-bar replay engine, no order tickets. The chart-annotation question type in Phase 3 covers visual assessment.
- **Trade review with mentor CTA** (`trade_review_*_with_mentor_cta_*`, `trade_review_analysis_desktop`, `trade_review_mobile`): superseded by the simpler answer-review above; do not build the trade-journal variant.
Create `docs/PARKED.md` listing these with one-line rationales — it becomes the "future work" section of the dissertation.

### PHASE 6 — Landing + polish + audits
Landing per `trademind_landing_page` with the three.js hero from `design/prototype/three.js/code.html` and `shader_1/2` as reference (adapt into r3f; 2–3k particles desktop / 800 mobile / static frame fallback), SplitText-style headline (use GSAP core text splitting, not the paid plugin — write a tiny splitter), pinned "visible mind" scroll section, bento grid, FAQ, full disclaimer footer. 404 (candle-glyph "404 — this chart pattern doesn't exist"), offline banner, legal page. Full audit pass: axe + Lighthouse (a11y ≥ 95, perf ≥ 85 on dashboard), keyboard-only walkthrough of quiz/tree/review, contrast check on glass surfaces, reduced-motion verification. Output all audit results to `docs/EVALUATION.md`.

---

## 7. HARD GUARDRAILS (apply to every phase; violating any = the work is wrong)

1. Education/simulation only: no live market data, no broker links, no signal language, no profitability promises anywhere in copy; risk-disclaimer banner on the landing page and on every chart-based exercise.
2. Response log is sacred: create-only, queued, retried, exportable; every submit logs `pLBefore/pLAfter`.
3. BKT thresholds 0.8 / 0.4 exactly (report-canonical); engine stays pure TS with 100% unit coverage on the math.
4. Accessibility gates from Phase 1 onward, not as a final pass: focus-visible, 44px targets, aria-live "Mastery increased to 71 percent", text alternative on every chart, colour-blind mode, reduced-motion.
5. All secrets via `.env.local` (gitignored) + `.env.example` committed; Firestore rules deny-by-default.
6. Prototype HTML is reference-only — never import it, never ship Tailwind CDN.
7. No new dependencies beyond Section 1 without asking. No paid GSAP plugins.
8. Every number in the UI is JetBrains Mono tabular-nums and animates by rolling, never popping.

## 8. START NOW

Begin Phase 1. First message back to me: the proposed file tree, the extracted token table (with the exact hex values you found in `trademind_design_system`), and your plan for the component library — then wait for my approval.
