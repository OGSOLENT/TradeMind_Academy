import Link from "next/link";
import { Button } from "@/components/ui/button";

/** 404 — "this chart pattern doesn't exist" with the candle glyph. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <svg width="120" height="80" viewBox="0 0 120 80" aria-hidden="true">
        <line x1="20" y1="8" x2="20" y2="72" stroke="var(--bull)" strokeWidth="3" opacity="0.7" />
        <rect x="12" y="26" width="16" height="30" rx="3" fill="var(--bull)" opacity="0.85" />
        <line x1="60" y1="14" x2="60" y2="66" stroke="var(--bear)" strokeWidth="3" opacity="0.7" />
        <rect x="52" y="24" width="16" height="26" rx="3" fill="var(--bear)" opacity="0.85" />
        <line x1="100" y1="20" x2="100" y2="60" stroke="var(--fg-muted)" strokeWidth="3" opacity="0.5" strokeDasharray="4 4" />
        <rect x="92" y="32" width="16" height="18" rx="3" fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
      </svg>
      <div>
        <p className="num text-label-caps uppercase tracking-[0.25em] text-fg-muted">error 404</p>
        <h1 className="mt-3 text-headline-md text-fg-primary">
          This chart pattern doesn&apos;t exist
        </h1>
        <p className="mt-2 max-w-sm text-body-base text-fg-secondary">
          Whatever you were looking for isn&apos;t on this chart. Head back to
          somewhere with real (simulated) data.
        </p>
      </div>
      <Link href="/">
        <Button variant="secondary">Back to safety</Button>
      </Link>
    </main>
  );
}
