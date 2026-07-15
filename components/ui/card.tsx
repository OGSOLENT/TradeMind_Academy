import { cn } from "@/lib/utils";

export type CardLevel = "base" | "elevated" | "glass";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Elevation via "internal illumination" (DESIGN.md), not drop shadows:
   * base = Level 1 (#0A0A0F + hairline), elevated = Level 2 (#101018 +
   * top-edge highlight), glass = Level 3 overlay (blur 20px).
   */
  level?: CardLevel;
  /** Adds hover lift + glow for interactive cards. */
  interactive?: boolean;
}

const levels: Record<CardLevel, string> = {
  base: "bg-bg-base shadow-hairline",
  elevated: "bg-bg-elevated shadow-edge-lit",
  glass: "surface-glass shadow-hairline",
};

export function Card({ level = "elevated", interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card p-6",
        levels[level],
        interactive &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-accent cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}
