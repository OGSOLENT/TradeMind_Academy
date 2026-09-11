"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Mounts its children only once four things are true: the slot is on
 * screen, the browser has gone idle, the viewport is at least `minWidth`
 * wide, and motion isn't reduced (unless `allowReduced`). The three.js
 * pieces all sit behind this, which keeps them off the dashboard's critical
 * path. The perf gate on that page is 85, so it matters.
 */
export function LazyMount({
  children,
  minWidth = 768,
  allowReduced = false,
  className,
}: {
  children: React.ReactNode;
  minWidth?: number;
  allowReduced?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px 10% 0px" });
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || !inView) return;
    if (reduced && !allowReduced) return;
    if (window.innerWidth < minWidth) return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    let cancelled = false;
    const go = () => {
      if (!cancelled) setReady(true);
    };
    const handle = idle ? idle(go) : window.setTimeout(go, 400);
    return () => {
      cancelled = true;
      if (!idle) window.clearTimeout(handle as number);
    };
  }, [inView, reduced, ready, minWidth, allowReduced]);

  // Everything mounted through here is decoration. The accessible version
  // of the information always lives in ordinary DOM beside it.
  return (
    <div ref={ref} aria-hidden="true" className={cn("absolute inset-0", className)}>
      {ready && children}
    </div>
  );
}
