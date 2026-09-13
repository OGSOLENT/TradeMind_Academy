"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/shell/logo";
import { useScrolled } from "@/lib/use-scrolled";
import { ease, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The visitor nav. Same glass as the app nav, and it firms up once you've
 * scrolled. The section links carry a small icon each and share one
 * spring-loaded pill that follows whichever section you're reading (a
 * scroll spy on the landing page) or whichever link you're hovering. On
 * the right, Sign in as a quiet link and Start free as the one filled
 * button. On phones everything lives behind a hamburger that opens a
 * full-screen sheet with the items staggering in.
 */

type IconProps = React.SVGAttributes<SVGSVGElement>;

function icon(props: IconProps): IconProps {
  return {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

const RouteIcon = (p: IconProps) => (
  <svg {...icon(p)}>
    <circle cx="5" cy="18" r="2" />
    <circle cx="19" cy="6" r="2" />
    <path d="M7 17c5-1 5-9 10-10" />
  </svg>
);
const BrainIcon = (p: IconProps) => (
  <svg {...icon(p)}>
    <path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.6A3 3 0 0 0 7 19.5h2V4.5Z" />
    <path d="M15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.6A3 3 0 0 1 17 19.5h-2V4.5Z" />
    <path d="M9 12h6" />
  </svg>
);
const BookIcon = (p: IconProps) => (
  <svg {...icon(p)}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4V5.5Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7V5.5Z" />
  </svg>
);
const HelpIcon = (p: IconProps) => (
  <svg {...icon(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.5a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1 .9-1 1.6" />
    <circle cx="12" cy="16.6" r="0.6" fill="currentColor" />
  </svg>
);

const sections = [
  { id: "how", label: "How it works", Icon: RouteIcon },
  { id: "visible-mind", label: "The visible mind", Icon: BrainIcon },
  { id: "curriculum", label: "Curriculum", Icon: BookIcon },
  { id: "faq", label: "Questions", Icon: HelpIcon },
] as const;

/**
 * Which landing section is on screen. The active one is whichever section
 * crosses a line about a third of the way down the viewport, which feels
 * right when you're reading: the heading you've just scrolled past is the
 * one that lights up. Off the landing page there's no active section.
 */
function useActiveSection(enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const visible = new Map<string, boolean>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set((e.target as HTMLElement).id, e.isIntersecting);
        // Sections are in page order, so the first visible one wins.
        const first = els.find((el) => visible.get(el.id));
        if (first) setActive(first.id);
        else if (window.scrollY < 200) setActive(null);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [enabled]);
  return active;
}

export function MarketingNav() {
  const pathname = usePathname();
  const onLanding = pathname === "/";
  const scrolled = useScrolled();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const active = useActiveSection(onLanding);
  const pillOn = hover ?? active;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Anchors resolve on the landing page. From any other marketing page
  // they go back to the landing and jump to the section.
  const hrefFor = (id: string) => (onLanding ? `#${id}` : `/#${id}`);

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

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
          onMouseLeave={() => setHover(null)}
        >
          {sections.map(({ id, label, Icon }) => {
            const on = pillOn === id;
            const current = active === id;
            return (
              <a
                key={id}
                href={hrefFor(id)}
                aria-current={current ? "location" : undefined}
                onMouseEnter={() => setHover(id)}
                onFocus={() => setHover(id)}
                onBlur={() => setHover(null)}
                className={cn(
                  "relative isolate flex items-center gap-2 rounded-control px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                  on || current ? "text-fg-primary" : "text-fg-secondary hover:text-fg-primary",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="marketing-nav-pill"
                    transition={reduced ? { duration: 0.15 } : spring.ui}
                    className="absolute inset-0 -z-10 rounded-control bg-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                    aria-hidden="true"
                  />
                )}
                <Icon className={cn("transition-colors duration-200", current ? "text-mastery-bright" : "text-fg-muted")} />
                {label}
                {current && (
                  <motion.span
                    layoutId="marketing-nav-dot"
                    transition={reduced ? { duration: 0.15 } : spring.ui}
                    className="absolute -bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-pill bg-mastery-bright shadow-[0_0_8px_var(--mastery-bright)]"
                    aria-hidden="true"
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/sign-in"
            className="hidden rounded-control px-3.5 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="tm-sheen hidden items-center gap-2 whitespace-nowrap rounded-control bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-shadow hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_0_20px_var(--accent-glow)] sm:inline-flex"
          >
            Start free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
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
            <nav aria-label="Menu" className="flex flex-col gap-1">
              {sections.map(({ id, label, Icon }, i) => (
                <motion.div
                  key={id}
                  initial={reduced ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: ease.choreo }}
                >
                  <a
                    href={hrefFor(id)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 rounded-card px-4 py-4 text-display-lg-mobile text-fg-primary transition-colors hover:bg-white/5"
                  >
                    <Icon width={22} height={22} className={cn(active === id ? "text-mastery-bright" : "text-fg-muted")} />
                    {label}
                  </a>
                </motion.div>
              ))}
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 + sections.length * 0.06, ease: ease.choreo }}
                className="mt-6 flex flex-col gap-3"
              >
                <Link
                  href="/sign-up"
                  onClick={() => setOpen(false)}
                  className="tm-sheen flex items-center justify-center rounded-control bg-accent px-4 py-3.5 text-base font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                >
                  Start free
                </Link>
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-control border border-white/10 px-4 py-3.5 text-base font-medium text-fg-primary transition-colors hover:bg-white/5"
                >
                  Sign in
                </Link>
              </motion.div>
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
