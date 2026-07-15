"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

interface MasteryHudProps {
  kcTitle: string;
  /** Current pL 0..1 for the active KC. */
  pL: number;
}

/**
 * Live mastery HUD for the quiz header: spring gains, soft amber losses,
 * rolling mono number, and a screen-reader announcement on every change
 * ("Mastery increased to 71 percent" — guardrail §7.4).
 */
export function MasteryHud({ kcTitle, pL }: MasteryHudProps) {
  const reduced = useReducedMotion();
  const prev = useRef(pL);
  const [announcement, setAnnouncement] = useState("");
  const gaining = pL >= prev.current;

  useEffect(() => {
    if (pL !== prev.current) {
      const direction = pL > prev.current ? "increased" : "decreased";
      setAnnouncement(`Mastery ${direction} to ${Math.round(pL * 100)} percent`);
      prev.current = pL;
    }
  }, [pL]);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3" data-testid="mastery-hud">
      <span className="hidden truncate text-label-caps uppercase tracking-wider text-fg-secondary sm:block">
        {kcTitle}
      </span>
      <div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-pill bg-white/5" aria-hidden="true">
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
