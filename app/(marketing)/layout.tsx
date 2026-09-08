import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { OfflineBanner } from "@/components/offline-banner";
import { AmbientBackground } from "@/components/shell/ambient-background";
import { Toaster } from "@/components/ui/toast";

/** Marketing shell: visitor glass nav + full-disclaimer footer. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AmbientBackground />
      <OfflineBanner />
      <header className="glass-nav fixed inset-x-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/10 px-6 md:px-margin-safe">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <a href="/#visible-mind" className="rounded-control px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary">
            The visible mind
          </a>
          <a href="/#faq" className="rounded-control px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary">
            Questions
          </a>
          <Link href="/sign-in" className="rounded-control px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary">
            Sign in
          </Link>
        </nav>
        <Link
          href="/sign-up"
          className="rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-shadow hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_0_20px_var(--accent-glow)]"
        >
          Start free
        </Link>
      </header>

      <main className="pt-[72px]">{children}</main>

      <footer className="border-t border-hair px-6 py-12">
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
            <Link href="/legal" className="hover:text-fg-primary">
              Legal & privacy
            </Link>
            <Link href="/sign-in" className="hover:text-fg-primary">
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
