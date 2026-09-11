"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

interface MasteryHudProps {
  kcTitle: string;
  /** The current pL, 0 to 1, for the KC being asked about. */
  pL: number;
}

/**
 * The live mastery HUD in the quiz header. Gains move on a spring, losses
 * soften into amber, the mono number rolls, and every change gets announced
 * to screen readers ("Mastery increased to 71 percent", guardrail 7.4). A
 * gain also throws a brief glow off the bar, which is the one moment in the
 * quiz where I let the interface celebrate a little.
 */
export function MasteryHud({ kcTitle, pL }: MasteryHudProps) {
  const reduced = useReducedMotion();
  const prev = useRef(pL);
  const [announcement, setAnnouncement] = useState("");
  const [flash, setFlash] = useState(false);
  const gaining = pL >= prev.current;

  useEffect(() => {
    if (pL !== prev.current) {
      const direction = pL > prev.current ? "increased" : "decreased";
      setAnnouncement(`Mastery ${direction} to ${Math.round(pL * 100)} percent`);
      if (pL > prev.current && !reduced) {
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 700);
        prev.current = pL;
        return () => clearTimeout(t);
      }
      prev.current = pL;
    }
  }, [pL, reduced]);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3" data-testid="mastery-hud">
      <span className="hidden truncate text-label-caps uppercase tracking-wider text-fg-secondary sm:block">
        {kcTitle}
      </span>
      <div
        className={cn(
          "h-1.5 min-w-16 flex-1 overflow-hidden rounded-pill bg-white/5 transition-shadow duration-700",
          flash && "shadow-[0_0_14px_var(--mastery-glow)]",
        )}
        aria-hidden="true"
      >
        <motion.div
          className={cn("h-full rounded-pill", gaining ? "bg-mastery" : "bg-warning")}
          initial={false}
          animate={{ width: `${pL * 100}%` }}
          transition={reduced ? { duration: 0.15 } : gaining ? spring.gain : spring.loss}
        />
      </div>
      <span className={cn("num text-sm", gaining ? "text-mastery-bright" : "text-warning")}>
        {Math.round(pL * 100)}%
      </span>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
