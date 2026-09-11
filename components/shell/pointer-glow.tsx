"use client";

import { useEffect, useRef } from "react";

/**
 * A soft pool of light that follows the pointer across the page. It's one
 * fixed element moved with a transform, so it costs nothing, and it lerps
 * toward the cursor rather than snapping so it feels like it has weight.
 * Off on touch devices (no pointer to follow) and under reduced motion.
 */
export function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.dataset.motion === "reduced") return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.4;
    let x = tx;
    let y = ty;
    let raf = 0;
    let visible = false;

    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`;
      if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = "1";
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 h-[600px] w-[600px] rounded-pill opacity-0 transition-opacity duration-700"
      style={{
        background:
          "radial-gradient(circle, rgba(94,106,210,0.13) 0%, rgba(45,212,191,0.05) 35%, transparent 65%)",
        willChange: "transform",
      }}
    />
  );
}
