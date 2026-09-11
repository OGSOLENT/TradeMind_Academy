"use client";

import { Children, isValidElement } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { ease, stagger } from "@/lib/motion";

/**
 * Page entrance choreography.
 *
 * The design system says entrances are "fade plus a 12 to 24px rise, stagger
 * 0.06, max 8 children" (section 3). This is that rule made reusable, so
 * every page opens the same way instead of snapping into place.
 *
 * Under reduced motion the rise collapses to a 150ms fade with no stagger.
 * Content still arrives, nothing travels.
 */

export function Stagger({
  children,
  className,
  delay = 0,
  autoWrap = true,
  ...props
}: { delay?: number; autoWrap?: boolean; children?: React.ReactNode } & Omit<
  HTMLMotionProps<"div">,
  "children"
>) {
  const reduced = useReducedMotion();

  // Variants only propagate to child *motion* components, so by default I
  // wrap each direct child in a StaggerItem. Callers that already wrap their
  // own children (the dashboard, which needs layout classes on the items)
  // pass autoWrap={false}.
  const content = autoWrap
    ? Children.map(children, (child) =>
        isValidElement(child) ? <StaggerItem>{child}</StaggerItem> : child,
      )
    : children;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: reduced
            ? { duration: 0.15 }
            : { staggerChildren: stagger.children, delayChildren: delay },
        },
      }}
      className={className}
      {...props}
    >
      {content}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  rise = 18,
  ...props
}: { rise?: number; children?: React.ReactNode } & Omit<HTMLMotionProps<"div">, "children">) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reduced ? { opacity: 0 } : { opacity: 0, y: rise },
        visible: {
          opacity: 1,
          y: 0,
          transition: reduced
            ? { duration: 0.15 }
            : { duration: 0.5, ease: ease.choreo },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * A scroll-triggered reveal for long reading columns (lessons, legal, the
 * landing page). It fires once, when the block is a little way into the
 * viewport.
 */
export function Reveal({
  children,
  className,
  rise = 16,
  ...props
}: { rise?: number; children?: React.ReactNode } & Omit<HTMLMotionProps<"div">, "children">) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={reduced ? { duration: 0.15 } : { duration: 0.55, ease: ease.choreo }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
