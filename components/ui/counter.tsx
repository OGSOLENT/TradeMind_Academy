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
