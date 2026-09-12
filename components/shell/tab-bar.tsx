"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pressScale, spring } from "@/lib/motion";
import { CardsIcon, ConstellationIcon, HomeIcon, TargetIcon, UserIcon } from "./icons";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/skill-tree", label: "Learn", Icon: ConstellationIcon },
  { href: "/practice", label: "Practise", Icon: TargetIcon, fab: true },
  { href: "/review", label: "Review", Icon: CardsIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
] as const;

/**
 * The mobile navigation: a floating glass dock with the Practise button
 * raised in the middle. The active tab sits on a soft pill that springs
 * across when you switch, and the dock keeps clear of the home indicator.
 * It hides at md and up, where GlassNav takes over.
 */
export function TabBar() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  return (
    <nav
      aria-label="Primary"
      className="glass-nav fixed inset-x-3 bottom-3 z-30 flex h-[68px] items-center justify-around rounded-card border border-white/10 pb-[env(safe-area-inset-bottom)] shadow-lift md:hidden"
    >
      {tabs.map(({ href, label, Icon, ...tab }) => {
        const active = pathname.startsWith(href) || (href === "/practice" && pathname.startsWith("/quiz")) || (href === "/skill-tree" && pathname.startsWith("/lesson"));
        if ("fab" in tab && tab.fab) {
          return (
            <motion.span key={href} whileTap={{ scale: pressScale }} transition={spring.ui} className="-mt-8">
              <Link
                href={href}
                aria-label={label}
                className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_8px_24px_-6px_var(--accent-glow),0_0_24px_var(--accent-glow)]"
              >
                <Icon width={26} height={26} />
              </Link>
            </motion.span>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative isolate flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-control px-3 py-1.5 transition-colors duration-200",
              active ? "text-mastery-bright" : "text-fg-secondary",
            )}
          >
            {active && (
              <motion.span
                layoutId="tab-bar-active"
                transition={reduced ? { duration: 0.15 } : spring.ui}
                className="absolute inset-0 -z-10 rounded-control bg-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                aria-hidden="true"
              />
            )}
            <Icon />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
