"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrainMark } from "./brain-mark";

/**
 * The wordmark plus the brain mark. "Mind" carries the gradient so the type
 * and the mark share a palette, and hovering the whole thing wakes the mark
 * up: the halo comes on and the nodes swell slightly.
 */
export function Logo({ className, animate = true }: { className?: string; animate?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5 text-fg-primary", className)}>
      <BrainMark size={30} animate={animate} />
      <span className="text-lg font-semibold tracking-tight">
        Trade<span className="text-gradient">Mind</span>
        <span className="ml-1.5 text-label-caps uppercase tracking-widest text-fg-secondary">
          Academy
        </span>
      </span>
    </Link>
  );
}
