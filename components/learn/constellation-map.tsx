"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Kc } from "@/lib/content/types";
import { CANVAS, journeyPath, layoutPositions, orderByChain } from "@/lib/constellation";
import { cn } from "@/lib/utils";

export type { NodeState } from "@/lib/routing";
import type { NodeState } from "@/lib/routing";

export interface KcView extends Kc {
  pL: number;
  attempts: number;
  state: NodeState;
}

const R = 30;

const TONE: Record<NodeState, string> = {
  mastered: "var(--mastery)",
  remediation: "var(--warning)",
  available: "var(--accent)",
  locked: "#3a3a48",
};

/**
 * The skill constellation, drawn as a climb rather than a scatter.
 *
 * One spline runs through all the modules in curriculum order. A dim track
 * shows the whole route, and a bright path on top is clipped to the learner's
 * overall progress, with a travelling light at its head and energy flowing
 * along the stretch they've already covered. So mastery shows up as distance
 * travelled, which is the thing the BKT model is actually estimating.
 *
 * The motion is deliberately local. A handful of small SVG elements, not
 * full-screen layers, and I measured it as cheap (docs/DECISIONS.md).
 */
export function ConstellationMap({
  views,
  justUnlocked,
  selectedId,
  onSelect,
}: {
  views: KcView[];
  justUnlocked: string[];
  selectedId: string | null;
  onSelect: (kc: KcView) => void;
}) {
  const reduced = useReducedMotion();
  const trackRef = useRef<SVGPathElement>(null);
  const [traveller, setTraveller] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const ordered = useMemo(() => orderByChain(views), [views]);
  const points = useMemo(() => {
    const layout = layoutPositions(ordered.map((kc) => kc.id));
    return ordered.map((kc) => layout[kc.id]!);
  }, [ordered]);
  const path = useMemo(() => journeyPath(points), [points]);

  /** Overall progress along the route. It's the mean mastery across every module. */
  const progress = useMemo(() => {
    if (ordered.length === 0) return 0;
    return ordered.reduce((n, kc) => n + kc.pL, 0) / ordered.length;
  }, [ordered]);

  // Put the travelling light exactly on the spline, at the progress point.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    const pt = el.getPointAtLength(len * progress);
    setTraveller({ x: pt.x, y: pt.y });
  }, [progress, path]);

  return (
    <svg
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      className="h-full w-full"
      role="group"
      aria-label="Skill tree constellation"
    >
      <defs>
        <radialGradient id="tm-node-core">
          <stop offset="0%" stopColor="#171722" />
          <stop offset="100%" stopColor="#0b0b12" />
        </radialGradient>
        <linearGradient id="tm-route" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--mastery)" />
          <stop offset="55%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="#8b7cf6" />
        </linearGradient>
        <filter id="tm-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* A faint field of stars behind the route, for depth. */}
      <g className="tm-const-stars" aria-hidden="true">
        {Array.from({ length: 46 }, (_, i) => {
          const x = ((i * 79) % 97) / 97;
          const y = ((i * 131) % 89) / 89;
          return (
            <circle
              key={i}
              cx={x * CANVAS.width}
              cy={y * CANVAS.height}
              r={i % 7 === 0 ? 1.5 : 0.9}
              fill="#ffffff"
              opacity={i % 5 === 0 ? 0.16 : 0.07}
            />
          );
        })}
      </g>

      {/* The whole route, unlit. */}
      <path
        ref={trackRef}
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Distance covered. pathLength=1 normalises the dash maths, so it doesn't
          matter how long the spline actually is. */}
      <motion.path
        d={path}
        fill="none"
        stroke="url(#tm-route)"
        strokeWidth="4"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        initial={false}
        animate={{ strokeDashoffset: 1 - progress }}
        transition={reduced ? { duration: 0.15 } : { duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        opacity={0.95}
      />
      {/* The glow underneath the covered stretch. */}
      <motion.path
        d={path}
        fill="none"
        stroke="url(#tm-route)"
        strokeWidth="10"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        filter="url(#tm-soft)"
        initial={false}
        animate={{ strokeDashoffset: 1 - progress }}
        transition={reduced ? { duration: 0.15 } : { duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        opacity={0.35}
      />

      {/* Energy flowing forward along the covered stretch. It's what gives
          the sense of travelling from one level to the next. */}
      {!reduced && progress > 0.01 && (
        <path
          className="tm-route-flow"
          d={path}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.012 0.055"
          style={{ clipPath: "none" }}
          opacity={0.5}
        />
      )}

      {/* Where the learner is on the route right now. */}
      {traveller && progress > 0.005 && (
        <g className={reduced ? undefined : "tm-traveller"}>
          <circle cx={traveller.x} cy={traveller.y} r="13" fill="var(--accent)" opacity="0.25" filter="url(#tm-soft)" />
          <circle cx={traveller.x} cy={traveller.y} r="5" fill="#ffffff" />
          <circle cx={traveller.x} cy={traveller.y} r="9" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" opacity="0.8" />
        </g>
      )}

      {/* The nodes */}
      {ordered.map((kc, i) => {
        const pos = points[i]!;
        const isNew = justUnlocked.includes(kc.id);
        const tone = TONE[kc.state];
        const active = hovered === kc.id || selectedId === kc.id;
        const locked = kc.state === "locked";
        const dense = ordered.length > 9;
        const flip = dense && i % 2 === 1;

        return (
          <motion.g
            key={kc.id}
            role="button"
            aria-label={`${kc.title}: ${kc.state}, ${Math.round(kc.pL * 100)} percent mastery`}
            tabIndex={0}
            className={cn(
              "cursor-pointer focus:outline-none",
              !reduced && "tm-node-float",
            )}
            style={{
              transformOrigin: `${pos.x}px ${pos.y}px`,
              animationDelay: `${i * 0.7}s`,
            }}
            onClick={() => onSelect(kc)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(kc)}
            onMouseEnter={() => setHovered(kc.id)}
            onMouseLeave={() => setHovered(null)}
            initial={isNew && !reduced ? { scale: 0.2, opacity: 0 } : false}
            animate={{ scale: active ? 1.08 : 1, opacity: locked ? 0.55 : 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: isNew ? 0.9 : 0 }}
          >
            {/* The halo. It breathes while this module is the live frontier. */}
            {kc.state === "available" && !reduced && (
              <circle
                className="tm-node-pulse"
                cx={pos.x}
                cy={pos.y}
                r={R + 12}
                fill="var(--accent)"
                opacity="0.16"
                filter="url(#tm-soft)"
              />
            )}
            {kc.state === "mastered" && (
              <circle cx={pos.x} cy={pos.y} r={R + 10} fill="var(--mastery)" opacity="0.14" filter="url(#tm-soft)" />
            )}
            {kc.state === "remediation" && !reduced && (
              <circle className="tm-node-pulse" cx={pos.x} cy={pos.y} r={R + 11} fill="var(--warning)" opacity="0.16" filter="url(#tm-soft)" />
            )}

            {/* The core disc and the track ring */}
            <circle cx={pos.x} cy={pos.y} r={R} fill="url(#tm-node-core)" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
            <circle cx={pos.x} cy={pos.y} r={R - 5} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />

            {/* The mastery arc */}
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r={R - 5}
              fill="none"
              stroke={tone}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * (R - 5)}
              transform={`rotate(-90 ${pos.x} ${pos.y})`}
              initial={false}
              animate={{ strokeDashoffset: 2 * Math.PI * (R - 5) * (1 - kc.pL) }}
              transition={reduced ? { duration: 0.15 } : { duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.06 }}
            />

            {/* The centre glyph */}
            {locked ? (
              <g opacity="0.85">
                <rect x={pos.x - 6} y={pos.y - 2} width="12" height="10" rx="2" fill="#6b6b7d" />
                <path d={`M ${pos.x - 3.5} ${pos.y - 2} v -3 a 3.5 3.5 0 0 1 7 0 v 3`} fill="none" stroke="#6b6b7d" strokeWidth="1.8" />
              </g>
            ) : kc.state === "mastered" ? (
              <path
                d={`M ${pos.x - 7} ${pos.y} l 5 5 l 9 -10`}
                fill="none"
                stroke="var(--mastery)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="num fill-[#E4E1ED] text-[14px] font-medium">
                {Math.round(kc.pL * 100)}
              </text>
            )}

            {/* The step number and the title. With many nodes the labels
                alternate sides so neighbours don't collide. */}
            <text
              x={pos.x}
              y={flip ? pos.y + R + 18 : pos.y - R - 10}
              textAnchor="middle"
              className="num fill-[#5B5B6B] text-[10px]"
              style={{ letterSpacing: "0.12em" }}
            >
              {String(i + 1).padStart(2, "0")}
            </text>
            <text
              x={pos.x}
              y={flip ? pos.y - R - 12 : pos.y + R + 20}
              textAnchor="middle"
              className={cn(dense ? "text-[11px]" : "text-[12px]", active ? "fill-[#E4E1ED]" : "fill-[#908F9E]")}
            >
              {kc.title}
            </text>

            {/* The unlock burst */}
            {isNew &&
              !reduced &&
              Array.from({ length: 14 }, (_, pi) => (
                <motion.circle
                  key={pi}
                  cx={pos.x}
                  cy={pos.y}
                  r={2.5}
                  fill="var(--accent-bright)"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    cx: pos.x + Math.cos((pi / 14) * Math.PI * 2) * 58,
                    cy: pos.y + Math.sin((pi / 14) * Math.PI * 2) * 58,
                  }}
                  transition={{ duration: 0.95, delay: 1.1, ease: "easeOut" }}
                />
              ))}
          </motion.g>
        );
      })}
    </svg>
  );
}
