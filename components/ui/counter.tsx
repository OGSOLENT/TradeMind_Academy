"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A number that rolls up to its value instead of popping into place. That's
 * guardrail 7.8 ("every number animates by rolling, never popping"). The
 * MasteryRing already does this for percentages, so this is the standalone
 * version for the dashboard tiles and the profile stats.
 *
 * Pass `inView` for anything below the fold. The roll then waits until the
 * number is actually on screen, otherwise it would finish before anyone
 * scrolled down to see it.
 */
export function Counter({
  value,
  className,
  suffix,
  duration = 900,
  inView = false,
}: {
  value: number;
  className?: string;
  suffix?: string;
  duration?: number;
  inView?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const raw = useMotionValue(0);
  const spring = useSpring(raw, reduced ? { duration: 0 } : { stiffness: 90, damping: 20 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (reduced) {
      raw.jump(value);
      return;
    }
    if (inView && !visible) return;
    const t = setTimeout(() => raw.set(value), 60);
    return () => clearTimeout(t);
  }, [value, raw, reduced, duration, inView, visible]);

  return (
    <span ref={ref} className={cn("num tabular-nums", className)}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
