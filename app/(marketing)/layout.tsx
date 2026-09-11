import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { OfflineBanner } from "@/components/offline-banner";
import { AmbientBackground } from "@/components/shell/ambient-background";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Toaster } from "@/components/ui/toast";

/** The marketing shell: visitor glass nav on top, the full disclaimer footer underneath. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AmbientBackground />
      <OfflineBanner />
      <MarketingNav />

      <main className="pt-[72px]">{children}</main>

      <footer className="relative border-t border-hair px-6 py-12">
        {/* A faint line of light along the top edge, fading out at both ends. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        <div className="mx-auto max-w-5xl space-y-6">
          <Logo />
          <p className="max-w-3xl text-sm leading-6 text-fg-secondary">
            <span className="font-medium text-warning">Risk & purpose disclaimer.</span>{" "}
            TradeMind Academy is an educational research artefact built for a BSc dissertation
            (Solent University). Every chart, price, and scenario is <em>simulated</em>. Nothing
            here is financial advice, a trading signal, or an inducement to trade. Trading real
            money carries substantial risk of loss. This platform never connects to a broker,
            never handles funds, and makes no claims about profitability. For adults 18+.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg-secondary">
            <Link href="/legal" className="transition-colors hover:text-fg-primary">
              Legal & privacy
            </Link>
            <Link href="/sign-in" className="transition-colors hover:text-fg-primary">
              Sign in
            </Link>
            <span className="num">© 2026 TradeMind Academy — research artefact, QHO634</span>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
