"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/stagger";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is this financial advice?",
    a: "No — and it never will be. TradeMind Academy teaches concepts on simulated data only. There are no signals, no live prices, no broker connections, and no claims about profitability. It is a university research project about how people learn.",
  },
  {
    q: "How does the adaptive tutor work?",
    a: "Every answer updates a Bayesian Knowledge Tracing model — a per-topic probability that you've mastered the skill. Routing rules pick your next question from your weakest unlocked topic, at a difficulty matched to your estimate. You can inspect the model's reasoning on any question.",
  },
  {
    q: "What data do you collect?",
    a: "Your answers, response times, and the model's mastery estimates — recorded with your GDPR consent for the dissertation evaluation, analysed anonymised. You can download everything or delete your account from Settings at any time.",
  },
  {
    q: "Who can use it?",
    a: "Adults (18+) only. The 18+ attestation is enforced at sign-up and in the database security rules, not just the interface.",
  },
  {
    q: "Do I need any trading experience?",
    a: "None. The placement test estimates your starting point with one question per module; if you're brand new, the tutor simply starts every topic from the beginning.",
  },
];

/**
 * The landing FAQ. I swapped the native <details> for a button-driven
 * accordion so the answer can slide open instead of snapping. It keeps the
 * same keyboard behaviour (Enter or Space on the question) and wires
 * aria-expanded and aria-controls so a screen reader knows what's going on.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const groupId = useId();

  return (
    <section id="faq" aria-label="Frequently asked questions" className="mx-auto max-w-3xl px-6 py-24">
      <Reveal>
        <h2 className="text-display-lg-mobile md:text-display-lg text-fg-primary">Questions</h2>
      </Reveal>
      <div className="mt-8 space-y-3">
        {FAQS.map(({ q, a }, i) => {
          const expanded = open === i;
          const panelId = `${groupId}-panel-${i}`;
          const buttonId = `${groupId}-button-${i}`;
          return (
            <Reveal key={q} rise={12}>
              <div
                className={cn(
                  "rounded-card bg-bg-elevated-veil transition-shadow duration-300",
                  expanded ? "shadow-lift" : "shadow-edge-lit",
                )}
              >
                <button
                  id={buttonId}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpen(expanded ? null : i)}
                  className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 rounded-card px-6 py-5 text-left text-body-base font-medium text-fg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {q}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-fg-muted transition-[transform,color,background-color] duration-300 ease-out",
                      expanded ? "rotate-45 bg-accent/15 text-accent-bright" : "bg-white/5",
                    )}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      key="content"
                      initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                      exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={reduced ? { duration: 0.15 } : { duration: 0.38, ease: ease.choreo }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-7 text-fg-secondary">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
