import { cn } from "@/lib/utils";

/** Loading placeholder with a subtle shimmer sweep. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-control bg-white/5",
        "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)] bg-[length:400px_100%] bg-no-repeat",
        className,
      )}
      {...props}
    />
  );
}
