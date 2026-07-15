import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { Pill } from "@/components/ui/pill";

/**
 * Placeholder home — the full landing (three.js hero, GSAP choreography)
 * is Phase 6. The ethics banner is here from day one (guardrail §7.1).
 */
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Logo />
      <Pill tone="warning" dot>
        Educational simulation only
      </Pill>
      <p className="max-w-md text-body-base text-fg-secondary">
        TradeMind Academy is a learning platform under construction. It uses
        simulated market data only — no live trading, no signals, no financial
        advice. For users 18 and over.
      </p>
      <Link
        href="/dev/kitchen-sink"
        className="rounded-control bg-accent px-5 py-3 text-sm font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-shadow hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_0_20px_var(--accent-glow)]"
      >
        View design system
      </Link>
    </main>
  );
}
