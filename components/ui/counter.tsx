"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A number that rolls to its value instead of popping into place — guardrail
 * §7.8 ("every number animates by rolling, never popping"). The MasteryRing
 * does this for percentages; this is the standalone version for the dashboard
 * tiles and profile stats.
 */
export function Counter({
  value,
  className,
  suffix,
  duration = 900,
}: {
  value: number;
  className?: string;
  suffix?: string;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const raw = useMotionValue(0);
  const spring = useSpring(raw, reduced ? { duration: 0 } : { stiffness: 90, damping: 20 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (reduced) {
      raw.jump(value);
      return;
    }
    const t = setTimeout(() => raw.set(value), 60);
    return () => clearTimeout(t);
  }, [value, raw, reduced, duration]);

  return (
    <span className={cn("num tabular-nums", className)}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
