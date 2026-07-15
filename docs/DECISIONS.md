# Decisions Log

One line per significant decision: date · decision · why.

- 2026-07-15 · Body background token `bg-deep #050507`, not the `#13131b` used by the landing-page prototype HTML — the design-system doc (`trademind_design_system/DESIGN.md` prose, "Level 0 Base: #050507") and the dashboard prototype body both use #050507; the landing screen's #13131b is the Stitch Material-theme default, treated as a prototype inconsistency.
- 2026-07-15 · Mastery colour `#2DD4BF` canonical (per DESIGN.md prose + build prompt); prototype's brighter `#44E2CD` kept as `mastery-bright` for text/data on dark surfaces where it dominates the dashboard screen.
- 2026-07-15 · JetBrains Mono replaces the prototype's Geist Mono — build prompt Section 1 tech stack is fixed and the dashboard prototype itself comments "JetBrains Mono fallback".
- 2026-07-15 · Two glass tokens: `surface-glass rgba(255,255,255,0.04)` (build prompt, cards/overlays) and `glass-nav rgba(19,19,27,0.4)` (landing prototype nav) — both always paired with blur(20px).
- 2026-07-15 · Next.js 14.2 + React 18 + Tailwind 3.4 (not Next 15/Tailwind 4) — build prompt mandates `tailwind.config.ts` token config (Tailwind 3 idiom) and this is the stable, battle-tested combo for Framer Motion/r3f; "Next.js 14+" satisfied.
- 2026-07-15 · Phase approval gates skipped at user's explicit instruction ("GO FULL AGENT MODE", 2026-07-15) — plans and verification evidence are still presented per phase in the summary instead.
