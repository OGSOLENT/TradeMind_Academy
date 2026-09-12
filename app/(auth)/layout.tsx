import { Logo } from "@/components/shell/logo";
import { AmbientBackground } from "@/components/shell/ambient-background";
import { AsideArt } from "@/components/auth/aside-art";
import { BackLink } from "@/components/auth/back-link";
import { Stagger } from "@/components/motion/stagger";
import { Toaster } from "@/components/ui/toast";

/**
 * The split auth layout from auth_sign_in: a display panel on the left
 * (desktop only), the form card on the right. On mobile it's just the card.
 * The left panel draws a simulated price trace as the page opens, and the
 * card staggers in beside it.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AmbientBackground />
      <aside className="relative hidden flex-1 flex-col justify-center gap-12 bg-bg-base-veil p-margin-safe lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_30%,var(--accent-glow),transparent_70%)] opacity-30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
        />
        <div className="relative">
          <AsideArt />
        </div>
        <Stagger className="relative max-w-md" delay={0.2}>
          <h1 className="text-display-lg text-fg-primary">
            Master the <span className="text-gradient">market.</span>
          </h1>
          <p className="mt-4 max-w-md text-body-base text-fg-secondary">
            A structured, adaptive curriculum for learning how markets move.
            Simulated data only — education, not financial advice.
          </p>
        </Stagger>
      </aside>
      <main className="relative flex flex-1 items-center justify-center px-4 py-10">
        {/* The way back. Top-left on every auth screen, on every size. */}
        <div className="absolute left-4 top-4 md:left-8 md:top-6">
          <BackLink />
        </div>
        <Stagger className="w-full max-w-md pt-10 md:pt-0">
          <div className="mb-8">
            <Logo />
          </div>
          {children}
        </Stagger>
      </main>
      <Toaster />
    </div>
  );
}
