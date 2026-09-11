import { cn } from "@/lib/utils";

export type PillTone = "neutral" | "accent" | "mastery" | "warning" | "danger";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  /** A little status dot in front of the text. */
  dot?: boolean;
}

const tones: Record<PillTone, string> = {
  neutral: "bg-white/5 text-fg-secondary",
  accent: "bg-accent/15 text-accent-bright",
  mastery: "bg-mastery/10 text-mastery-bright",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger-deep/40 text-danger",
};

const dots: Record<PillTone, string> = {
  neutral: "bg-fg-secondary",
  accent: "bg-accent-bright",
  mastery: "bg-mastery-bright",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** The pill-shaped tag (radius 999) for statuses, KC labels and "Live" chips. */
export function Pill({ tone = "neutral", dot = false, className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-label-caps uppercase tracking-wider",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-pill", dots[tone])} />}
      {children}
    </span>
  );
}
