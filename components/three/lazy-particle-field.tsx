"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useInView, useReducedMotion } from "framer-motion";
import type { ParticleFieldProps } from "./particle-field";

const ParticleField = dynamic(
  () => import("./particle-field").then((m) => m.ParticleField),
  { ssr: false },
);

/**
 * A particle field that knows when to stay out of the way.
 *
 * It only mounts once four things are true: the slot is on screen, the
 * browser has gone idle, the viewport is desktop-sized, and motion isn't
 * reduced. On a phone or under reduced motion nothing loads at all, and the
 * CSS ambient field underneath does the job on its own. That keeps three.js
 * off the dashboard's critical path, which matters because the perf gate on
 * that page is 85.
 */
export function LazyParticleField(props: ParticleFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px 10% 0px" });
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || !inView || reduced) return;
    if (window.innerWidth < 768) return;
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
  }, [inView, reduced, ready]);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {ready && <ParticleField {...props} />}
    </div>
  );
}
