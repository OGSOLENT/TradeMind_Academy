"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { create } from "zustand";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

/**
 * A Sonner-style toast stack that I built in-house rather than adding a
 * dependency. Four variants, auto-dismiss after four seconds, swipe right to
 * dismiss, newest on top. Failed response-log flushes surface through this
 * (guardrail 7.2), which is why the store lives at module scope: `toast()`
 * has to be callable from code that isn't React.
 */

export type ToastVariant = "default" | "success" | "warning" | "danger";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE = 4;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [{ ...t, id }, ...s.toasts].slice(0, MAX_VISIBLE) }));
    setTimeout(() => {
      useToastStore.getState().dismiss(id);
    }, AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** The imperative API: toast({ title: "Saved", variant: "success" }) */
export function toast(t: { title: string; description?: string; variant?: ToastVariant }) {
  useToastStore.getState().push({ variant: "default", ...t });
}

const variantStyles: Record<ToastVariant, { bar: string; icon: string }> = {
  default: { bar: "bg-accent", icon: "text-accent-bright" },
  success: { bar: "bg-mastery", icon: "text-mastery-bright" },
  warning: { bar: "bg-warning", icon: "text-warning" },
  danger: { bar: "bg-danger", icon: "text-danger" },
};

/** Mount this once, in the root layout. */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  const reduced = useReducedMotion();

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            role="status"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: reduced ? 0 : 80, transition: { duration: 0.15 } }}
            transition={spring.ui}
            drag={reduced ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 90 || info.velocity.x > 500) dismiss(t.id);
            }}
            className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-card bg-bg-elevated p-4 shadow-lift"
          >
            <span className={cn("absolute inset-y-0 left-0 w-0.5", variantStyles[t.variant].bar)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg-primary">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-fg-secondary">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded p-1 text-fg-muted transition-colors hover:text-fg-primary"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {/* A thin line along the bottom that drains as the toast's time
                runs out, so you know it's about to leave. */}
            <motion.span
              aria-hidden="true"
              className={cn("absolute bottom-0 left-0 h-px w-full origin-left opacity-50", variantStyles[t.variant].bar)}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
