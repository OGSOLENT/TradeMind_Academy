"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn, clamp } from "@/lib/utils";
import { spring } from "@/lib/motion";

export interface ProgressBarProps {
  /** 0 to 1 */
  value: number;
  /** "thin" is the 2px floating reading-progress line DESIGN.md describes. */
  variant?: "default" | "thin";
  tone?: "accent" | "mastery" | "warning";
  className?: string;
  "aria-label"?: string;
}

const toneClass = {
  accent: "bg-accent",
  mastery: "bg-mastery",
  warning: "bg-warning",
};

export function ProgressBar({
  value,
  variant = "default",
  tone = "mastery",
  className,
  "aria-label": ariaLabel = "Progress",
}: ProgressBarProps) {
  const reduced = useReducedMotion();
  const v = clamp(value, 0, 1);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-label={ariaLabel}
      className={cn(
        "w-full overflow-hidden",
        variant === "thin" ? "h-0.5" : "h-2 rounded-pill bg-white/5",
        className,
      )}
    >
      <motion.div
        className={cn(
          "h-full",
          variant === "default" && "rounded-pill",
          // The thin reading line gets a gradient and a glow so it reads as a
          // trace of light along the top of the page instead of a plain rule.
          variant === "thin" && tone === "mastery"
            ? "bg-gradient-to-r from-mastery via-mastery-bright to-accent-bright shadow-[0_0_10px_var(--mastery-glow)]"
            : toneClass[tone],
        )}
        initial={false}
        animate={{ width: `${v * 100}%` }}
        transition={reduced ? { duration: 0.15 } : spring.ui}
      />
    </div>
  );
}

export interface SegmentedProgressProps {
  total: number;
  /** How many segments are done. */
  completed: number;
  /** The segment you're on, shown in accent. */
  current?: number;
  className?: string;
}

/** Segmented progress for quiz sessions. One segment per question. */
export function SegmentedProgress({ total, completed, current, className }: SegmentedProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      aria-label={`Question ${Math.min(completed + 1, total)} of ${total}`}
      className={cn("flex w-full gap-1", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-pill transition-colors duration-200",
            i < completed ? "bg-mastery" : i === current ? "bg-accent" : "bg-white/10",
          )}
        />
      ))}
    </div>
  );
}
