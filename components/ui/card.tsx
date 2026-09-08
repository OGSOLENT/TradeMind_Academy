"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type CardLevel = "base" | "elevated" | "glass";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Elevation via "internal illumination" (DESIGN.md), not drop shadows:
   * base = Level 1, elevated = Level 2 + top-edge highlight, glass = Level 3
   * overlay.
   */
  level?: CardLevel;
  /** Adds hover lift + glow. Implies the card is a target. */
  interactive?: boolean;
  /**
   * A soft highlight that tracks the pointer across the surface, as though the
   * card were catching light from above. Off by default — it belongs on a
   * page's few feature surfaces, not on every box.
   */
  spotlight?: boolean;
}

/* Surfaces are translucent so the ambient field reads through the whole
   composition rather than only in the gutters — "layers separated by light and
   glass rather than heavy shadows" (DESIGN.md). Contrast is unaffected: the
   veils sit on #050507, so body text keeps well over 12:1. */
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

  return (
    <div
      ref={ref}
      className={cn(
        // `isolate` scopes the spotlight's negative z-index to this card.
        "relative isolate overflow-hidden rounded-card p-6",
        levels[level],
        interactive &&
          "cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-accent",
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
      {/* Negative z-index paints the glow above the card's own background but
          below its in-flow content, so no wrapper element is needed — a
          wrapper would break the flex layouts callers set on the card. */}
      {spotlight && (
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
      )}
      {children}
    </div>
  );
}
