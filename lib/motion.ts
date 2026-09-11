import type { Transition, Variants } from "framer-motion";

/**
 * Motion constants. This is the only file where animation magic numbers are
 * allowed to live, and everything else imports from here.
 *
 * The rules I set myself (docs/BUILD_PROMPT.md section 3):
 * - micro interactions sit in the 150 to 250ms band, panels in 300 to 500ms,
 *   and nothing on the landing page runs longer than 800ms
 * - entrances are a fade plus a 12 to 24px rise, staggered at 0.06, and I
 *   never stagger more than eight children
 * - every animation can be interrupted
 * - the emotional rule: gains overshoot on a spring, losses run slower and
 *   softer in amber. A wrong answer never flashes red and never shakes.
 * - reduced motion is handled at the call site with framer's
 *   useReducedMotion, and CSS transitions collapse globally in globals.css
 */

export const spring = {
  /** State changes, presses, toggles. */
  ui: { type: "spring", stiffness: 260, damping: 24 } as Transition,
  /** Mastery gains. I want a visible overshoot here. */
  gain: { type: "spring", stiffness: 300, damping: 18 } as Transition,
  /** Losses. Softer, slower, and no bounce at all. */
  loss: { type: "spring", stiffness: 170, damping: 26 } as Transition,
} as const;

export const ease = {
  /** The curve behind every choreographed entrance and exit. */
  choreo: [0.16, 1, 0.3, 1] as const,
};

export const duration = {
  micro: 0.2, // the 150 to 250ms band
  panel: 0.4, // the 300 to 500ms band
  setPiece: 0.8, // the landing page ceiling
} as const;

/** How far a pressable surface shrinks while it's held down. */
export const pressScale = 0.97;

export const stagger = {
  children: 0.06,
  /** Past this many children I stop staggering and batch the rest. */
  maxChildren: 8,
} as const;

/** The standard entrance: fade plus rise. The rise stays inside the 12 to 24px band. */
export const entrance: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.panel, ease: ease.choreo },
  },
};

/** A parent wrapper that staggers its `entrance` children. */
export const entranceStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: stagger.children } },
};

/** The reduced-motion version. Transforms collapse to a quick fade. */
export const entranceReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};
