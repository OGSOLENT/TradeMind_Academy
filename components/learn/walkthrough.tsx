"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Walkthrough as Spec } from "@/lib/walkthroughs/types";
import { Kbd } from "@/components/ui/kbd";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import { WalkthroughChart } from "./walkthrough-chart";

/**
 * The stepped chart. One synthetic series, and a stack of annotations that
 * builds up as you press Next: each step adds its own layer and its caption
 * changes underneath. Earlier layers stay but dim, so the current idea is
 * the bright one. Arrow keys work once the figure has focus, the caption is
 * a live region, and "Describe" lays every step out as text. The drawing
 * itself is in walkthrough-chart.tsx, which has no hooks so the review
 * harness and the report can render it statically.
 */

export function Walkthrough({ spec, anchor = "walkthrough" }: { spec: Spec; anchor?: string }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [describe, setDescribe] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const last = spec.steps.length - 1;

  // Arrow keys step through once the figure has focus.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setStep((s) => Math.min(last, s + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [last]);

  const current = spec.steps[step]!;

  return (
    <figure id={anchor} className="scroll-mt-32">
      <div
        ref={wrap}
        tabIndex={0}
        aria-label={`${spec.title}. Step ${step + 1} of ${spec.steps.length}. Use the arrow keys to move between steps.`}
        className="relative isolate overflow-hidden rounded-card bg-bg-elevated shadow-lift outline-none focus-visible:shadow-[0_0_0_2px_var(--accent)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Pill tone="mastery" dot>
                Walkthrough
              </Pill>
              <span className="truncate text-sm font-medium text-fg-primary">{spec.title}</span>
            </div>
            <p className="mt-1 text-xs text-fg-muted">{spec.frame} · simulated data</p>
          </div>
          <button
            onClick={() => setDescribe((d) => !d)}
            aria-expanded={describe}
            className="rounded-pill bg-[rgba(5,5,7,0.8)] px-3 py-1.5 text-label-caps uppercase tracking-wider text-mastery-bright shadow-hairline transition-[background-color,box-shadow] duration-200 hover:bg-bg-deep hover:shadow-[inset_0_0_0_1px_var(--mastery-glow)]"
          >
            {describe ? "Hide description" : "Describe this walkthrough"}
          </button>
        </div>

        <WalkthroughChart spec={spec} step={step} className="mt-2 block w-full" />

        {/* Controls and caption */}
        <div className="border-t border-white/5 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="min-h-11 rounded-control px-3 text-sm text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary disabled:opacity-30"
            >
              ← Back
            </button>
            <ol className="flex items-center gap-1.5" aria-label="Steps">
              {spec.steps.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    aria-label={`Step ${i + 1}: ${s.title}`}
                    aria-current={i === step ? "step" : undefined}
                    onClick={() => setStep(i)}
                    className={cn(
                      "flex h-11 w-6 items-center justify-center",
                    )}
                  >
                    <span
                      className={cn(
                        "block h-1.5 rounded-pill transition-[width,background-color] duration-300",
                        i === step ? "w-6 bg-mastery-bright" : i < step ? "w-1.5 bg-[rgba(45,212,191,0.5)]" : "w-1.5 bg-white/15",
                      )}
                    />
                  </button>
                </li>
              ))}
            </ol>
            {step < last ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(last, s + 1))}
                className="tm-sheen min-h-11 rounded-control bg-accent px-4 text-sm font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(0)}
                className="min-h-11 rounded-control px-3 text-sm text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary"
              >
                Start again
              </button>
            )}
          </div>
          <div className="mt-3 min-h-[3.5rem]" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: reduced ? 0.1 : 0.25 }}
              >
                <p className="num text-label-caps uppercase tracking-[0.18em] text-fg-muted">
                  Step {step + 1} of {spec.steps.length} · {current.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-fg-secondary">{current.caption}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="mt-2 hidden text-xs text-fg-muted md:block">
            <Kbd>←</Kbd> <Kbd>→</Kbd> move between steps when the chart has focus
          </p>
        </div>
      </div>

      <AnimatePresence>
        {describe && (
          <motion.ol
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2 overflow-hidden rounded-control bg-white/5 p-4 text-sm leading-6 text-fg-secondary"
          >
            <li className="text-fg-primary">
              {spec.title}. {spec.frame}. Simulated prices built to show the idea; not a real market.
            </li>
            {spec.steps.map((s, i) => (
              <li key={i}>
                <span className="text-fg-primary">Step {i + 1}, {s.title}.</span> {s.caption}
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </figure>
  );
}
