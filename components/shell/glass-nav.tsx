"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { useScrolled } from "@/lib/use-scrolled";
import { useAuth } from "@/lib/firebase/auth-context";
import { Logo } from "./logo";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/skill-tree", label: "Skill Tree" },
  { href: "/review", label: "Review" },
];

/**
 * The fixed 72px glass navigation bar, from trademind_landing_page. Desktop
 * only, because on mobile the bottom TabBar does this job. The active link
 * sits on a pill that springs across when you change page, and the whole bar
 * gets a touch darker once you've scrolled so the content underneath it
 * doesn't bleed through the text.
 */
export function GlassNav() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const scrolled = useScrolled();
  const { user } = useAuth();
  const initial = user?.displayName?.trim().charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase();
  return (
    <header
      className={cn(
        "glass-nav fixed inset-x-0 top-0 z-30 hidden h-[72px] items-center justify-between border-b px-margin-safe transition-[background-color,border-color,box-shadow] duration-300 md:flex",
        scrolled
          ? "border-white/[0.14] bg-[rgba(12,12,18,0.72)] shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]"
          : "border-white/10",
      )}
    >
      <Logo />
      <nav aria-label="Primary" className="flex items-center gap-1">
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative isolate rounded-control px-4 py-2 text-sm font-medium transition-colors duration-200",
                active ? "text-fg-primary" : "text-fg-secondary hover:bg-white/5 hover:text-fg-primary",
              )}
            >
              {active && (
                <motion.span
                  layoutId="glass-nav-active"
                  transition={reduced ? { duration: 0.15 } : spring.ui}
                  className="absolute inset-0 -z-10 rounded-control bg-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                  aria-hidden="true"
                />
              )}
              {label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/profile"
        aria-current={pathname.startsWith("/profile") ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-control py-1.5 pl-1.5 pr-4 text-sm font-medium transition-colors duration-200 hover:bg-white/5 hover:text-fg-primary",
          pathname.startsWith("/profile") ? "bg-white/[0.06] text-fg-primary" : "text-fg-secondary",
        )}
      >
        {/* The learner's initial in a small ring. Decorative, so the link's
            accessible name stays "Profile". */}
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-pill bg-accent/15 text-xs font-semibold text-accent-bright shadow-[inset_0_0_0_1px_var(--accent-glow)]"
        >
          {initial ?? "·"}
        </span>
        Profile
      </Link>
    </header>
  );
}
