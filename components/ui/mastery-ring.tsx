"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn, clamp } from "@/lib/utils";

/**
 * MasteryRing — the flagship design-system component.
 *
 * ANIMATION TIMELINE (per docs/BUILD_PROMPT.md §3):
 *   t=0        value prop changes (e.g. 0.62 → 0.71)
 *   t=0..~600ms ring arc animates via stroke-dashoffset driven by a spring:
 *              GAINS  use spring.gain (stiffness 300, damping 18) → visible
 *              overshoot past the target before settling — celebratory.
 *              LOSSES use spring.loss (stiffness 170, damping 26) → slower,
 *              softer, no bounce, arc tinted amber during the move.
 *   t=0..~600ms the centre percentage ROLLS through intermediate integers
 *              (62, 63 … 71) on the same spring — numbers never pop (§7.8).
 *   settle     arc + number rest together; aria-label updates for SRs.
 *   reduced    prefers-reduced-motion: spring replaced by a 150ms tween,
 *              number jumps straight to target (single announcement).
 *
 * Colour follows the BKT bands unless `tone` is forced:
 *   pL ≥ 0.8 mastery teal · 0.4–0.8 accent indigo · < 0.4 warning amber.
 */

export type RingTone = "auto" | "mastery" | "accent" | "warning";
export type RingSize = "sm" | "md" | "lg";

export interface MasteryRingProps {
  /** Mastery probability 0..1. */
  value: number;
  size?: RingSize;
  tone?: RingTone;
  /** Optional label under the number (md/lg only). */
  label?: string;
  className?: string;
}

const sizes: Record<RingSize, { px: number; stroke: number; text: string; sub: string }> = {
  sm: { px: 48, stroke: 4, text: "text-xs", sub: "hidden" },
  md: { px: 96, stroke: 6, text: "text-xl", sub: "text-[10px]" },
  lg: { px: 160, stroke: 8, text: "text-4xl", sub: "text-xs" },
};

const toneVar: Record<Exclude<RingTone, "auto">, string> = {
  mastery: "var(--mastery)",
  accent: "var(--accent)",
  warning: "var(--warning)",
};

function bandTone(v: number): Exclude<RingTone, "auto"> {
  if (v >= 0.8) return "mastery";
  if (v < 0.4) return "warning";
  return "accent";
}

export function MasteryRing({
  value,
  size = "md",
  tone = "auto",
  label,
  className,
}: MasteryRingProps) {
  const reduced = useReducedMotion();
  const v = clamp(value, 0, 1);
  const { px, stroke, text, sub } = sizes[size];
  const r = (px - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  // Direction decides the emotional spring: gains overshoot, losses soften.
  const [prev, setPrev] = useState(v);
  const gaining = v >= prev;

  const raw = useMotionValue(v);
  const springValue = useSpring(raw, reduced
    ? { duration: 150 }
    : gaining
      ? { stiffness: 300, damping: 18 }
      : { stiffness: 170, damping: 26 });

  useEffect(() => {
    raw.set(v);
    setPrev(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  const dashOffset = useTransform(springValue, (s) => circumference * (1 - clamp(s, 0, 1)));
  const rolling = useTransform(springValue, (s) => Math.round(clamp(s, 0, 1) * 100));

  const activeTone = tone === "auto" ? bandTone(v) : tone;
  const color = toneVar[activeTone];
  const pct = Math.round(v * 100);

  return (
    <div
      role="img"
      aria-label={`Mastery ${pct} percent`}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: px, height: px }}
    >
      <svg width={px} height={px} className="-rotate-90" aria-hidden="true">
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: dashOffset,
            filter: `drop-shadow(0 0 6px ${color === "var(--mastery)" ? "var(--mastery-glow)" : "var(--accent-glow)"})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("num font-medium", text)} style={{ color }}>
          <motion.span>{rolling}</motion.span>
          <span className="opacity-70">%</span>
        </span>
        {label && (
          <span className={cn("mt-0.5 uppercase tracking-wider text-fg-secondary", sub)}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
