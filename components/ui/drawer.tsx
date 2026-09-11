"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

/**
 * A Vaul-style bottom sheet I built myself rather than pulling in another
 * dependency. It snaps at 40% and 90% of the viewport. You can drag between
 * the two, and dragging down past the lower snap (or flicking) dismisses it.
 * While it's open, anything marked `data-drawer-scale` (the app shell) is
 * scaled back to 0.97 so the page feels like it's sitting behind the sheet.
 */

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Fractions of the viewport height, lowest first. */
  snapPoints?: [number, number];
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  snapPoints = [0.4, 0.9],
  className,
}: DrawerProps) {
  const reduced = useReducedMotion();
  const [snap, setSnap] = useState(0); // an index into snapPoints
  const [viewportH, setViewportH] = useState(0);

  useEffect(() => {
    const measure = () => setViewportH(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The depth effect on the shell behind the sheet.
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>("[data-drawer-scale]");
    if (!shell) return;
    shell.style.transition = "transform 300ms cubic-bezier(0.16,1,0.3,1)";
    shell.style.transform = open && !reduced ? "scale(0.97)" : "";
    return () => {
      shell.style.transform = "";
    };
  }, [open, reduced]);

  useEffect(() => {
    if (open) setSnap(0);
  }, [open]);

  const maxSnap = snapPoints[snapPoints.length - 1] as number;
  const sheetH = viewportH * maxSnap;
  // How far down from fully open the sheet sits at a given snap.
  const yFor = (index: number) => sheetH - viewportH * (snapPoints[index] as number);

  return (
    <AnimatePresence>
      {open && viewportH > 0 && (
        <div className="fixed inset-0 z-40">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: sheetH }}
            animate={{ y: yFor(snap) }}
            exit={{ y: sheetH, transition: { duration: 0.25 } }}
            transition={reduced ? { duration: 0.15 } : spring.ui}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: sheetH }}
            dragElastic={{ top: 0.05, bottom: 0.2 }}
            onDragEnd={(_, info) => {
              const y = yFor(snap) + info.offset.y;
              const flickDown = info.velocity.y > 600;
              const flickUp = info.velocity.y < -600;
              if (flickDown && snap === 0) return onClose();
              if (flickDown) return setSnap(0);
              if (flickUp) return setSnap(snapPoints.length - 1);
              // Otherwise settle on the nearest snap, or close if it's been
              // dragged well below the lowest one.
              const positions = snapPoints.map((_, i) => yFor(i));
              const lowest = positions[0] as number;
              if (y > lowest + viewportH * 0.12) return onClose();
              let nearest = 0;
              for (let i = 1; i < positions.length; i++) {
                if (Math.abs(y - (positions[i] as number)) < Math.abs(y - (positions[nearest] as number))) nearest = i;
              }
              setSnap(nearest);
            }}
            className={cn(
              "absolute inset-x-0 bottom-0 flex flex-col rounded-t-card bg-bg-elevated shadow-edge-lit",
              className,
            )}
            style={{ height: sheetH, touchAction: "none" }}
          >
            <div className="flex justify-center py-3" aria-hidden="true">
              <div className="h-1 w-10 rounded-pill bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-headline-md text-fg-primary">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="rounded p-1.5 text-fg-muted transition-colors hover:text-fg-primary"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
