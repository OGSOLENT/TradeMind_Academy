"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type CardLevel = "base" | "elevated" | "glass";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: CardLevel;
  interactive?: boolean;
  spotlight?: boolean;
}

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
