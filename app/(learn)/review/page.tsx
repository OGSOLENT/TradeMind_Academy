"use client";

import { useTitle } from "@/lib/use-title";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import type { Kc } from "@/lib/content/types";
import { MASTERY_THRESHOLD } from "@/lib/bkt";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { COURSE_ID } from "@/lib/constants";
import { masteryOf, parseDocs, parseKc } from "@/lib/firebase/schemas";

const DAY_MS = 24 * 60 * 60 * 1000;
const FADE_AFTER_DAYS = 3;

interface FadingKc {
  kc: Kc;
  pL: number;
  daysSince: number;
}

/**
 * The review queue, framed in amber as "fading skills". It's a card stack of
 * topics you haven't touched in a while and haven't mastered yet. Swipe a
 * card away to defer it (it flies off on a spring), or re-drill it now.
 */
export default function ReviewPage() {
  useTitle("Review");
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [deferred, setDeferred] = useState<string[]>([]);

  const { data, isPending } = useQuery({
    queryKey: ["review-queue", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const { db } = getFirebase();
      const [kcsSnap, masterySnap] = await Promise.all([
        getDocs(collection(db, "kcs")),
        getDoc(doc(db, "users", user!.uid, "mastery", COURSE_ID)),
      ]);
      const kcs = parseDocs(kcsSnap, parseKc);
      const states = masteryOf(masterySnap).kcs;
      return { kcs, states };
    },
  });

  const queue: FadingKc[] = useMemo(() => {
    if (!data) return [];
    return data.kcs
      .map((kc) => {
        const st = data.states[kc.id];
        if (!st || st.attempts === 0 || st.pL >= MASTERY_THRESHOLD) return null;
        const daysSince = (Date.now() - st.lastSeen) / DAY_MS;
        if (daysSince < FADE_AFTER_DAYS) return null;
        return { kc, pL: st.pL, daysSince: Math.floor(daysSince) };
      })
      .filter((x): x is FadingKc => x !== null)
      .filter((x) => !deferred.includes(x.kc.id))
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [data, deferred]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-md pt-8">
        <Skeleton className="h-72 w-full rounded-card" />
      </div>
    );
  }

  return (
    <Stagger autoWrap={false} className="mx-auto max-w-md">
      <StaggerItem>
        <h1 className="text-headline-md text-fg-primary">
          Review <span className="text-gradient">queue</span>
        </h1>
        <p className="mt-1 text-sm text-fg-secondary">
          Skills fade without practice — the model decays its confidence in
          anything you haven&apos;t touched for {FADE_AFTER_DAYS}+ days.
        </p>
      </StaggerItem>

      <StaggerItem className="relative mt-8 h-80" aria-live="polite">
        {queue.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-card bg-bg-base-veil p-8 text-center shadow-hairline">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-pill bg-mastery/10 text-xl text-mastery-bright shadow-[inset_0_0_0_1px_var(--mastery-glow),0_0_24px_-4px_var(--mastery-glow)]"
            >
              ✓
            </span>
            <p className="mt-3 text-body-base text-fg-primary">Nothing is fading</p>
            <p className="mt-1 text-sm text-fg-secondary">
              Everything you&apos;ve practised is fresh. Keep building instead.
            </p>
            <Link href="/practice" className="mt-5">
              <Button variant="secondary" size="sm">
                Practise something new
              </Button>
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {queue
              .slice(0, 3)
              .reverse()
              .map((entry, revIndex, arr) => {
                const stackIndex = arr.length - 1 - revIndex; // 0 is the top card
                const isTop = stackIndex === 0;
                return (
                  <motion.div
                    key={entry.kc.id}
                    drag={isTop && !reduced ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 120 || Math.abs(info.velocity.x) > 600) {
                        setDeferred((d) => [...d, entry.kc.id]);
                      }
                    }}
                    initial={false}
                    animate={{
                      scale: 1 - stackIndex * 0.05,
                      y: stackIndex * 14,
                      opacity: 1 - stackIndex * 0.25,
                    }}
                    exit={
                      reduced
                        ? { opacity: 0 }
                        : { x: 420, rotate: 12, opacity: 0, transition: { type: "spring", stiffness: 200, damping: 22 } }
                    }
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className="absolute inset-x-0 top-0 rounded-card bg-bg-elevated-veil p-6 shadow-edge-lit"
                    style={{ zIndex: 10 - stackIndex, cursor: isTop ? "grab" : "default" }}
                  >
                    <div className="flex items-center gap-5">
                      <MasteryRing value={entry.pL} size="md" tone="warning" />
                      <div className="min-w-0 flex-1">
                        <Pill tone="warning" dot>
                          fading · {entry.daysSince}d
                        </Pill>
                        <h2 className="mt-2 text-headline-md text-fg-primary">{entry.kc.title}</h2>
                        <p className="mt-1 text-sm text-fg-secondary">
                          Last practised {entry.daysSince} days ago.
                        </p>
                      </div>
                    </div>
                    {isTop && (
                      <div className="mt-6 flex items-center justify-between">
                        <button
                          onClick={() => setDeferred((d) => [...d, entry.kc.id])}
                          className="min-h-11 rounded-control px-3 text-sm text-fg-secondary hover:bg-white/5"
                        >
                          Later
                        </button>
                        <Link href="/practice">
                          <Button size="sm">Re-drill now</Button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>
        )}
      </StaggerItem>
      {queue.length > 3 && (
        <p className="num mt-4 text-center text-sm text-fg-secondary">+{queue.length - 3} more in the queue</p>
      )}
    </Stagger>
  );
}
