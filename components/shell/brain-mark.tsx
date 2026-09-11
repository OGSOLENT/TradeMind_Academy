"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";

/**
 * The mark. A brain seen from the front, with a candlestick standing in for
 * the fissure between the hemispheres and a few neural links in each lobe.
 * Trading and the mind in one shape, which is the whole idea of the product.
 *
 * On first render the outline draws itself in, the nodes pop on a stagger
 * and the candle body scales up last. Under reduced motion it just appears.
 * The gradient ids are unique per instance so several marks can sit on one
 * page without their defs colliding.
 */

/** The brain silhouette, drawn once here and reused by the favicon. */
export const BRAIN_PATH =
  "M32 16 C30 12 24 11 21 14 C17 12 12 15 13 20 C9 21 8 27 11 30 C8 34 10 40 15 41 C15 46 21 49 26 46 C28 49 31 49 32 47 C33 49 36 49 38 46 C43 49 49 46 49 41 C54 40 56 34 53 30 C56 27 55 21 51 20 C52 15 47 12 43 14 C40 11 34 12 32 16 Z";

const NODES: Array<[number, number]> = [
  [21, 23],
  [18, 33],
  [23, 42],
  [43, 23],
  [46, 33],
  [41, 42],
];
const LINKS = "M28 27 L21 23 M28 37 L18 33 M28 37 L23 42 M36 27 L43 23 M36 37 L46 33 M36 37 L41 42";

export function BrainMark({
  size = 28,
  animate = true,
  className,
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const still = reduced || !animate;
  const grad = `url(#${id}-g)`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#44e2cd" />
          <stop offset="100%" stopColor="#7f8cf0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* A soft halo behind the outline. It brightens on hover through the
          parent's group class. */}
      <path
        d={BRAIN_PATH}
        stroke={grad}
        strokeWidth="4"
        strokeLinejoin="round"
        filter={`url(#${id}-glow)`}
        className="opacity-0 transition-opacity duration-500 group-hover:opacity-70"
      />

      <motion.path
        d={BRAIN_PATH}
        stroke={grad}
        strokeWidth="2.4"
        strokeLinejoin="round"
        initial={still ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: ease.choreo }}
      />

      <motion.path
        d={LINKS}
        stroke={grad}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.75"
        initial={still ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: ease.choreo, delay: still ? 0 : 0.7 }}
      />

      {NODES.map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r="2.1"
          fill={grad}
          initial={still ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 16, delay: still ? 0 : 0.85 + i * 0.06 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          className="transition-[r] duration-300 group-hover:[r:2.6]"
        />
      ))}

      {/* The candle. Its wick is the fissure between the hemispheres. */}
      <motion.line
        x1="32"
        y1="16"
        x2="32"
        y2="47"
        stroke="#e4e1ed"
        strokeWidth="2.2"
        strokeLinecap="round"
        initial={still ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: ease.choreo, delay: still ? 0 : 0.35 }}
      />
      <motion.rect
        x="28"
        y="26"
        width="8"
        height="12"
        rx="2.2"
        fill="#2dd4bf"
        initial={still ? { scaleY: 1 } : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: still ? 0 : 1.05 }}
        style={{ transformOrigin: "32px 32px" }}
        className="transition-[filter] duration-500 group-hover:[filter:drop-shadow(0_0_6px_var(--mastery-glow))]"
      />
    </svg>
  );
}
