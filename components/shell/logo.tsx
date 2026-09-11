"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

/**
 * The wordmark plus the candlestick glyph. DESIGN.md wants the wick to grow
 * into place on load ("symbolising growth and data precision"), so it does.
 * Hovering the logo nudges the wick up again, which is a tiny thing but it
 * makes the mark feel like it's alive rather than pasted on.
 */
export function Logo({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5 text-fg-primary", className)}>
      <span className="relative flex h-6 w-6 items-center justify-center" aria-hidden="true">
        <motion.span
          className="h-full w-1 origin-bottom rounded-pill bg-mastery transition-transform duration-300 ease-out group-hover:scale-y-110 group-hover:shadow-[0_0_10px_var(--mastery-glow)]"
          initial={reduced ? false : { scaleY: 0.2 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: ease.choreo }}
        />
        <span className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-sm bg-mastery transition-transform duration-300 ease-out group-hover:-translate-y-[60%]" />
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
