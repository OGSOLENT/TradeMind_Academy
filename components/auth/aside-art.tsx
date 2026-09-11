"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";

/**
 * The decorative panel beside the auth forms. A simulated price trace draws
 * itself in from left to right with a glowing tip, and three small readouts
 * fade up underneath it. It's purely visual, so the whole thing is hidden
 * from assistive tech. And it's all simulated, like everything else here.
 */

const W = 520;
const H = 220;

/* A hand-shaped path so it reads like a market and not like noise: a pullback
   early on, a dip, then a climb into the top right. */
const TRACE =
  "M 0 168 C 30 160, 44 120, 70 126 S 110 176, 138 160 S 172 92, 200 104 S 236 150, 262 138 " +
  "S 296 60, 326 74 S 360 128, 388 112 S 428 40, 458 52 S 500 28, 520 20";

const TIP = { x: 520, y: 20 };

export function AsideArt() {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none relative mx-auto w-full max-w-[520px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="tm-aside-trace" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--mastery-bright)" />
          </linearGradient>
          <linearGradient id="tm-aside-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mastery)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--mastery)" stopOpacity="0" />
          </linearGradient>
          <filter id="tm-aside-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Faint horizontal rules, the way a chart would have them. */}
        {[40, 90, 140, 190].map((y) => (
          <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}

        {/* The area under the trace, revealed with the line. */}
        <motion.path
          d={`${TRACE} L ${W} ${H} L 0 ${H} Z`}
          fill="url(#tm-aside-fill)"
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        />

        {/* A blurred copy under the trace gives it the glow. */}
        <motion.path
          d={TRACE}
          fill="none"
          stroke="url(#tm-aside-trace)"
          strokeWidth="8"
          strokeLinecap="round"
          filter="url(#tm-aside-glow)"
          opacity="0.45"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: ease.choreo, delay: 0.3 }}
        />
        <motion.path
          d={TRACE}
          fill="none"
          stroke="url(#tm-aside-trace)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: ease.choreo, delay: 0.3 }}
        />

        {/* The tip. Arrives with the line, then breathes. */}
        <motion.g
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: reduced ? 0 : 2.3 }}
          style={{ transformOrigin: `${TIP.x}px ${TIP.y}px` }}
        >
          <circle
            cx={TIP.x}
            cy={TIP.y}
            r="14"
            fill="var(--mastery)"
            opacity="0.25"
            filter="url(#tm-aside-glow)"
            className={reduced ? undefined : "tm-node-pulse"}
          />
          <circle cx={TIP.x} cy={TIP.y} r="4.5" fill="#fff" />
          <circle cx={TIP.x} cy={TIP.y} r="8" fill="none" stroke="var(--mastery-bright)" strokeWidth="1.5" opacity="0.8" />
        </motion.g>
      </svg>

      {/* Three readouts under the chart. */}
      <div className="num mt-6 grid grid-cols-3 gap-3 text-left">
        {[
          ["P(mastery)", "0.82", "text-mastery-bright"],
          ["next item", "hard", "text-accent-bright"],
          ["decisions", "1,402", "text-fg-primary"],
        ].map(([label, value, tone], i) => (
          <motion.div
            key={label}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ease.choreo, delay: reduced ? 0 : 1.9 + i * 0.08 }}
            className="rounded-control bg-white/[0.03] px-3 py-2.5 shadow-hairline"
          >
            <p className="text-[10px] uppercase tracking-wider text-fg-muted">{label}</p>
            <p className={`mt-0.5 text-sm ${tone}`}>{value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
