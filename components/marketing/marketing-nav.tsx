"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/shell/logo";
import { useScrolled } from "@/lib/use-scrolled";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#visible-mind", label: "The visible mind", external: true },
  { href: "/#faq", label: "Questions", external: true },
  { href: "/sign-in", label: "Sign in", external: false },
];

/**
 * The visitor nav for the marketing pages. Same glass as the app nav, and it
 * firms up once you've scrolled. On desktop the links get an underline that
 * grows from the left on hover. On phones the links live behind a button
 * that opens a full-screen sheet with the items staggering in.
 */
export function MarketingNav() {
  const scrolled = useScrolled();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
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
          {links.map((l) =>
            l.external ? (
              <a key={l.href} href={l.href} className="group relative rounded-control px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:text-fg-primary">
                {l.label}
                <span aria-hidden="true" className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-mastery-bright to-accent-bright transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="group relative rounded-control px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:text-fg-primary">
                {l.label}
                <span aria-hidden="true" className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-mastery-bright to-accent-bright transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-up"
            className="tm-sheen hidden whitespace-nowrap rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-shadow hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_0_20px_var(--accent-glow)] sm:inline-flex"
          >
            Start free
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-control text-fg-primary transition-colors hover:bg-white/5 md:hidden"
          >
            <span className="relative block h-3.5 w-5" aria-hidden="true">
              <span className={cn("absolute left-0 top-0 h-0.5 w-5 rounded-pill bg-current transition-transform duration-300", open && "translate-y-1.5 rotate-45")} />
              <span className={cn("absolute left-0 top-1.5 h-0.5 w-5 rounded-pill bg-current transition-opacity duration-200", open && "opacity-0")} />
              <span className={cn("absolute left-0 top-3 h-0.5 w-5 rounded-pill bg-current transition-transform duration-300", open && "-translate-y-1.5 -rotate-45")} />
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20 flex flex-col bg-[rgba(5,5,7,0.96)] px-6 pb-10 pt-24 backdrop-blur-xl md:hidden"
          >
            <nav aria-label="Menu" className="flex flex-col gap-2">
              {[...links, { href: "/sign-up", label: "Start free", external: false }].map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={reduced ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: ease.choreo }}
                >
                  {l.external ? (
                    <a href={l.href} onClick={() => setOpen(false)} className="block rounded-card px-4 py-4 text-display-lg-mobile text-fg-primary transition-colors hover:bg-white/5">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-card px-4 py-4 text-display-lg-mobile text-fg-primary transition-colors hover:bg-white/5">
                      {l.label}
                    </Link>
                  )}
                </motion.div>
              ))}
            </nav>
            <p className="num mt-auto text-label-caps uppercase tracking-[0.2em] text-fg-muted">
              simulation only · no signals · no live money
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
