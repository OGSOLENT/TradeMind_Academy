"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MasteryRing } from "@/components/ui/mastery-ring";

interface MasteryCelebrationProps {
  kcTitle: string;
  onDone(): void;
}

/**
 * THE one big ceremony (mastery_celebration_review). The background dims by
 * 20%, the ring sweeps to full, about forty particles burst, and it dismisses
 * itself after two seconds. Under reduced motion it's a plain 150ms fade with
 * no particles at all.
 */
export function MasteryCelebration({ kcTitle, onDone }: MasteryCelebrationProps) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 250);
    }, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        angle: (i / 40) * Math.PI * 2,
        distance: 90 + (i % 5) * 28,
        size: 3 + (i % 3) * 2,
        delay: (i % 8) * 0.02,
      })),
    [],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-label={`${kcTitle} mastered`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
        >
          <div className="relative flex flex-col items-center">
            {!reduced &&
              particles.map((p, i) => (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className="absolute rounded-pill bg-mastery"
                  style={{ width: p.size, height: p.size, top: "40%", left: "50%" }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(p.angle) * p.distance,
                    y: Math.sin(p.angle) * p.distance,
                    opacity: 0,
                    scale: 0.4,
                  }}
                  transition={{ duration: 1.1, delay: 0.25 + p.delay, ease: "easeOut" }}
                />
              ))}
            <MasteryRing value={1} size="lg" tone="mastery" />
            <motion.p
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-6 text-headline-md text-fg-primary"
            >
              {kcTitle} mastered
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
