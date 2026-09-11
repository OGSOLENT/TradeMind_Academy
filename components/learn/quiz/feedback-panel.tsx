"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

interface FeedbackPanelProps {
  correct: boolean;
  explanation: string;
  lessonHref: string;
  onContinue(): void;
  isLast: boolean;
}

/**
 * The feedback after an answer. A tick or a cross draws itself in, then a
 * one-line why and a link back to the lesson. Wrong answers are amber and
 * calm. Never red, never shaking (section 3).
 */
export function FeedbackPanel({ correct, explanation, lessonHref, onContinue, isLast }: FeedbackPanelProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: ease.choreo }}
      className={cn(
        "rounded-card p-5 shadow-edge-lit",
        correct ? "bg-mastery/10" : "bg-warning/10",
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle
            cx="14"
            cy="14"
            r="12"
            stroke={correct ? "var(--mastery)" : "var(--warning)"}
            strokeWidth="2"
            opacity="0.4"
          />
          <motion.path
            d={correct ? "M8 14.5l4 4 8-9" : "M9.5 9.5l9 9M18.5 9.5l-9 9"}
            stroke={correct ? "var(--mastery)" : "var(--warning)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: ease.choreo }}
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium", correct ? "text-mastery-bright" : "text-warning")}>
            {correct ? "Correct" : "Not quite"}
          </p>
          <p className="mt-1 text-sm leading-6 text-fg-secondary">{explanation}</p>
          {!correct && (
            <Link href={lessonHref} className="mt-2 inline-block text-sm text-accent-bright hover:underline">
              Review the lesson →
            </Link>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <span className="hidden items-center gap-1.5 text-xs text-fg-muted sm:flex">
          <Kbd>↵ Enter</Kbd>
        </span>
        <Button onClick={onContinue} variant={correct ? "primary" : "secondary"}>
          {isLast ? "Finish session" : "Continue"}
        </Button>
      </div>
    </motion.div>
  );
}
