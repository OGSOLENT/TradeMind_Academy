"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Kc } from "@/lib/content/types";
import { CANVAS, positionFor } from "@/lib/constellation";
import { Button } from "@/components/ui/button";
import { ease, stagger } from "@/lib/motion";

interface ConstellationInitProps {
  kcs: Kc[];
  /** Starting pL per KC (from placement initialisation). */
  mastery: Record<string, number>;
  onContinue(): void;
}

const R = 22;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * The model-initialization moment: the constellation assembles from
 * particles, each node fills its ring to the starting pL with 0.06 stagger.
 * Skippable; reduced-motion renders the final frame.
 */
export function ConstellationInit({ kcs, mastery, onContinue }: ConstellationInitProps) {
  const reduced = useReducedMotion();
  const ordered = [...kcs].sort((a, b) => a.prereqIds.length - b.prereqIds.length);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg-deep px-4">
      <svg
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        className="w-full max-w-3xl"
        role="img"
        aria-label={`Your starting knowledge map: ${ordered
          .map((kc) => `${kc.title} ${Math.round((mastery[kc.id] ?? 0) * 100)} percent`)
          .join(", ")}`}
      >
        {/* Edges draw in first */}
        {ordered.map((kc) =>
          kc.prereqIds.map((p, j) => {
            const a = positionFor(p, 0);
            const b = positionFor(kc.id, 0);
            return (
              <motion.line
                key={`${p}-${kc.id}-${j}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: ease.choreo, delay: 0.2 }}
              />
            );
          }),
        )}
        {ordered.map((kc, i) => {
          const pos = positionFor(kc.id, i);
          const pL = mastery[kc.id] ?? 0;
          const delay = reduced ? 0 : 0.4 + i * stagger.children;
          return (
            <motion.g
              key={kc.id}
              initial={
                reduced
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 0.3, x: (i % 2 ? 60 : -60), y: 40 }
              }
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              <circle cx={pos.x} cy={pos.y} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={R}
                fill="none"
                stroke="var(--mastery)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                transform={`rotate(-90 ${pos.x} ${pos.y})`}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - pL) }}
                transition={{ duration: reduced ? 0.1 : 0.8, ease: ease.choreo, delay: delay + 0.2 }}
              />
              <circle cx={pos.x} cy={pos.y} r={4} fill="var(--accent-bright)" />
              <text
                x={pos.x}
                y={pos.y + R + 18}
                textAnchor="middle"
                className="fill-[#908F9E] text-[11px]"
              >
                {kc.title}
              </text>
              <text
                x={pos.x}
                y={pos.y - R - 8}
                textAnchor="middle"
                className="num fill-[#44E2CD] text-[11px]"
              >
                {Math.round(pL * 100)}%
              </text>
            </motion.g>
          );
        })}
      </svg>

      <motion.p
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 1.2, duration: 0.4, ease: ease.choreo }}
        className="mt-6 text-headline-md text-fg-primary"
      >
        Your starting map.
      </motion.p>
      <p className="mt-2 max-w-md text-center text-sm text-fg-secondary">
        The tutor estimated where you&apos;re starting from. Every answer you
        give refines it.
      </p>
      <Button onClick={onContinue} className="mt-8">
        Continue to dashboard
      </Button>
    </div>
  );
}
