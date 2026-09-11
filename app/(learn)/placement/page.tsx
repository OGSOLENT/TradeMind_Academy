"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import type { Item, Kc } from "@/lib/content/types";
import { DEFAULT_PARAMS } from "@/lib/bkt";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { useQuizSession } from "@/lib/quiz/session-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

const COURSE_ID = "trading-foundations";

/**
 * The placement flow (onboarding_placement_test). A short pretest across
 * every Level-1 KC seeds the learner model. Skipping is a perfectly valid
 * choice, and a logged one: it just starts everything at the default prior.
 */
export default function PlacementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const startFixed = useQuizSession((s) => s.startFixed);
  const [busy, setBusy] = useState<"start" | "skip" | null>(null);

  async function begin() {
    if (!user) return;
    setBusy("start");
    const { db } = getFirebase();
    const [kcsSnap, itemsSnap] = await Promise.all([
      getDocs(collection(db, "kcs")),
      getDocs(query(collection(db, "items"), where("isPretestEligible", "==", true))),
    ]);
    const kcs = kcsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kc);
    const eligible = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);

    // One eligible item per KC, in prerequisite order.
    const picked: Item[] = [];
    for (const kc of kcs) {
      const it = eligible.find((e) => e.kcId === kc.id && !picked.includes(e));
      if (it) picked.push(it);
    }

    const mastery: Record<string, number> = {};
    for (const kc of kcs) mastery[kc.id] = DEFAULT_PARAMS.pL0;

    const sessionId = `placement-${Date.now()}`;
    await setDoc(doc(db, "users", user.uid, "sessions", sessionId), {
      type: "placement",
      startedAt: serverTimestamp(),
      endedAt: null,
      kcIds: picked.map((i) => i.kcId),
    });

    startFixed(user.uid, sessionId, "placement", picked, mastery);
    router.push(`/quiz/${sessionId}`);
  }

  async function skip() {
    if (!user) return;
    setBusy("skip");
    const { db } = getFirebase();
    const kcsSnap = await getDocs(collection(db, "kcs"));
    const kcs: Record<string, { pL: number; attempts: number; lastSeen: number; masteredAt: null }> = {};
    for (const d of kcsSnap.docs) {
      kcs[d.id] = { pL: DEFAULT_PARAMS.pL0, attempts: 0, lastSeen: Date.now(), masteredAt: null };
    }
    await setDoc(
      doc(db, "users", user.uid, "mastery", COURSE_ID),
      { kcs, history: [], updatedAt: serverTimestamp() },
      { merge: true },
    );
    router.push("/dashboard");
  }

  return (
    <Stagger className="mx-auto max-w-xl pt-12">
      <Card level="elevated" className="p-8 text-center">
        <Pill tone="accent" dot>
          One-time calibration
        </Pill>
        <h1 className="mt-4 text-display-lg-mobile text-fg-primary">
          Let&apos;s map what you already know
        </h1>
        <p className="mx-auto mt-3 max-w-md text-body-base text-fg-secondary">
          Eight quick questions — one per topic — seed your personal knowledge
          model. There&apos;s no pass or fail; wrong answers are just as
          informative as right ones.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={begin} loading={busy === "start"} disabled={busy !== null}>
            Start placement
          </Button>
          <Button variant="ghost" onClick={skip} loading={busy === "skip"} disabled={busy !== null}>
            Skip — start from scratch
          </Button>
        </div>
        <p className="mt-4 text-xs text-fg-secondary">
          Skipping starts every topic at the default prior (25%).
        </p>
      </Card>
    </Stagger>
  );
}
