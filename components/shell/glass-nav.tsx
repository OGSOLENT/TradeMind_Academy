"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/skill-tree", label: "Skill Tree" },
  { href: "/review", label: "Review" },
];

/**
 * Fixed 72px glass navigation bar (from trademind_landing_page).
 * Desktop only — the mobile shell uses the bottom TabBar.
 */
export function GlassNav() {
  const pathname = usePathname();
  return (
    <header className="glass-nav fixed inset-x-0 top-0 z-30 hidden h-[72px] items-center justify-between border-b border-white/10 px-margin-safe md:flex">
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
                "rounded-control px-4 py-2 text-sm font-medium transition-colors duration-200",
                active
                  ? "bg-white/5 text-fg-primary"
                  : "text-fg-secondary hover:bg-white/5 hover:text-fg-primary",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/profile"
        className="rounded-control px-4 py-2 text-sm font-medium text-fg-secondary transition-colors duration-200 hover:bg-white/5 hover:text-fg-primary"
      >
        Profile
      </Link>
    </header>
  );
}
