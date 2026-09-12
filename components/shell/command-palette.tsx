"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLearnerModel } from "@/lib/use-learner-model";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

/**
 * The command palette. Cmd+K (or Ctrl+K) from anywhere in the app, or the
 * search button in the nav. Type a few letters and jump to any page, module
 * or lesson. Arrow keys move, Enter goes, Escape closes. It reads the same
 * learner model as the Learn menu, so a mastered module shows as mastered
 * here too.
 */

interface Entry {
  id: string;
  group: "Pages" | "Modules" | "Lessons";
  title: string;
  hint?: string;
  href: string;
  tone?: string;
}

const PAGES: Entry[] = [
  { id: "p-dash", group: "Pages", title: "Dashboard", hint: "Your knowledge model", href: "/dashboard" },
  { id: "p-tree", group: "Pages", title: "Skill tree", hint: "The constellation", href: "/skill-tree" },
  { id: "p-practice", group: "Pages", title: "Practise", hint: "Start an adaptive session", href: "/practice" },
  { id: "p-review", group: "Pages", title: "Review queue", hint: "Fading skills", href: "/review" },
  { id: "p-mistakes", group: "Pages", title: "Mistake bank", hint: "Re-drill what you missed", href: "/mistakes" },
  { id: "p-profile", group: "Pages", title: "Profile", hint: "Stats and badges", href: "/profile" },
  { id: "p-settings", group: "Pages", title: "Settings", hint: "Accessibility, your data, account", href: "/settings" },
];

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose(): void }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { modules } = useLearnerModel();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const mods: Entry[] = modules.map((m, i) => ({
      id: `m-${m.id}`,
      group: "Modules",
      title: m.title,
      hint: `${String(i + 1).padStart(2, "0")} · ${m.state} · ${Math.round(m.pL * 100)}%`,
      href: `/lesson/${m.id}`,
      tone: m.state,
    }));
    const lessons: Entry[] = modules.flatMap((m) =>
      m.lessons.map((l) => ({
        id: `l-${l.id}`,
        group: "Lessons" as const,
        title: l.title,
        hint: m.title,
        href: `/lesson/${l.id}`,
      })),
    );
    return [...PAGES, ...mods, ...lessons];
  }, [modules]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.filter((e) => e.group !== "Lessons").slice(0, 24);
    return entries
      .filter((e) => e.title.toLowerCase().includes(q) || e.hint?.toLowerCase().includes(q))
      .slice(0, 24);
  }, [entries, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(results.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        const hit = results[index];
        if (hit) {
          onClose();
          router.push(hit.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, index, onClose, router]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Jump to"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.12 } }}
            transition={spring.ui}
            className="relative w-full max-w-xl overflow-hidden rounded-card bg-bg-elevated shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-hair px-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="text-fg-muted">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a page, module or lesson…"
                aria-label="Search"
                className="h-14 w-full bg-transparent text-body-base text-fg-primary placeholder:text-fg-muted focus:outline-none"
              />
              <Kbd>esc</Kbd>
            </div>
            <ul ref={listRef} className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-fg-secondary">Nothing matches that.</li>
              )}
              {results.map((e, i) => {
                const header = e.group !== lastGroup ? e.group : null;
                lastGroup = e.group;
                const active = i === index;
                return (
                  <li key={e.id} data-index={i} role="option" aria-selected={active}>
                    {header && (
                      <p className="px-3 pb-1 pt-3 text-label-caps uppercase tracking-wider text-fg-muted">{header}</p>
                    )}
                    <button
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => {
                        onClose();
                        router.push(e.href);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-100",
                        active ? "bg-accent/15 text-fg-primary" : "text-fg-secondary",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-pill",
                          e.tone === "mastered" && "bg-mastery",
                          e.tone === "available" && "bg-accent-bright",
                          e.tone === "remediation" && "bg-warning",
                          e.tone === "locked" && "bg-fg-muted",
                          !e.tone && "bg-white/20",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
                      {e.hint && <span className="num truncate text-xs text-fg-muted">{e.hint}</span>}
                      {active && <Kbd>↵</Kbd>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
