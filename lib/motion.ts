import type { Transition, Variants } from "framer-motion";

/**
 * Motion constants — the only place animation magic numbers may live.
 *
 * Rules (docs/BUILD_PROMPT.md §3):
 * - micro interactions 150–250ms, panels 300–500ms, landing set-pieces ≤800ms
 * - entrances are fade + 12–24px rise, stagger 0.06, max 8 staggered children
 * - all animations interruptible
 * - emotional rule: gains overshoot (spring), losses run slower/softer in amber;
 *   wrong answers never flash red, never shake
 * - prefers-reduced-motion: use framer's useReducedMotion at call sites; CSS
 *   transitions collapse globally in globals.css
 */

export const spring = {
  /** State changes, presses, toggles. */
  ui: { type: "spring", stiffness: 260, damping: 24 } as Transition,
  /** Mastery gains — visible overshoot. */
  gain: { type: "spring", stiffness: 300, damping: 18 } as Transition,
  /** Losses — softer, slower, no bounce. */
  loss: { type: "spring", stiffness: 170, damping: 26 } as Transition,
} as const;

export const ease = {
  /** Choreographed entrances/exits. */
  choreo: [0.16, 1, 0.3, 1] as const,
};

export const duration = {
  micro: 0.2, // 150–250ms band
  panel: 0.4, // 300–500ms band
  setPiece: 0.8, // landing ceiling
} as const;

/** Scale applied to pressable surfaces while active. */
export const pressScale = 0.97;

export const stagger = {
  children: 0.06,
  /** Never stagger more than this many children; batch the rest. */
  maxChildren: 8,
} as const;

/** Standard entrance: fade + rise. Rise stays within the 12–24px band. */
export const entrance: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.panel, ease: ease.choreo },
  },
};

/** Parent wrapper that staggers `entrance` children. */
export const entranceStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: stagger.children } },
};

/** Reduced-motion variant: transforms collapse to a fast fade. */
export const entranceReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};
