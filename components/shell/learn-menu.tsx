"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLearnerModel } from "@/lib/use-learner-model";
import type { NodeState } from "@/lib/routing";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The Learn panel that drops out of the nav. Every module in teaching
 * order, each with its live estimate and its state, so the nav itself is
 * a small version of the visible mind. Locked modules are still listed and
 * still open (the lesson is readable), they're just dimmer.
 */

const tone: Record<NodeState, { text: string; dot: string; label: string }> = {
  mastered: { text: "text-mastery-bright", dot: "bg-mastery", label: "mastered" },
  available: { text: "text-accent-bright", dot: "bg-accent-bright", label: "in progress" },
  remediation: { text: "text-warning", dot: "bg-warning", label: "needs work" },
  locked: { text: "text-fg-muted", dot: "bg-fg-muted", label: "locked" },
};

export function LearnMenu({ onNavigate }: { onNavigate(): void }) {
  const { modules, loading } = useLearnerModel();
  const reduced = useReducedMotion();
  const frontier = modules.find((m) => m.state === "available" || m.state === "remediation");
  const mastered = modules.filter((m) => m.state === "mastered").length;

  return (
    <div className="w-[720px] max-w-[calc(100vw-2rem)] p-2">
      <div className="grid gap-2 md:grid-cols-[220px_1fr]">
        {/* The left column: where you are, and the two big actions. */}
        <div className="flex flex-col gap-2">
          <div className="rounded-control bg-white/[0.03] p-4 shadow-hairline">
            <p className="text-label-caps uppercase tracking-wider text-fg-secondary">Up next</p>
            {frontier ? (
              <Link href={`/lesson/${frontier.id}`} onClick={onNavigate} className="mt-2 flex items-center gap-3">
                <MasteryRing value={frontier.pL} size="sm" tone={frontier.state === "remediation" ? "warning" : "auto"} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-fg-primary">{frontier.title}</span>
                  <span className="num block text-xs text-fg-secondary">
                    {frontier.lessons.length} lesson{frontier.lessons.length === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
            ) : (
              <p className="mt-2 text-sm text-fg-secondary">{loading ? "Loading…" : "Every module mastered."}</p>
            )}
          </div>
          <Link
            href="/practice"
            onClick={onNavigate}
            className="rounded-control bg-accent px-4 py-3 text-sm font-medium text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-shadow hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_0_20px_var(--accent-glow)]"
          >
            Practise now
            <span className="mt-0.5 block text-xs font-normal text-white/70">An adaptive session on your weakest open module</span>
          </Link>
          <Link
            href="/skill-tree"
            onClick={onNavigate}
            className="rounded-control px-4 py-3 text-sm text-fg-secondary shadow-hairline transition-colors hover:bg-white/5 hover:text-fg-primary"
          >
            Open the skill tree
            <span className="num mt-0.5 block text-xs text-fg-muted">
              {mastered}/{modules.length || "…"} mastered
            </span>
          </Link>
        </div>

        {/* The right column: every module, in order. */}
        <ol className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
          {modules.map((m, i) => {
            const t = tone[m.state];
            return (
              <motion.li
                key={m.id}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.02 * i, ease: ease.choreo }}
              >
                <Link
                  href={`/lesson/${m.id}`}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-control px-2.5 py-2 transition-colors hover:bg-white/[0.05]",
                    m.state === "locked" && "opacity-70",
                  )}
                >
                  <span className="num w-5 text-[10px] tracking-widest text-fg-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-pill", t.dot)} />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg-primary">{m.title}</span>
                  <span className={cn("num text-xs", t.text)}>{Math.round(m.pL * 100)}%</span>
                  <span className="sr-only">, {t.label}</span>
                </Link>
              </motion.li>
            );
          })}
          {loading && modules.length === 0 && (
            <li className="col-span-2 px-3 py-6 text-center text-sm text-fg-muted">Loading your modules…</li>
          )}
        </ol>
      </div>
    </div>
  );
}
