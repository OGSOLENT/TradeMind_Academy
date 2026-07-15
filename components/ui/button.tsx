"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { pressScale, spring } from "@/lib/motion";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "glass";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction without greying out like disabled. */
  loading?: boolean;
  /** Success confirmation state (e.g. after a save) — mastery teal. */
  success?: boolean;
}

const base =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-control font-medium " +
  "transition-colors duration-200 focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none " +
  "disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  // Inner top-edge highlight + glow on hover, per landing prototype .btn-primary
  primary:
    "bg-accent text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] " +
    "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_0_20px_var(--accent-glow)]",
  secondary:
    "bg-bg-elevated text-fg-primary shadow-hairline hover:bg-[#16161f] hover:text-white",
  ghost: "bg-transparent text-fg-secondary hover:bg-white/5 hover:text-fg-primary",
  danger:
    "bg-danger-deep/40 text-danger shadow-[inset_0_0_0_1px_rgba(255,180,171,0.25)] " +
    "hover:bg-danger-deep/60",
  glass: "surface-glass text-fg-primary shadow-hairline hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm", // 44px — minimum touch target
  lg: "h-12 px-7 text-body-base",
};

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Design-system button. Five variants (primary/secondary/ghost/danger/glass)
 * × seven states (default, hover, active @ scale 0.97, focus-visible,
 * disabled, loading, success).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, success = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: pressScale }}
      transition={spring.ui}
      className={cn(
        base,
        success ? "bg-mastery/15 text-mastery shadow-[inset_0_0_0_1px_var(--mastery-glow)]" : variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </motion.button>
  );
});
