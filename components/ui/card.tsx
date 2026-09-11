"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type CardLevel = "base" | "elevated" | "glass";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Elevation comes from "internal illumination" (DESIGN.md), not drop
   * shadows. base is level 1, elevated is level 2 with the top-edge highlight,
   * and glass is the level 3 overlay.
   */
  level?: CardLevel;
  /** Hover lift plus glow. It tells you the card is something you can click. */
  interactive?: boolean;
  /**
   * A soft highlight that follows the pointer across the surface, with the
   * card's edge catching the same light. Off by default. It belongs on a
   * page's few feature surfaces, not on every box.
   */
  spotlight?: boolean;
}

/* The surfaces are translucent on purpose, so the ambient field reads through
   the whole composition and not just the gutters. DESIGN.md calls it "layers
   separated by light and glass rather than heavy shadows". Contrast survives
   because the veils sit on #050507, and body text stays well above 12:1. */
const levels: Record<CardLevel, string> = {
  base: "bg-bg-base-veil shadow-hairline",
  elevated: "bg-bg-elevated-veil shadow-edge-lit",
  glass: "surface-glass shadow-hairline",
};

export function Card({
  level = "elevated",
  interactive = false,
  spotlight = false,
  className,
  children,
  onMouseMove,
  onMouseLeave,
  ...props
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState<{ x: number; y: number } | null>(null);

  // Scrolling moves the card out from under a still cursor without any
  // mouseleave firing, which left the spotlight lit at a stale spot. So a
  // scroll clears it. The listener only exists while a glow is showing.
  useEffect(() => {
    if (!glow) return;
    const clear = () => setGlow(null);
    window.addEventListener("scroll", clear, { passive: true });
    return () => window.removeEventListener("scroll", clear);
  }, [glow]);

  return (
    <div
      ref={ref}
      className={cn(
        // `isolate` keeps the spotlight's negative z-index inside this card.
        "relative isolate overflow-hidden rounded-card p-6",
        levels[level],
        interactive &&
          "cursor-pointer transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
      onMouseMove={(e) => {
        if (spotlight && ref.current) {
          const r = ref.current.getBoundingClientRect();
          setGlow({ x: e.clientX - r.left, y: e.clientY - r.top });
        }
        onMouseMove?.(e);
      }}
      onMouseLeave={(e) => {
        setGlow(null);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {/* Both layers paint at a negative z-index: above the card's own
          background, below its content. That way I don't need a wrapper
          element, and a wrapper would break the flex layouts callers put on
          the card. */}
      {spotlight && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500"
            style={{
              opacity: glow ? 1 : 0,
              background: glow
                ? `radial-gradient(420px circle at ${glow.x}px ${glow.y}px, rgba(94,106,210,0.16), transparent 62%)`
                : undefined,
            }}
          />
          {/* The edge glow. A 1px frame masked out of a radial gradient, so
              only the border near the pointer lights up. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 rounded-card transition-opacity duration-500"
            style={{
              opacity: glow ? 1 : 0,
              padding: 1,
              background: glow
                ? `radial-gradient(260px circle at ${glow.x}px ${glow.y}px, rgba(189,194,255,0.55), rgba(255,255,255,0.06) 70%)`
                : undefined,
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
            }}
          />
        </>
      )}
      {children}
    </div>
  );
}
