"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

/**
 * Wordmark + candlestick glyph. Per DESIGN.md, the wick animates its height
 * on load — "symbolizing growth and data precision".
 */
export function Logo({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 text-fg-primary", className)}>
      <span className="relative flex h-6 w-6 items-center justify-center" aria-hidden="true">
        <motion.span
          className="h-full w-1 rounded-pill bg-mastery"
          initial={reduced ? false : { scaleY: 0.2 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: ease.choreo }}
        />
        <span className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-sm bg-mastery" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        TradeMind
        <span className="ml-1.5 text-label-caps uppercase tracking-widest text-fg-secondary">
          Academy
        </span>
      </span>
    </Link>
  );
}
