"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import type { Item } from "@/lib/content/types";
import { DEFAULT_PARAMS } from "@/lib/bkt";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { useQuizSession } from "@/lib/quiz/session-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

const COURSE_ID = "trading-foundations";

interface MistakeGroup {
  kcId: string;
  itemIds: string[];
  lastMissed: number;
}

/** Mistake bank: everything you've missed, grouped by KC, re-drillable. */
export default function MistakesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const startFixed = useQuizSession((s) => s.startFixed);
  const [drilling, setDrilling] = useState<string | null>(null);

  const { data: groups, isPending } = useQuery({
    queryKey: ["mistakes", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const { db } = getFirebase();
      const sessions = await getDocs(
        query(
          collection(db, "users", user!.uid, "sessions"),
          orderBy("startedAt", "desc"),
          limit(20),
        ),
      );
      const byKc = new Map<string, MistakeGroup>();
      for (const session of sessions.docs) {
        const responses = await getDocs(
          collection(db, "users", user!.uid, "sessions", session.id, "responses"),
        );
        for (const r of responses.docs) {
          const d = r.data();
          if (d.correct) continue;
          const g: MistakeGroup = byKc.get(d.kcId) ?? { kcId: d.kcId, itemIds: [], lastMissed: 0 };
          if (!g.itemIds.includes(d.itemId)) g.itemIds.push(d.itemId);
          g.lastMissed = Math.max(g.lastMissed, d.ts ?? 0);
          byKc.set(d.kcId, g);
        }
      }
      return [...byKc.values()].sort((a, b) => b.lastMissed - a.lastMissed);
    },
  });

  async function reDrill(group: MistakeGroup) {
    if (!user) return;
    setDrilling(group.kcId);
    const { db } = getFirebase();
    const items: Item[] = [];
    for (const id of group.itemIds.slice(0, 10)) {
      const snap = await getDoc(doc(db, "items", id));
      if (snap.exists()) items.push({ id: snap.id, ...snap.data() } as Item);
    }
    const masterySnap = await getDoc(doc(db, "users", user.uid, "mastery", COURSE_ID));
    const states = (masterySnap.data()?.kcs ?? {}) as Record<string, { pL: number }>;
    const mastery: Record<string, number> = {};
    for (const it of items) mastery[it.kcId] = states[it.kcId]?.pL ?? DEFAULT_PARAMS.pL0;

    const sessionId = `review-${Date.now()}`;
    await setDoc(doc(db, "users", user.uid, "sessions", sessionId), {
      type: "review",
      startedAt: serverTimestamp(),
      endedAt: null,
      kcIds: [group.kcId],
    });
    startFixed(user.uid, sessionId, "review", items, mastery);
    router.push(`/quiz/${sessionId}`);
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  return (
    <Stagger className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-headline-md text-fg-primary">Mistake bank</h1>
        <p className="mt-1 text-sm text-fg-secondary">
          Every question you&apos;ve missed, grouped by topic. Re-drill them
          until they stick.
        </p>
      </div>

      {!groups || groups.length === 0 ? (
        <Card level="base" className="p-8 text-center">
          <p className="text-body-base text-fg-primary">No mistakes recorded</p>
          <p className="mt-1 text-sm text-fg-secondary">
            Miss a question in practice and it lands here for re-drilling.
          </p>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.kcId} level="elevated" className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-medium capitalize text-fg-primary">
                {group.kcId.replace("kc-", "").replaceAll("-", " ")}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <Pill tone="warning">{group.itemIds.length} missed</Pill>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={drilling === group.kcId}
              onClick={() => reDrill(group)}
            >
              Re-drill
            </Button>
          </Card>
        ))
      )}
    </Stagger>
  );
}
