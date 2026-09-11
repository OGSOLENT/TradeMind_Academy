"use client";

import Link from "next/link";
import { Logo } from "@/components/shell/logo";
import { useScrolled } from "@/lib/use-scrolled";
import { cn } from "@/lib/utils";

const linkClass =
  "rounded-control px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary";

/**
 * The visitor nav for the marketing pages. Same glass as the app nav, and it
 * firms up once you've scrolled so the hero copy sliding underneath doesn't
 * muddy the links.
 */
export function MarketingNav() {
  const scrolled = useScrolled();
  return (
    <header
      className={cn(
        "glass-nav fixed inset-x-0 top-0 z-30 flex h-[72px] items-center justify-between border-b px-6 transition-[background-color,border-color,box-shadow] duration-300 md:px-margin-safe",
        scrolled
          ? "border-white/[0.14] bg-[rgba(12,12,18,0.72)] shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]"
          : "border-white/10",
      )}
    >
      <Logo />
      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        <a href="/#visible-mind" className={linkClass}>
          The visible mind
        </a>
        <a href="/#faq" className={linkClass}>
          Questions
        </a>
        <Link href="/sign-in" className={linkClass}>
          Sign in
        </Link>
      </nav>
      <Link
        href="/sign-up"
        className="tm-sheen rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-shadow hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_0_20px_var(--accent-glow)]"
      >
        Start free
      </Link>
    </header>
  );
}
