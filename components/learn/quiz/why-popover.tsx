"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SelectionReason } from "@/lib/routing";
import { spring } from "@/lib/motion";

/**
 * "Why this question?" — surfaces the routing engine's real decision values.
 * The visible mind: nothing here is invented for display; it's the exact
 * SelectionReason the engine acted on.
 */
export function WhyPopover({ reason }: { reason: SelectionReason }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rows: Array<[string, string]> = [
    ["Topic", reason.kcId.replace("kc-", "").replaceAll("-", " ")],
    ["Current mastery estimate", `${Math.round(reason.pL * 100)}%`],
    ["Band", reason.band],
    ["Difficulty chosen", reason.difficulty],
    ["Model predicts you answer correctly", `${Math.round(reason.pCorrectPredicted * 100)}%`],
  ];
  if (reason.remediation) rows.push(["Mode", "remediation — two misses in a row, easing off"]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="min-h-11 rounded-control px-3 text-sm text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary"
      >
        Why this question?
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Why this question"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={spring.ui}
            className="absolute right-0 top-full z-30 mt-2 w-72 rounded-card bg-bg-elevated p-4 shadow-edge-lit"
          >
            <p className="text-label-caps uppercase tracking-wider text-accent-bright">
              The model&apos;s reasoning
            </p>
            <dl className="mt-3 space-y-2">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-fg-secondary">{label}</dt>
                  <dd className="num text-right text-xs capitalize text-fg-primary">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] leading-4 text-fg-secondary">
              Questions target your lowest-mastery unlocked topic; difficulty
              rises with your estimate.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
