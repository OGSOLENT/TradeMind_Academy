"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import type { Item, Kc } from "@/lib/content/types";
import { DEFAULT_PARAMS } from "@/lib/bkt";
import { unlockedKcIds } from "@/lib/routing";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { useQuizSession } from "@/lib/quiz/session-store";
import { Skeleton } from "@/components/ui/skeleton";

const COURSE_ID = "trading-foundations";
const SESSION_LENGTH = 10;

/**
 * Practice launcher: the adaptive loop's entry point. Routing decides every
 * question — the pool is restricted to UNLOCKED KCs, then /lib/routing picks
 * lowest-mastery KC + difficulty ladder per answer.
 */
export default function PracticePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const startAdaptive = useQuizSession((s) => s.startAdaptive);
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const { db } = getFirebase();

      const [kcsSnap, itemsSnap, masterySnap] = await Promise.all([
        getDocs(collection(db, "kcs")),
        getDocs(collection(db, "items")),
        getDoc(doc(db, "users", user.uid, "mastery", COURSE_ID)),
      ]);

      const kcs = kcsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kc);
      const allItems = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);
      const kcStates = (masterySnap.data()?.kcs ?? {}) as Record<
        string,
        { pL: number; attempts: number }
      >;

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
      router.replace(`/quiz/${sessionId}`);
    };

    run().catch((err) => {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    });
  }, [loading, user, startAdaptive, router]);

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
    <div className="mx-auto max-w-2xl space-y-4 pt-16">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-64 w-full rounded-card" />
      <p className="text-center text-sm text-fg-secondary">Assembling your session…</p>
    </div>
  );
}
