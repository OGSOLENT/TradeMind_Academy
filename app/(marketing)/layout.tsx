import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { OfflineBanner } from "@/components/offline-banner";
import { AmbientBackground } from "@/components/shell/ambient-background";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Toaster } from "@/components/ui/toast";

const FOOTER_COLUMNS = [
  {
    heading: "Explore",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/#visible-mind", label: "The visible mind" },
      { href: "/#curriculum", label: "Curriculum" },
      { href: "/#faq", label: "Questions" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/sign-up", label: "Start free" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { href: "/legal", label: "Legal & privacy" },
      { href: "/legal#research", label: "Research participation" },
      { href: "/legal#data", label: "Your data" },
    ],
  },
];

/**
 * The marketing shell: visitor glass nav on top, and a proper footer
 * underneath with the site map in columns and the disclaimer in its own
 * box so it can't be missed.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AmbientBackground />
      <OfflineBanner />
      <MarketingNav />

      <main id="main" className="pt-[72px]">{children}</main>

      <footer className="relative border-t border-hair px-6 py-14">
        {/* A faint line of light along the top edge, fading out at both ends. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="space-y-5">
              <Logo />
              <p className="max-w-md text-sm leading-6 text-fg-secondary">
                An adaptive tutor for price action, built as a BSc dissertation artefact
                (Solent University). It models what you know and teaches what you don&apos;t.
              </p>
              <p className="num text-label-caps uppercase tracking-[0.2em] text-fg-muted">
                simulation only · no signals · no live money
              </p>
            </div>
            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <p className="text-label-caps uppercase tracking-[0.18em] text-fg-muted">{col.heading}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      {l.href.startsWith("/#") ? (
                        <a href={l.href} className="text-sm text-fg-secondary transition-colors hover:text-fg-primary">
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className="text-sm text-fg-secondary transition-colors hover:text-fg-primary">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-12 rounded-card bg-white/[0.03] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <p className="text-sm leading-6 text-fg-secondary">
              <span className="font-medium text-warning">Risk & purpose disclaimer.</span>{" "}
              Every chart, price, and scenario on TradeMind Academy is <em>simulated</em>, or a
              clearly labelled historical case study; nothing is live. Nothing
              here is financial advice, a trading signal, or an inducement to trade. Trading real
              money carries substantial risk of loss. This platform never connects to a broker,
              never handles funds, and makes no claims about profitability. For adults 18+.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-fg-muted">
            <span className="num">© 2026 TradeMind Academy · research artefact, QHO634</span>
            <span className="num">Bayesian Knowledge Tracing · Next.js · Firebase</span>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
