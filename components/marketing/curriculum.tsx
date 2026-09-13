"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/motion/stagger";
import { ease } from "@/lib/motion";

/**
 * The Level-1 route, in teaching order. Mirrors scripts/generate-content.ts
 * (same titles, same order, same lesson counts), which is the source of
 * truth. If a module changes there, change it here too. The ticker on the
 * landing page reads its titles from this list as well so the two can't
 * drift apart.
 */
export const CURRICULUM = [
  { title: "The Candle", blurb: "OHLC, the three candle types, and why every wick is a smaller trend.", lessons: 2 },
  { title: "Liquidity & Wicks", blurb: "Buyside and sellside liquidity, and what wick size says about expansion.", lessons: 2 },
  { title: "Risk & Position Sizing", blurb: "Fixed risk, structure-set stops, and the size that follows.", lessons: 3 },
  { title: "Reversal Patterns", blurb: "The Candle 2 closure, the Candle 3 variant, and context over shape.", lessons: 2 },
  { title: "Confirmation & Structure", blurb: "CISD, fair value gaps, protected swings and order blocks.", lessons: 7 },
  { title: "Market Structure & Delivery", blurb: "BOS, CHoCH, the four phases, premium and discount.", lessons: 3 },
  { title: "PD Arrays", blurb: "The full menu of levels and how to rank them.", lessons: 5 },
  { title: "Daily Bias", blurb: "Direction for the day from PDH, PDL and equilibrium.", lessons: 7 },
  { title: "Time & Sessions", blurb: "Power of Three, the Judas swing, macros and the Silver Bullet.", lessons: 6 },
  { title: "Entry Models", blurb: "The 2022 model, turtle soup, and the market maker model.", lessons: 4 },
  { title: "The Fractal Model", blurb: "The T-Spot, deviation projections and the TTFM playbook.", lessons: 4 },
  { title: "SMT Divergence", blurb: "Confluence from correlated markets, framework first.", lessons: 1 },
  { title: "Higher-Timeframe Context", blurb: "IPDA ranges and the dollar, index and risk correlations.", lessons: 2 },
  { title: "Weekly Profiles", blurb: "The four shapes a week takes and which day to act on.", lessons: 5 },
  { title: "Execution & Review", blurb: "Partials, trailing, the journal, and thinking in probabilities.", lessons: 3 },
] as const;

const LESSONS = CURRICULUM.reduce((n, m) => n + m.lessons, 0);
const QUESTIONS = 108;

/**
 * The curriculum, laid out as the route it is. Fifteen numbered cards in
 * teaching order, with a thin line threading through the numbers so the
 * grid still reads as a sequence. Hover a card and its number lights teal,
 * the same colour a mastered module gets inside the app.
 */
export function Curriculum() {
  const reduced = useReducedMotion();
  return (
    <section id="curriculum" aria-label="Curriculum" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24">
      <Reveal>
        <p className="num text-label-caps uppercase tracking-[0.2em] text-mastery-bright">Curriculum</p>
        <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-2xl text-display-lg-mobile md:text-display-lg text-fg-primary">
            Fifteen modules, <span className="text-gradient">one route</span>.
          </h2>
          <dl className="num flex gap-8 text-sm">
            {[
              [CURRICULUM.length, "modules"],
              [LESSONS, "lessons"],
              [QUESTIONS, "questions"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wider text-fg-muted">{label}</dt>
                <dd className="mt-0.5 text-2xl text-fg-primary">
                  <Counter value={n as number} inView />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-4 max-w-2xl text-body-base text-fg-secondary">
          From reading one candle to running a full playbook. Each module is a
          knowledge component the model tracks on its own, and every module
          unlocks the next once your estimate crosses 80%. Every lesson ends
          with a short check that feeds straight back into the model.
        </p>
      </Reveal>

      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CURRICULUM.map((m, i) => (
          <motion.li
            key={m.title}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={reduced ? { duration: 0.15 } : { duration: 0.5, delay: (i % 3) * 0.07, ease: ease.choreo }}
          >
            <Card
              level="base"
              spotlight
              className="group h-full p-5 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="num flex h-7 w-7 items-center justify-center rounded-pill bg-white/[0.04] text-[11px] font-semibold tracking-widest text-fg-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-[color,box-shadow,background-color] duration-300 group-hover:bg-mastery/15 group-hover:text-mastery-bright group-hover:shadow-[inset_0_0_0_1px_var(--mastery-glow)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="num text-xs text-fg-muted">
                  {m.lessons} {m.lessons === 1 ? "lesson" : "lessons"}
                </span>
              </div>
              <h3 className="mt-4 text-body-base font-medium text-fg-primary">{m.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-fg-secondary">{m.blurb}</p>
            </Card>
          </motion.li>
        ))}
      </ol>

      <Reveal className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-fg-secondary">
          Every lesson is written, and comes with a chart you can ask the page to describe in words.
        </p>
        <Link
          href="/sign-up"
          className="group inline-flex items-center gap-2 text-sm font-medium text-fg-primary transition-colors hover:text-mastery-bright"
        >
          Start with the placement
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </Reveal>
    </section>
  );
}
