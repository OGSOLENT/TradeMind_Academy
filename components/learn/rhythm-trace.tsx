"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { journeyPath } from "@/lib/constellation";
import { ease } from "@/lib/motion";

const W = 520;
const H = 150;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sessions per week for the last eight weeks, drawn as a trace that writes
 * itself in from left to right with a glowing tip on the current week. It's
 * the sign-in panel's animation, except this one is your real rhythm.
 */
export function RhythmTrace({ sessionStarts }: { sessionStarts: number[] }) {
  const reduced = useReducedMotion();

  const { d, area, points, max } = useMemo(() => {
    const now = Date.now();
    const counts = Array.from({ length: 8 }, (_, i) => {
      const end = now - (7 - i) * WEEK_MS;
      const start = end - WEEK_MS;
      return sessionStarts.filter((t) => t > start && t <= end).length;
    });
    const max = Math.max(1, ...counts);
    const pad = 16;
    const points = counts.map((c, i) => ({
      x: pad + (i / 7) * (W - pad * 2),
      y: H - 22 - (c / max) * (H - 50),
      count: c,
    }));
    const ys = points.map((p) => p.y);
    const d = journeyPath(points, 0.5, { minY: Math.min(...ys), maxY: Math.max(...ys) });
    const last = points[points.length - 1]!;
    const first = points[0]!;
    return { d, area: `${d} L ${last.x} ${H} L ${first.x} ${H} Z`, points, max };
  }, [sessionStarts]);

  const tip = points[points.length - 1]!;
  const total = points.reduce((n, p) => n + p.count, 0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label={`${total} sessions in the last eight weeks`}>
        <defs>
          <linearGradient id="tm-rhythm-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--mastery-bright)" />
          </linearGradient>
          <linearGradient id="tm-rhythm-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--mastery)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--mastery)" stopOpacity="0" />
          </linearGradient>
          <filter id="tm-rhythm-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H - 22 - f * (H - 50)} y2={H - 22 - f * (H - 50)} stroke="rgba(255,255,255,0.05)" />
        ))}
        <motion.path
          d={area}
          fill="url(#tm-rhythm-fill)"
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke="url(#tm-rhythm-line)"
          strokeWidth="7"
          strokeLinecap="round"
          filter="url(#tm-rhythm-glow)"
          opacity="0.4"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: ease.choreo, delay: 0.3 }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke="url(#tm-rhythm-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: ease.choreo, delay: 0.3 }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.count > 0 ? 3 : 2}
            fill={p.count > 0 ? "var(--mastery-bright)" : "var(--fg-muted)"}
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: reduced ? 0 : 0.35 + i * 0.18 }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          />
        ))}
        <motion.g
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: reduced ? 0 : 1.75 }}
          style={{ transformOrigin: `${tip.x}px ${tip.y}px` }}
        >
          <circle cx={tip.x} cy={tip.y} r="12" fill="var(--mastery)" opacity="0.25" filter="url(#tm-rhythm-glow)" className={reduced ? undefined : "tm-node-pulse"} />
          <circle cx={tip.x} cy={tip.y} r="4" fill="#fff" />
          <circle cx={tip.x} cy={tip.y} r="7.5" fill="none" stroke="var(--mastery-bright)" strokeWidth="1.5" opacity="0.8" />
        </motion.g>
        {points.map((p, i) => (
          <text key={`l${i}`} x={p.x} y={H - 4} textAnchor="middle" className="num fill-[#5B5B6B] text-[9px]">
            {i === 7 ? "now" : `-${7 - i}w`}
          </text>
        ))}
      </svg>
      <p className="num absolute right-0 top-0 text-label-caps uppercase tracking-wider text-fg-muted">
        peak {max}/wk
      </p>
    </div>
  );
}
