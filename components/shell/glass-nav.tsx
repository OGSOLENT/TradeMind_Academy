"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { useScrolled } from "@/lib/use-scrolled";
import { useAuth } from "@/lib/firebase/auth-context";
import { getFirebase } from "@/lib/firebase/client";
import { Kbd } from "@/components/ui/kbd";
import { Logo } from "./logo";
import { LearnMenu } from "./learn-menu";
import { CommandPalette, useCommandPalette } from "./command-palette";
import { CardsIcon, ConstellationIcon, HomeIcon, TargetIcon } from "./icons";

/**
 * The desktop navigation. Four places to go, each with an icon and a
 * spring-loaded active pill: Dashboard, Learn (which opens the module
 * panel), Practise, and Review. On the right, a search button that opens
 * the command palette, and the learner's avatar, which opens the account
 * menu. The bar firms up once you've scrolled so the content sliding
 * underneath it doesn't muddy the links.
 *
 * Menus open on hover with a short grace period and on click, close on
 * Escape, on an outside click and on navigation, and they're buttons with
 * aria-expanded so the keyboard gets the same thing the mouse does.
 */

const rightLinks = [
  { href: "/practice", label: "Practise", Icon: TargetIcon },
  { href: "/review", label: "Review", Icon: CardsIcon },
] as const;

export function GlassNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion();
  const scrolled = useScrolled();
  const { user } = useAuth();
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const [learnOpen, setLearnOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovering = useRef(false);
  const navRef = useRef<HTMLElement>(null);

  const initial = user?.displayName?.trim().charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase();
  const learnActive = pathname.startsWith("/lesson") || pathname.startsWith("/skill-tree");

  // Close everything on route change, Escape, or a click outside the bar.
  // A route change also refreshes the nav's copy of the model, because the
  // things that change it (a session, a lesson check, the placement) all
  // end with a navigation.
  useEffect(() => {
    setLearnOpen(false);
    setAccountOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["nav-mastery"] });
  }, [pathname, queryClient]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLearnOpen(false);
        setAccountOpen(false);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setLearnOpen(false);
        setAccountOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const hoverOpen = () => {
    hovering.current = true;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setLearnOpen(true);
  };
  const hoverClose = () => {
    hovering.current = false;
    closeTimer.current = setTimeout(() => setLearnOpen(false), 180);
  };
  // A click while the pointer is over the button keeps the panel open (hover
  // already opened it, and toggling would slam it shut). Without a pointer,
  // which is the keyboard case, the click toggles.
  const clickLearn = () => {
    if (learnOpen && !hovering.current) setLearnOpen(false);
    else setLearnOpen(true);
  };

  async function onSignOut() {
    const { auth } = getFirebase();
    await signOut(auth);
    queryClient.clear();
    router.push("/");
  }

  const itemClass = (active: boolean) =>
    cn(
      "relative isolate flex items-center gap-2 rounded-control px-3.5 py-2 text-sm font-medium transition-colors duration-200",
      active ? "text-fg-primary" : "text-fg-secondary hover:bg-white/5 hover:text-fg-primary",
    );

  const pill = (
    <motion.span
      layoutId="glass-nav-active"
      transition={reduced ? { duration: 0.15 } : spring.ui}
      className="absolute inset-0 -z-10 rounded-control bg-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
      aria-hidden="true"
    />
  );

  return (
    <>
      <header
        ref={navRef}
        className={cn(
          "glass-nav fixed inset-x-0 top-0 z-30 hidden h-[72px] items-center justify-between border-b px-margin-safe transition-[background-color,border-color,box-shadow] duration-300 md:flex",
          scrolled
            ? "border-white/[0.14] bg-[rgba(12,12,18,0.72)] shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]"
            : "border-white/10",
        )}
      >
        <Logo />

        <nav aria-label="Primary" className="flex items-center gap-1">
          <Link href="/dashboard" aria-current={pathname.startsWith("/dashboard") ? "page" : undefined} className={itemClass(pathname.startsWith("/dashboard"))}>
            {pathname.startsWith("/dashboard") && pill}
            <HomeIcon width={17} height={17} />
            Dashboard
          </Link>

          {/* Learn opens the module panel. */}
          <div className="relative" onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={learnOpen}
              aria-controls="learn-menu"
              onClick={clickLearn}
              className={itemClass(learnActive || learnOpen)}
            >
              {learnActive && pill}
              <ConstellationIcon width={17} height={17} />
              Learn
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={cn("transition-transform duration-200", learnOpen && "rotate-180")}>
                <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <AnimatePresence>
              {learnOpen && (
                <motion.div
                  id="learn-menu"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
                  transition={spring.ui}
                  className="absolute left-1/2 top-full z-40 mt-3 -translate-x-1/2 rounded-card bg-[rgba(16,16,24,0.97)] shadow-lift backdrop-blur-xl"
                >
                  {/* The little arrow that points at the button. */}
                  <span aria-hidden="true" className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm bg-bg-elevated shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.08)]" />
                  <LearnMenu onNavigate={() => setLearnOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {rightLinks.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href) || (href === "/practice" && pathname.startsWith("/quiz"));
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
                {active && pill}
                <Icon width={17} height={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* The command palette trigger. */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search, or press command K"
            className="flex h-9 items-center gap-2 rounded-control px-3 text-sm text-fg-secondary shadow-hairline transition-colors hover:bg-white/5 hover:text-fg-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="hidden lg:inline">Jump to</span>
            <Kbd className="hidden lg:inline-flex">⌘K</Kbd>
          </button>

          {/* The account menu, on the avatar. */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={accountOpen}
              aria-label="Account menu"
              onClick={() => setAccountOpen((o) => !o)}
              className={cn(
                "flex items-center gap-2 rounded-control py-1 pl-1 pr-2 text-sm font-medium transition-colors hover:bg-white/5",
                pathname.startsWith("/profile") || pathname.startsWith("/settings") ? "text-fg-primary" : "text-fg-secondary",
              )}
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-pill bg-accent/15 text-xs font-semibold text-accent-bright shadow-[inset_0_0_0_1px_var(--accent-glow)]"
              >
                {initial ?? "·"}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={cn("transition-transform duration-200", accountOpen && "rotate-180")}>
                <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
                  transition={spring.ui}
                  className="absolute right-0 top-full z-40 mt-3 w-56 rounded-card bg-[rgba(16,16,24,0.97)] p-1.5 shadow-lift backdrop-blur-xl"
                >
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium text-fg-primary">{user?.displayName ?? "Learner"}</p>
                    <p className="truncate text-xs text-fg-muted">{user?.email}</p>
                  </div>
                  <div className="my-1 h-px bg-hair" />
                  {[
                    { href: "/profile", label: "Profile" },
                    { href: "/settings#accessibility", label: "Accessibility" },
                    { href: "/settings#data", label: "Your data" },
                    { href: "/settings#account", label: "Account" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-control px-3 py-2 text-sm text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-hair" />
                  <button
                    onClick={onSignOut}
                    className="block w-full rounded-control px-3 py-2 text-left text-sm text-fg-secondary transition-colors hover:bg-white/5 hover:text-fg-primary"
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
