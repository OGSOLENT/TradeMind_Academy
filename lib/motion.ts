import type { Transition, Variants } from "framer-motion";

export const spring = {
  /** State changes, presses, toggles. */
  ui: { type: "spring", stiffness: 260, damping: 24 } as Transition,
  gain: { type: "spring", stiffness: 300, damping: 18 } as Transition,
  loss: { type: "spring", stiffness: 170, damping: 26 } as Transition,
} as const;

export const ease = {
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
  maxChildren: 8,
} as const;

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

export const entranceReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};
