"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { collection, doc, getDocs, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { applyMasteryUpdates } from "@/lib/firebase/mastery";
import { QuestionBody, answerFromWorking, freshWorking, promptOf, type Working } from "@/components/learn/question-body";
import { useQuery } from "@tanstack/react-query";
import type { Item, Kc } from "@/lib/content/types";
import { MASTERY_THRESHOLD, initialiseFromPlacement } from "@/lib/bkt";
import { newlyUnlocked } from "@/lib/routing";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { isAssessment, useQuizSession } from "@/lib/quiz/session-store";
import { normalisedGain } from "@/lib/assessment";
import type { LearnerAnswer } from "@/lib/quiz/grade";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { Kbd } from "@/components/ui/kbd";
import { Pill } from "@/components/ui/pill";
import { SegmentedProgress } from "@/components/ui/progress";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { FeedbackPanel } from "@/components/learn/quiz/feedback-panel";
import { MasteryHud } from "@/components/learn/quiz/mastery-hud";
import { WhyPopover } from "@/components/learn/quiz/why-popover";
import { ConstellationInit } from "@/components/learn/constellation-init";
import { MasteryCelebration } from "@/components/learn/mastery-celebration";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const COURSE_ID = "trading-foundations";

export default function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const s = useQuizSession();
  const item = s.items[s.currentIndex];
  const [working, setWorking] = useState<Working>(() => freshWorking(item));
  const finishedRef = useRef(false);

  useEffect(() => {
    setWorking(freshWorking(item));
    s.markShown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.currentIndex, item?.id]);

  const answerFor = useCallback((it: Item): LearnerAnswer | null => answerFromWorking(it, working), [working]);

  const canSubmit = item ? answerFor(item) !== null : false;

  const submit = useCallback(() => {
    if (!item) return;
    const answer = answerFor(item);
    if (answer) s.submit(item, answer);
  }, [item, answerFor, s]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (s.phase === "feedback") s.next();
        else if (canSubmit) submit();
        return;
      }
      if (s.phase !== "answering" || !item) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1) return;
      const i = n - 1;
      if (item.payload.type === "mcq" && i < item.payload.options.length) {
        setWorking((w) => ({ ...w, mcq: i }));
      } else if (item.payload.type === "multi" && i < item.payload.options.length) {
        setWorking((w) => ({
          ...w,
          multi: w.multi.includes(i) ? w.multi.filter((x) => x !== i) : [...w.multi, i],
        }));
      } else if (item.payload.type === "tf-confidence" && n <= 2) {
        setWorking((w) => ({ ...w, tf: n === 1 }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s, item, canSubmit, submit]);

  // ---- Completion: the mastery writes (one doc, one transaction, section 4) ----
  useEffect(() => {
    if (s.phase !== "complete" || !user || !s.sessionId || finishedRef.current) return;
    finishedRef.current = true;
    const { db } = getFirebase();
    const records = Object.values(s.answers);

    void (async () => {
      try {
        const correct = records.filter((r) => r.correct).length;
        await updateDoc(doc(db, "users", user.uid, "sessions", s.sessionId!), {
          endedAt: serverTimestamp(),
          score: { correct, total: records.length },
        });

        // A post-test is a measurement. The responses are logged against
        // the model's current estimate; the model itself is left alone.
        if (s.sessionType === "post-test") return;

        if (s.sessionType === "placement") {
          // Finishing a placement: initialise pL0 per KC from what I just saw.
          const kcsSnap = await getDocs(collection(db, "kcs"));
          const kcIds = kcsSnap.docs.map((d) => d.id);
          const initial = initialiseFromPlacement(
            records.map((r) => ({ kcId: r.kcId, correct: r.correct })),
            kcIds,
          );
          const kcsMap: Record<string, unknown> = {};
          for (const kcId of kcIds) {
            kcsMap[kcId] = {
              pL: initial[kcId],
              attempts: records.filter((r) => r.kcId === kcId).length,
              lastSeen: Date.now(),
              masteredAt: (initial[kcId] ?? 0) >= MASTERY_THRESHOLD ? Date.now() : null,
            };
          }
          await runTransaction(db, async (tx) => {
            const ref = doc(db, "users", user.uid, "mastery", COURSE_ID);
            tx.set(ref, { kcs: kcsMap, history: [], updatedAt: serverTimestamp() }, { merge: true });
          });
          return;
        }

        const attempts: Record<string, number> = {};
        for (const r of records) attempts[r.kcId] = (attempts[r.kcId] ?? 0) + 1;
        await applyMasteryUpdates(db, user.uid, COURSE_ID, s.mastery, attempts);
      } catch {
        // The responses are already safe in the append-only log. The mastery
        // doc catches up on the next completed session.
      }
    })();
  }, [s.phase, user, s.sessionId, s.answers, s.mastery, s.sessionType]);

  if (!s.sessionId || s.sessionId !== sessionId || !item) {
    if (s.phase === "complete" && s.sessionId === sessionId) {
      return <Complete />;
    }
    return (
      <div className="mx-auto max-w-md pt-20 text-center">
        <h1 className="text-headline-md text-fg-primary">No active session</h1>
        <p className="mt-2 text-body-base text-fg-secondary">Start a practice session first.</p>
        <Link href="/practice" className="mt-6 inline-block">
          <Button>Start practice</Button>
        </Link>
      </div>
    );
  }

  if (s.phase === "complete") {
    return <Complete />;
  }

  const record = s.answers[item.id];
  const reason = s.reasons[item.id];
  const lessonHref = `/lesson/${item.kcId}`;
  const isPlacement = isAssessment(s.sessionType);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-10 pt-6">
      <header className="flex items-center gap-4">
        <SegmentedProgress
          total={s.targetLength}
          completed={s.currentIndex}
          current={s.currentIndex}
          className="max-w-40 flex-shrink"
        />
        <span className="num text-sm text-fg-secondary">
          {s.currentIndex + 1}/{s.targetLength}
        </span>
        {!isPlacement && (
          <MasteryHud
            kcTitle={item.kcId.replace("kc-", "").replaceAll("-", " ")}
            pL={s.mastery[item.kcId] ?? 0}
          />
        )}
        <Link
          href="/dashboard"
          aria-label="Exit session"
          className="flex h-11 w-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-200 hover:bg-white/5 hover:text-fg-primary"
        >
          ✕
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-8">
        <AnimatePresence mode="popLayout" custom={s.direction}>
          <motion.div
            key={item.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40 * s.direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -24 * s.direction }}
            transition={{ duration: 0.3, ease: ease.choreo }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-caps uppercase tracking-wider text-fg-secondary">
                {item.kcId.replace("kc-", "").replaceAll("-", " ")} · {item.difficulty}
              </span>
              <div className="flex items-center gap-2">
                {reason && <WhyPopover reason={reason} />}
                <span
                  data-testid="question-type"
                  data-item-id={item.id}
                  className="text-label-caps uppercase tracking-wider text-fg-muted"
                >
                  {item.type}
                </span>
              </div>
            </div>

            <h1 className="text-headline-md text-fg-primary">{promptOf(item)}</h1>

            <QuestionBody
              item={item}
              working={working}
              setWorking={(update) => setWorking(update)}
              disabled={s.phase === "feedback"}
              graded={!!record}
            />

            {s.phase === "answering" ? (
              <div className="flex items-center justify-end gap-3">
                <span className="hidden items-center gap-1.5 text-xs text-fg-muted sm:flex">
                  {(item.payload.type === "mcq" || item.payload.type === "multi") && (
                    <>
                      <Kbd>1</Kbd>–<Kbd>4</Kbd>
                    </>
                  )}
                  <Kbd>↵ Enter</Kbd>
                </span>
                <Button onClick={submit} disabled={!canSubmit}>
                  Submit answer
                </Button>
              </div>
            ) : (
              record && (
                <FeedbackPanel
                  correct={record.correct}
                  explanation={item.explanation}
                  lessonHref={lessonHref}
                  onContinue={s.next}
                  isLast={s.items.length >= s.targetLength && s.currentIndex + 1 >= s.items.length}
                />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Complete() {
  const type = useQuizSession((s) => s.sessionType);
  if (type === "placement") return <PlacementComplete />;
  if (type === "post-test") return <PostTestComplete />;
  return <SessionSummary />;
}

/** The end of the post-test: the score, set against placement if there was one. */
function PostTestComplete() {
  const { user } = useAuth();
  const s = useQuizSession();
  const records = Object.values(s.answers);
  const correct = records.filter((r) => r.correct).length;
  const total = records.length;

  const { data: placement } = useQuery({
    queryKey: ["placement-score", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const { db } = getFirebase();
      const snap = await getDocs(
        query(collection(db, "users", user!.uid, "sessions"), where("type", "==", "placement")),
      );
      const done = snap.docs.find((d) => d.data().endedAt);
      if (!done) return null;
      const stored = done.data().score as { correct: number; total: number } | undefined;
      if (stored) return stored;
      // Placements completed before scores were stored on the session doc.
      const rs = await getDocs(collection(db, "users", user!.uid, "sessions", done.id, "responses"));
      return { correct: rs.docs.filter((d) => d.data().correct).length, total: rs.size };
    },
  });

  const gain = placement ? normalisedGain(placement.correct, correct, total) : null;

  return (
    <Stagger autoWrap={false} className="mx-auto max-w-md space-y-8 px-4 pt-16 text-center">
      <StaggerItem>
        <p className="text-label-caps uppercase tracking-widest text-fg-secondary">Post-test complete</p>
        <p className="num mt-6 text-display-lg text-fg-primary" data-testid="post-test-score">
          {correct}/{total}
        </p>
        {placement ? (
          <p className="mt-3 text-body-base text-fg-secondary">
            At placement you scored {placement.correct}/{placement.total}.
            {gain !== null && gain > 0 && (
              <>
                {" "}
                That&apos;s {Math.round(gain * 100)}% of the ground you had left to make up.
              </>
            )}
            {gain !== null && gain <= 0 && <> No change on this measure this time.</>}
            {gain === null && placement.correct >= placement.total && (
              <> You were already at the ceiling, so there was nothing to gain here.</>
            )}
          </p>
        ) : (
          <p className="mt-3 text-body-base text-fg-secondary">
            There&apos;s no placement score to compare with, so this stands on its own.
          </p>
        )}
      </StaggerItem>
      <StaggerItem>
        <ul className="mx-auto grid max-w-sm grid-cols-2 gap-x-6 gap-y-1.5 text-left text-sm">
          {records.map((r) => (
            <li key={r.itemId} className="flex items-center gap-2 text-fg-secondary">
              <span aria-hidden="true" className={r.correct ? "text-mastery" : "text-fg-muted"}>
                {r.correct ? "✓" : "✗"}
              </span>
              <span className="truncate">
                <span className="sr-only">{r.correct ? "Correct: " : "Wrong: "}</span>
                {r.kcId.replace("kc-", "").replaceAll("-", " ")}
              </span>
            </li>
          ))}
        </ul>
      </StaggerItem>
      <StaggerItem className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/survey">
          <Button>Rate the course (2 minutes)</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost">Back to dashboard</Button>
        </Link>
      </StaggerItem>
    </Stagger>
  );
}

/** The end of placement: the model-initialisation moment. */
function PlacementComplete() {
  const router = useRouter();
  const s = useQuizSession();

  const { data: kcs } = useQuery({
    queryKey: ["kcs", COURSE_ID],
    queryFn: async () => {
      const snap = await getDocs(collection(getFirebase().db, "kcs"));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kc);
    },
  });

  const initial = useMemo(() => {
    const records = Object.values(s.answers);
    return initialiseFromPlacement(
      records.map((r) => ({ kcId: r.kcId, correct: r.correct })),
      (kcs ?? []).map((k) => k.id),
    );
  }, [s.answers, kcs]);

  if (!kcs) return null;

  return (
    <ConstellationInit
      kcs={kcs}
      mastery={initial}
      onContinue={() => router.push("/dashboard")}
    />
  );
}

function SessionSummary() {
  const s = useQuizSession();
  const reduced = useReducedMotion();
  const records = Object.values(s.answers);
  const correct = records.filter((r) => r.correct).length;

  // Unlock detection needs the FULL prerequisite graph, not just the KCs
  // that happened to be in this session.
  const { data: allKcs } = useQuery({
    queryKey: ["kcs", COURSE_ID],
    queryFn: async () => {
      const snap = await getDocs(collection(getFirebase().db, "kcs"));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kc);
    },
  });
  const [celebrating, setCelebrating] = useState(() =>
    Object.entries(s.mastery).some(
      ([kcId, pL]) =>
        pL >= MASTERY_THRESHOLD && (s.masteryAtStart[kcId] ?? 0) < MASTERY_THRESHOLD,
    ),
  );

  const crossedKc = Object.entries(s.mastery).find(
    ([kcId, pL]) => pL >= MASTERY_THRESHOLD && (s.masteryAtStart[kcId] ?? 0) < MASTERY_THRESHOLD,
  )?.[0];

  const unlocked = useMemo(() => {
    if (!allKcs || allKcs.length === 0) return [];
    const toMap = (m: Record<string, number>) =>
      Object.fromEntries(Object.entries(m).map(([k, pL]) => [k, { pL, attempts: 1 }]));
    return newlyUnlocked(allKcs, toMap(s.masteryAtStart), toMap(s.mastery));
  }, [allKcs, s.masteryAtStart, s.mastery]);

  const perKc = useMemo(() => {
    const map = new Map<string, { before: number; after: number }>();
    for (const r of records) {
      const cur = map.get(r.kcId);
      map.set(r.kcId, { before: cur?.before ?? r.pLBefore, after: r.pLAfter });
    }
    return [...map.entries()];
  }, [records]);

  const accuracy = records.length ? correct / records.length : 0;

  return (
    <Stagger autoWrap={false} className="mx-auto max-w-md space-y-8 px-4 pt-16 text-center">
      {celebrating && crossedKc && (
        <MasteryCelebration
          kcTitle={crossedKc.replace("kc-", "").replaceAll("-", " ")}
          onDone={() => setCelebrating(false)}
        />
      )}
      <StaggerItem>
        <p className="text-label-caps uppercase tracking-widest text-fg-secondary">Session complete</p>
        {/* The score rolls up, and a thin arc underneath it fills to the
            accuracy so the number has a shape as well as a value. */}
        <div className="relative mx-auto mt-10 inline-block">
          <svg
            aria-hidden="true"
            width="180"
            height="100"
            viewBox="0 0 180 100"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%]"
          >
            <path d="M 14 94 A 76 76 0 0 1 166 94" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" strokeLinecap="round" />
            <motion.path
              d="M 14 94 A 76 76 0 0 1 166 94"
              fill="none"
              stroke={accuracy >= 0.7 ? "var(--mastery)" : "var(--warning)"}
              strokeWidth="4"
              strokeLinecap="round"
              initial={reduced ? { pathLength: accuracy } : { pathLength: 0 }}
              animate={{ pathLength: accuracy }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ filter: "drop-shadow(0 0 6px var(--mastery-glow))" }}
            />
          </svg>
          <p className="num relative text-5xl text-fg-primary">
            <Counter value={correct} />
            <span className="text-fg-muted">/{records.length}</span>
          </p>
        </div>
        <p className="mt-1 text-sm text-fg-secondary">answers correct</p>
      </StaggerItem>

      <StaggerItem className="space-y-2 text-left">
        {perKc.map(([kcId, { before, after }], i) => {
          const gained = after >= before;
          return (
            <div
              key={kcId}
              className="rounded-control bg-bg-elevated-veil px-4 py-3 shadow-edge-lit transition-[background-color,box-shadow] duration-200 hover:bg-bg-elevated hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm capitalize text-fg-secondary">
                  {kcId.replace("kc-", "").replaceAll("-", " ")}
                </span>
                <span className="num text-sm">
                  <span className="text-fg-muted">{Math.round(before * 100)}%</span>
                  <span className="mx-2 text-fg-muted">→</span>
                  <span className={gained ? "text-mastery-bright" : "text-warning"}>
                    {Math.round(after * 100)}%
                  </span>
                </span>
              </div>
              {/* The bar underneath: the muted stretch is where you started,
                  the coloured stretch is the move. Losses draw in amber and
                  a little slower, per the emotional rule. */}
              <div className="relative mt-2 h-1 w-full overflow-hidden rounded-pill bg-white/5" aria-hidden="true">
                <div
                  className="absolute inset-y-0 left-0 rounded-pill bg-white/15"
                  style={{ width: `${Math.min(before, after) * 100}%` }}
                />
                <motion.div
                  className={cn("absolute inset-y-0 rounded-pill", gained ? "bg-mastery" : "bg-warning")}
                  style={{ left: `${Math.min(before, after) * 100}%` }}
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${Math.abs(after - before) * 100}%` }}
                  transition={
                    reduced
                      ? { duration: 0.15 }
                      : { duration: gained ? 0.7 : 1, delay: 0.5 + i * 0.08, ease: [0.16, 1, 0.3, 1] }
                  }
                />
              </div>
            </div>
          );
        })}
      </StaggerItem>

      {unlocked.length > 0 && (
        <StaggerItem>
          <Pill tone="mastery" dot className="normal-case tracking-normal shadow-[0_0_18px_var(--mastery-glow)]">
            New topic unlocked: {unlocked.map((u) => u.replace("kc-", "").replaceAll("-", " ")).join(", ")}
          </Pill>
        </StaggerItem>
      )}

      <StaggerItem className="flex flex-wrap justify-center gap-3">
        <Link href={`/quiz/${s.sessionId}/review`}>
          <Button variant="ghost">Review answers</Button>
        </Link>
        <Link href={unlocked.length > 0 ? `/skill-tree?unlocked=${unlocked.join(",")}` : "/skill-tree"}>
          <Button variant="secondary">See your map</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Continue</Button>
        </Link>
      </StaggerItem>
    </Stagger>
  );
}
