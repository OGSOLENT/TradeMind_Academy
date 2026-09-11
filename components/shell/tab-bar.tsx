"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pressScale, spring } from "@/lib/motion";
import { CardsIcon, ConstellationIcon, HomeIcon, TargetIcon, UserIcon } from "./icons";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/skill-tree", label: "Tree", Icon: ConstellationIcon },
  { href: "/practice", label: "Practice", Icon: TargetIcon, fab: true },
  { href: "/review", label: "Review", Icon: CardsIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
] as const;

/**
 * The mobile bottom tab bar (from trademind_dashboard_mobile), with the raised
 * Practice FAB in the middle slot. It hides at md and up, where GlassNav takes
 * over. A small teal dot springs along under whichever tab is active.
 */
export function TabBar() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  return (
    <nav
      aria-label="Primary"
      className="glass-nav fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around rounded-t-card border-t border-white/10 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map(({ href, label, Icon, ...tab }) => {
        const active = pathname.startsWith(href);
        if ("fab" in tab && tab.fab) {
          return (
            <motion.span key={href} whileTap={{ scale: pressScale }} transition={spring.ui} className="-mt-7">
              <Link
                href={href}
                aria-label={label}
                className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_var(--accent-glow)]"
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
              "relative isolate flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-control px-3 py-1.5 transition-colors duration-200",
              active ? "text-mastery-bright" : "text-fg-secondary",
            )}
          >
            <Icon />
            <span className="text-label-caps uppercase tracking-wider">{label}</span>
            {active && (
              <motion.span
                layoutId="tab-bar-active"
                transition={reduced ? { duration: 0.15 } : spring.ui}
                className="absolute -bottom-0.5 h-1 w-1 rounded-pill bg-mastery-bright shadow-[0_0_8px_var(--mastery-glow)]"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
