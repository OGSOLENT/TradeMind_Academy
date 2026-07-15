import { cn } from "@/lib/utils";

/** Keyboard-hint chip, e.g. quiz shortcuts 1–4 / Enter. */
export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "num inline-flex h-5 min-w-5 items-center justify-center rounded px-1.5 text-[11px]",
        "bg-white/5 text-fg-secondary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
      {...props}
    />
  );
}
