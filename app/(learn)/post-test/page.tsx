"use client";

import { useTitle } from "@/lib/use-title";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import type { Item, Kc } from "@/lib/content/types";
import { DEFAULT_PARAMS } from "@/lib/bkt";
import { pickAssessment } from "@/lib/assessment";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { useQuizSession } from "@/lib/quiz/session-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Stagger } from "@/components/motion/stagger";
import { LazyParticleField } from "@/components/three/lazy-particle-field";

const COURSE_ID = "trading-foundations";

/**
 * The post-test. The same shape as placement (one question per module,
 * fixed order) but a different question wherever the module has one, and
 * it never touches the learner model: it's a measurement, taken once
 * you've worked through the course, so the two scores can be compared.
 * The model's current estimate is logged as pLBefore on every answer,
 * which makes the post-test a held-out check of the model as well.
 */
export default function PostTestPage() {
  useTitle("Post-test");
  const router = useRouter();
  const { user } = useAuth();
  const startFixed = useQuizSession((s) => s.startFixed);
  const [busy, setBusy] = useState(false);

  const { data: prior } = useQuery({
    queryKey: ["assessments", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const { db } = getFirebase();
      const snap = await getDocs(collection(db, "users", user!.uid, "sessions"));
      let placement = false;
      let postTests = 0;
      let practice = 0;
      for (const d of snap.docs) {
        const t = d.data().type as string;
        if (t === "placement" && d.data().endedAt) placement = true;
        else if (t === "post-test" && d.data().endedAt) postTests++;
        else if (d.data().endedAt) practice++;
      }
      return { placement, postTests, practice };
    },
  });

  async function begin() {
    if (!user) return;
    setBusy(true);
    const { db } = getFirebase();
    const [kcsSnap, itemsSnap, masterySnap] = await Promise.all([
      getDocs(collection(db, "kcs")),
      getDocs(query(collection(db, "items"), where("isPretestEligible", "==", true))),
      getDoc(doc(db, "users", user.uid, "mastery", COURSE_ID)),
    ]);
    const kcs = kcsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kc);
    const eligible = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);
    const picked: Item[] = pickAssessment(kcs, eligible, "B");

    // The model's view going in, so every answer is logged against it.
    const current = (masterySnap.data()?.kcs ?? {}) as Record<string, { pL?: number }>;
    const mastery: Record<string, number> = {};
    for (const kc of kcs) mastery[kc.id] = current[kc.id]?.pL ?? DEFAULT_PARAMS.pL0;

    const sessionId = `post-test-${Date.now()}`;
    await setDoc(doc(db, "users", user.uid, "sessions", sessionId), {
      type: "post-test",
      startedAt: serverTimestamp(),
      endedAt: null,
      kcIds: picked.map((i) => i.kcId),
    });

    startFixed(user.uid, sessionId, "post-test", picked, mastery);
    router.push(`/quiz/${sessionId}`);
  }

  return (
    <Stagger className="mx-auto max-w-xl pt-12">
      <Card level="elevated" spotlight className="p-8 text-center">
        <LazyParticleField count={320} wave={0.4} intensity={0.5} spread={[14, 8, 6]} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(94,106,210,0.16),transparent_70%)]"
        />
        <Pill tone="accent" dot>
          Measurement, not practice
        </Pill>
        <h1 className="mt-4 text-display-lg-mobile text-fg-primary">Post-test</h1>
        <p className="mx-auto mt-3 max-w-md text-body-base text-fg-secondary">
          Sixteen questions, one per module, the same shape as your placement
          but different questions. Nothing here changes your knowledge model;
          it&apos;s a snapshot to set against where you started.
        </p>
        {prior && !prior.placement && (
          <p className="mx-auto mt-4 max-w-md rounded-card border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-fg-secondary">
            You skipped placement, so there&apos;s no &ldquo;before&rdquo; score to
            compare with. You can still take the post-test.
          </p>
        )}
        {prior && prior.practice < 3 && (
          <p className="mx-auto mt-4 max-w-md text-sm text-fg-secondary">
            You&apos;ve completed {prior.practice} practice{" "}
            {prior.practice === 1 ? "session" : "sessions"}. The post-test means
            more after you&apos;ve worked through the course, but it&apos;s your call.
          </p>
        )}
        {prior && prior.postTests > 0 && (
          <p className="mx-auto mt-4 max-w-md text-sm text-fg-secondary">
            You&apos;ve taken the post-test {prior.postTests === 1 ? "once" : `${prior.postTests} times`} already.
            The analysis uses your first attempt.
          </p>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={begin} loading={busy} disabled={busy}>
            Start post-test
          </Button>
          <Link href="/profile">
            <Button variant="ghost" disabled={busy}>
              Not now
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-fg-secondary">
          About five minutes. Your answers are logged for the study you consented to.
        </p>
      </Card>
    </Stagger>
  );
}
