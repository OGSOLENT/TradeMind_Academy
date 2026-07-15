"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import type { Item } from "@/lib/content/types";
import { DEFAULT_PARAMS } from "@/lib/bkt";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { useQuizSession } from "@/lib/quiz/session-store";
import { Skeleton } from "@/components/ui/skeleton";

const COURSE_ID = "trading-foundations";
const SESSION_LENGTH = 10;

/**
 * Practice launcher: assembles a 10-question mixed-type session and hands
 * off to /quiz/[sessionId]. Phase 3 uses a simple type-diverse picker;
 * Phase 4's routing engine (lowest-mastery KC, difficulty ladder) replaces
 * the selection strategy.
 */
export default function PracticePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const start = useQuizSession((s) => s.start);
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const { db } = getFirebase();

      const itemsSnap = await getDocs(collection(db, "items"));
      const all = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);

      // Type-diverse pick: round-robin across question types.
      const byType = new Map<string, Item[]>();
      for (const it of all) {
        const bucket = byType.get(it.type) ?? [];
        bucket.push(it);
        byType.set(it.type, bucket);
      }
      const picked: Item[] = [];
      const types = [...byType.keys()];
      let ti = 0;
      while (picked.length < SESSION_LENGTH && byType.size > 0) {
        const type = types[ti % types.length]!;
        const bucket = byType.get(type);
        ti++;
        if (!bucket || bucket.length === 0) continue;
        picked.push(bucket.shift()!);
      }

      const masterySnap = await getDoc(doc(db, "users", user.uid, "mastery", COURSE_ID));
      const kcs = (masterySnap.data()?.kcs ?? {}) as Record<string, { pL: number }>;
      const mastery: Record<string, number> = {};
      for (const it of picked) mastery[it.kcId] = kcs[it.kcId]?.pL ?? DEFAULT_PARAMS.pL0;

      const sessionId = `practice-${Date.now()}`;
      await setDoc(doc(db, "users", user.uid, "sessions", sessionId), {
        type: "topic-test",
        startedAt: serverTimestamp(),
        endedAt: null,
        kcIds: [...new Set(picked.map((i) => i.kcId))],
      });

      start(user.uid, sessionId, "topic-test", picked, mastery);
      router.replace(`/quiz/${sessionId}`);
    };

    run().catch((err) => {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    });
  }, [loading, user, start, router]);

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
