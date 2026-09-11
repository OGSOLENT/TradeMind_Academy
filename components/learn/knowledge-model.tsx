"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import type { Kc } from "@/lib/content/types";
import { nodeStateFor, unlockedKcIds, type MasteryMap, type NodeState } from "@/lib/routing";
import { orderByChain } from "@/lib/constellation";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/ui/counter";
import { Pill } from "@/components/ui/pill";
import { LazyMount } from "@/components/three/lazy-mount";
import { cn } from "@/lib/utils";

const MindOrb = dynamic(() => import("@/components/three/mind-orb").then((m) => m.MindOrb), {
  ssr: false,
});

/**
 * The knowledge model panel. The 3D orb on the left is the model drawn as a
 * climb, and the list on the right is the same model as numbers, one row per
 * module, each estimate rolling up to its value. Hover a row and the node
 * lights up. Hover a node and the row lights up. Either takes you to the
 * lesson. The orb only mounts on desktop, on idle, and never under reduced
 * motion. The list is always there, and it's the version a screen reader gets.
 */

interface KcState {
  pL: number;
  attempts: number;
}

const rowTone: Record<NodeState, { text: string; bar: string; dot: string; label: string }> = {
  mastered: { text: "text-mastery-bright", bar: "bg-mastery", dot: "bg-mastery", label: "mastered" },
  available: { text: "text-accent-bright", bar: "bg-accent", dot: "bg-accent-bright", label: "in progress" },
  remediation: { text: "text-warning", bar: "bg-warning", dot: "bg-warning", label: "needs work" },
  locked: { text: "text-fg-muted", bar: "bg-white/15", dot: "bg-fg-muted", label: "locked" },
};

export function KnowledgeModel({ kcs, kcStates }: { kcs: Kc[]; kcStates: Record<string, KcState> }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  const rows = useMemo(() => {
    const masteryMap: MasteryMap = Object.fromEntries(
      Object.entries(kcStates).map(([k, v]) => [k, { pL: v.pL, attempts: v.attempts }]),
    );
    const unlocked = new Set(unlockedKcIds(kcs, masteryMap));
    return orderByChain(kcs).map((kc) => {
      const st = kcStates[kc.id];
      const pL = st?.pL ?? 0;
      return {
        id: kc.id,
        title: kc.title,
        pL,
        state: nodeStateFor(pL, st?.attempts ?? 0, unlocked.has(kc.id)),
      };
    });
  }, [kcs, kcStates]);

  const progress = rows.length ? rows.reduce((n, r) => n + r.pL, 0) / rows.length : 0;
  const frontier = rows.find((r) => r.state === "available" || r.state === "remediation") ?? null;

  return (
    <Card level="elevated" className="p-0">
      <div className="grid md:grid-cols-[1.05fr_1fr]">
        {/* The orb. Desktop only, and the gradient behind it gives the
            canvas a horizon so the nodes aren't floating in flat black. */}
        <div className="relative hidden min-h-[380px] md:block">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_55%,rgba(94,106,210,0.16),transparent_70%)]"
          />
          <LazyMount>
            <MindOrb
              nodes={rows}
              progress={progress}
              frontierId={frontier?.id ?? null}
              hoveredId={hovered}
              onHover={setHovered}
              onSelect={(id) => router.push(`/lesson/${id}`)}
            />
          </LazyMount>
          <div className="pointer-events-none absolute bottom-4 left-5 flex items-center gap-2">
            <span className="num text-label-caps uppercase tracking-[0.18em] text-fg-muted">route covered</span>
            <span className="num text-sm text-fg-primary">
              <Counter value={Math.round(progress * 100)} suffix="%" />
            </span>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-6 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
          />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md text-fg-primary">Your knowledge model</h2>
            <Pill tone="accent" dot>
              live
            </Pill>
          </div>
          <p className="mt-1 text-sm text-fg-secondary">
            One estimate per module, straight from the Bayesian model. Nothing here is decorative.
          </p>

          <ol className="mt-4 space-y-1">
            {rows.map((row, i) => {
              const tone = rowTone[row.state];
              const active = hovered === row.id;
              return (
                <motion.li
                  key={row.id}
                  initial={reduced ? false : { opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={`/lesson/${row.id}`}
                    onMouseEnter={() => setHovered(row.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(row.id)}
                    onBlur={() => setHovered(null)}
                    className={cn(
                      "group flex items-center gap-3 rounded-control px-2.5 py-2 transition-[background-color,transform] duration-200",
                      active ? "translate-x-0.5 bg-white/[0.06]" : "hover:bg-white/[0.04]",
                    )}
                  >
                    <span className="num w-5 text-[10px] tracking-widest text-fg-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn("h-1.5 w-1.5 shrink-0 rounded-pill", tone.dot, active && "shadow-[0_0_8px_currentColor]")}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm", row.state === "locked" ? "text-fg-secondary" : "text-fg-primary")}>
                        {row.title}
                      </span>
                      <span className="mt-1 block h-0.5 w-full overflow-hidden rounded-pill bg-white/5" aria-hidden="true">
                        <motion.span
                          className={cn("block h-full rounded-pill", tone.bar)}
                          initial={reduced ? false : { width: 0 }}
                          animate={{ width: `${row.pL * 100}%` }}
                          transition={{ duration: 0.9, delay: 0.35 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </span>
                    </span>
                    <span className={cn("num w-11 text-right text-sm", tone.text)}>
                      <Counter value={Math.round(row.pL * 100)} suffix="%" />
                    </span>
                    <span className="sr-only">, {tone.label}</span>
                  </Link>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </Card>
  );
}
