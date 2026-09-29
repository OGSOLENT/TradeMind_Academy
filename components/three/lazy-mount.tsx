"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useA11yPrefs } from "@/lib/a11y-prefs";
import { cn } from "@/lib/utils";

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
  const { calmMode } = useA11yPrefs();
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

  return (
    <div ref={ref} aria-hidden="true" className={cn("absolute inset-0", className)}>
      {ready && !calmMode && children}
    </div>
  );
}
