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
import { masteryBand, type MasteryBand } from "@/lib/bkt";

/**
 * MasteryRing. The flagship component of the design system, and the one I'd
 * point a marker at first.
 *
 * How the animation plays out (docs/BUILD_PROMPT.md section 3):
 *   t=0          the value prop changes, say 0.62 to 0.71
 *   t=0 to ~600ms the arc moves via stroke-dashoffset on a spring.
 *                GAINS use spring.gain (stiffness 300, damping 18), so the
 *                arc visibly overshoots the target before settling. It's meant
 *                to feel like a small celebration.
 *                LOSSES use spring.loss (stiffness 170, damping 26). Slower,
 *                softer, no bounce, and the arc tints amber while it moves.
 *   t=0 to ~600ms the centre percentage ROLLS through the integers in between
 *                (62, 63 ... 71) on the same spring. Numbers never pop (7.8).
 *   settle       arc and number come to rest together, and the aria-label
 *                updates for screen readers.
 *   reduced      under prefers-reduced-motion the spring becomes a 150ms
 *                tween and the number jumps straight to the target, so there's
 *                a single announcement instead of a stream of them.
 *
 * Colour follows the BKT bands unless `tone` overrides it:
 *   pL at or above 0.8 is mastery teal, 0.4 to 0.8 is accent indigo, and
 *   anything below 0.4 is warning amber.
 */

export type RingTone = "auto" | "mastery" | "accent" | "warning";
export type RingSize = "sm" | "md" | "lg";

export interface MasteryRingProps {
  /** Mastery probability, 0 to 1. */
  value: number;
  size?: RingSize;
  tone?: RingTone;
  /** An optional label under the number (md and lg only). */
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

// The colour follows the model's own bands, so the ring can never show
// "mastered" at a value the routing engine still treats as practice.
const BAND_TONE: Record<MasteryBand, Exclude<RingTone, "auto">> = {
  mastered: "mastery",
  remediate: "warning",
  practice: "accent",
};

function bandTone(v: number): Exclude<RingTone, "auto"> {
  return BAND_TONE[masteryBand(v)];
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

  // The direction of travel picks the spring: gains overshoot, losses soften.
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
          // The label lives inside the ring, so it's clamped to the inner
          // width and allowed two short lines. "Market Structure & Delivery"
          // has to fit as well as "Daily Bias".
          <span
            className={cn("mt-0.5 line-clamp-2 text-center uppercase leading-tight tracking-wider text-fg-secondary", sub)}
            style={{ maxWidth: px * 0.66 }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
