"use client";

import { useTitle } from "@/lib/use-title";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { DEFAULT_PARAMS } from "@/lib/bkt";
import { unlockedKcIds } from "@/lib/routing";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { useQuizSession } from "@/lib/quiz/session-store";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LazyParticleField } from "@/components/three/lazy-particle-field";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { COURSE_ID } from "@/lib/constants";
import { masteryOf, parseDocs, parseItem, parseKc } from "@/lib/firebase/schemas";

const SESSION_LENGTH = 10;

interface Line {
  label: string;
  value: string;
  tone?: "mastery" | "accent" | "warning";
}

/** How long each line holds before the next one lands. */
const BEAT_MS = 380;

/**
 * The practice launcher, which is the entry point to the adaptive loop.
 * Routing decides every single question: the pool is restricted to UNLOCKED
 * KCs, and then /lib/routing picks the lowest-mastery KC and walks the
 * difficulty ladder after each answer.
 *
 * The screen it shows while that happens is a readout of the real decisions,
 * one line at a time: how many topics are open, which one the engine chose,
 * what it estimates, what difficulty it starts you on. It's the visible
 * mind again, and it costs about a second and a half.
 */
export default function PracticePage() {
  useTitle("Practise");
  const router = useRouter();
  const reduced = useReducedMotion();
  const { user, loading } = useAuth();
  const startAdaptive = useQuizSession((s) => s.startAdaptive);
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading || !user || startedRef.current) return;
    startedRef.current = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, reduced ? 0 : ms));

    const run = async () => {
      const { db } = getFirebase();

      const [kcsSnap, itemsSnap, masterySnap] = await Promise.all([
        getDocs(collection(db, "kcs")),
        getDocs(collection(db, "items")),
        getDoc(doc(db, "users", user.uid, "mastery", COURSE_ID)),
      ]);

      const kcs = parseDocs(kcsSnap, parseKc);
      const allItems = parseDocs(itemsSnap, parseItem);
      const kcStates = masteryOf(masterySnap).kcs;

      const mastery: Record<string, number> = {};
      for (const kc of kcs) mastery[kc.id] = kcStates[kc.id]?.pL ?? DEFAULT_PARAMS.pL0;

      const unlocked = new Set(
        unlockedKcIds(
          kcs,
          Object.fromEntries(kcs.map((kc) => [kc.id, kcStates[kc.id] ?? { pL: mastery[kc.id]!, attempts: 0 }])),
        ),
      );
      const pool = allItems.filter((it) => unlocked.has(it.kcId));
      const unlockedKcs = kcs.filter((kc) => unlocked.has(kc.id));

      const sessionId = `practice-${Date.now()}`;
      await setDoc(doc(db, "users", user.uid, "sessions", sessionId), {
        type: "topic-test",
        startedAt: serverTimestamp(),
        endedAt: null,
        kcIds: unlockedKcs.map((k) => k.id),
      });

      startAdaptive(user.uid, sessionId, pool, unlockedKcs, mastery, SESSION_LENGTH);

      // Read back what the engine actually decided for the first question,
      // so the readout is the truth and not a story about it.
      const state = useQuizSession.getState();
      const first = state.items[0];
      const reason = first ? state.reasons[first.id] : undefined;
      const chosen = kcs.find((k) => k.id === reason?.kcId);

      const script: Line[] = [
        { label: "Loading your model", value: `${kcs.length} topics · ${unlockedKcs.length} unlocked`, tone: "accent" },
        {
          label: "Finding your weakest open topic",
          value: chosen ? `${chosen.title} · ${Math.round((reason?.pL ?? 0) * 100)}%` : "none left",
          tone: reason?.band === "remediate" ? "warning" : "mastery",
        },
        {
          label: "Setting the difficulty",
          value: reason
            ? `${reason.difficulty} · P(correct) ${Math.round(reason.pCorrectPredicted * 100)}%`
            : "pool exhausted",
          tone: "accent",
        },
        { label: "Session ready", value: `${Math.min(SESSION_LENGTH, pool.length)} questions`, tone: "mastery" },
      ];

      script.forEach((line, i) => at(BEAT_MS * (i + 1), () => setLines((l) => [...l, line])));
      at(BEAT_MS * (script.length + 1), () => setDone(true));
      at(BEAT_MS * (script.length + 1) + 350, () => router.replace(`/quiz/${sessionId}`));
    };

    run().catch((err) => {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    });
    return () => timers.forEach(clearTimeout);
  }, [loading, user, startAdaptive, router, reduced]);

  if (error) {
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <h1 className="text-headline-md text-fg-primary">Could not start the session</h1>
        <p className="mt-2 break-words text-sm text-danger" data-testid="practice-error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl pt-16">
      <Card level="elevated" spotlight className="p-7">
        <LazyParticleField count={260} wave={0.6} intensity={0.45} spread={[14, 7, 6]} />
        <div className="flex items-center justify-between">
          <Pill tone="accent" dot>
            Routing
          </Pill>
          <span className="num text-label-caps uppercase tracking-[0.18em] text-fg-muted">
            {done ? "ready" : "thinking"}
          </span>
        </div>
        <h1 className="mt-4 text-headline-md text-fg-primary">Assembling your session…</h1>
        <p className="mt-1 text-sm text-fg-secondary">
          The engine picks every question from your live estimates. Here&apos;s what it&apos;s doing.
        </p>

        {/* The readout. Each line lands with a rise, and the caret keeps
            blinking on the last one until the session's ready. */}
        <ol className="num mt-6 min-h-[132px] space-y-2 text-sm" aria-live="polite">
          <AnimatePresence initial={false}>
            {lines.map((line, i) => (
              <motion.li
                key={line.label}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: ease.choreo }}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="text-fg-secondary">
                  <span className="mr-2 text-fg-muted">{String(i + 1).padStart(2, "0")}</span>
                  {line.label}
                </span>
                <span
                  className={cn(
                    "text-right",
                    line.tone === "mastery" && "text-mastery-bright",
                    line.tone === "accent" && "text-accent-bright",
                    line.tone === "warning" && "text-warning",
                  )}
                >
                  {line.value}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
          {!done && (
            <li aria-hidden="true" className="flex items-center gap-2 text-fg-muted">
              <span className="mr-2 opacity-0">00</span>
              <span className="inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-accent-bright" />
            </li>
          )}
        </ol>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-pill bg-white/5" aria-hidden="true">
          <motion.div
            className="h-full rounded-pill bg-gradient-to-r from-accent to-mastery-bright"
            initial={{ width: "8%" }}
            animate={{ width: done ? "100%" : `${8 + lines.length * 22}%` }}
            transition={{ duration: 0.4, ease: ease.choreo }}
          />
        </div>
      </Card>
    </div>
  );
}
