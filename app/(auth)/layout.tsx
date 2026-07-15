import { Logo } from "@/components/shell/logo";
import { Toaster } from "@/components/ui/toast";

/**
 * Split auth layout per auth_sign_in: display headline panel on the left
 * (desktop only), form card on the right. Mobile is the card alone.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="relative hidden flex-1 flex-col justify-end bg-bg-base p-margin-safe lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_30%,var(--accent-glow),transparent_70%)] opacity-30"
        />
        <div className="relative">
          <h1 className="text-display-lg text-fg-primary">Master the market.</h1>
          <p className="mt-4 max-w-md text-body-base text-fg-secondary">
            A structured, adaptive curriculum for learning how markets move.
            Simulated data only — education, not financial advice.
          </p>
        </div>
      </aside>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo />
          </div>
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
