"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Item } from "@/lib/content/types";
import { MASTERY_THRESHOLD } from "@/lib/bkt";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { useQuizSession } from "@/lib/quiz/session-store";
import type { LearnerAnswer } from "@/lib/quiz/grade";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { SegmentedProgress } from "@/components/ui/progress";
import { McqOptions } from "@/components/learn/questions/mcq";
import { NumericInput } from "@/components/learn/questions/numeric";
import { OrderingList } from "@/components/learn/questions/ordering";
import { TfConfidence } from "@/components/learn/questions/tf-confidence";
import { AnnotationChart, type AnnotationValue } from "@/components/learn/questions/annotation";
import { FeedbackPanel } from "@/components/learn/quiz/feedback-panel";
import { ease } from "@/lib/motion";

const COURSE_ID = "trading-foundations";

/** Per-type working answer state. */
interface Working {
  mcq: number | null;
  multi: number[];
  numeric: number | null;
  ordering: number[];
  annotation: AnnotationValue | null;
  tf: boolean | null;
  confidence: number;
}

function freshWorking(item: Item | undefined): Working {
  const orderingLength = item?.payload.type === "ordering" ? item.payload.entries.length : 0;
  return {
    mcq: null,
    multi: [],
    numeric: null,
    ordering: Array.from({ length: orderingLength }, (_, i) => i),
    annotation: null,
    tf: null,
    confidence: 70,
  };
}

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

  const answerFor = useCallback(
    (it: Item): LearnerAnswer | null => {
      switch (it.payload.type) {
        case "mcq":
          return working.mcq === null ? null : { type: "mcq", selected: working.mcq };
        case "multi":
          return working.multi.length === 0 ? null : { type: "multi", selected: working.multi };
        case "numeric":
          return working.numeric === null ? null : { type: "numeric", value: working.numeric };
        case "ordering":
          return { type: "ordering", order: working.ordering };
        case "annotation":
          return working.annotation === null
            ? null
            : { type: "annotation", time: working.annotation.time, price: working.annotation.price };
        case "tf-confidence":
          return working.tf === null
            ? null
            : { type: "tf-confidence", value: working.tf, confidence: working.confidence };
      }
    },
    [working],
  );

  const canSubmit = item ? answerFor(item) !== null : false;

  const submit = useCallback(() => {
    if (!item) return;
    const answer = answerFor(item);
    if (answer) s.submit(item, answer);
  }, [item, answerFor, s]);

  // Keyboard: 1–9 select/toggle, Enter submit/continue (§6 Phase 3).
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

  // Session completion: endedAt + single-transaction mastery write (§4).
  useEffect(() => {
    if (s.phase !== "complete" || !user || !s.sessionId || finishedRef.current) return;
    if (s.sessionType === "placement") return; // placement is finalised by its own flow (Phase 4)
    finishedRef.current = true;
    const { db } = getFirebase();
    const records = Object.values(s.answers);

    void (async () => {
      try {
        await updateDoc(doc(db, "users", user.uid, "sessions", s.sessionId!), {
          endedAt: serverTimestamp(),
        });
        await runTransaction(db, async (tx) => {
          const ref = doc(db, "users", user.uid, "mastery", COURSE_ID);
          const snap = await tx.get(ref);
          const existing = (snap.data()?.kcs ?? {}) as Record<
            string,
            { pL: number; attempts: number; lastSeen: number; masteredAt: number | null }
          >;
          const kcs = { ...existing };
          const byKc = new Map<string, number>();
          for (const r of records) byKc.set(r.kcId, (byKc.get(r.kcId) ?? 0) + 1);
          for (const [kcId, attemptCount] of byKc) {
            const prev = kcs[kcId];
            const pL = s.mastery[kcId] ?? prev?.pL ?? 0;
            kcs[kcId] = {
              pL,
              attempts: (prev?.attempts ?? 0) + attemptCount,
              lastSeen: Date.now(),
              masteredAt: prev?.masteredAt ?? (pL >= MASTERY_THRESHOLD ? Date.now() : null),
            };
          }
          tx.set(ref, { kcs, updatedAt: serverTimestamp() }, { merge: true });
        });
      } catch {
        // mastery write failures must not lose the session; responses are
        // already safe in the append-only log via the queue.
      }
    })();
  }, [s.phase, user, s.sessionId, s.answers, s.mastery, s.sessionType]);

  if (!s.sessionId || s.sessionId !== sessionId || !item) {
    if (s.phase === "complete" && s.sessionId === sessionId) {
      return <SessionSummary />;
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

  if (s.phase === "complete") return <SessionSummary />;

  const record = s.answers[item.id];
  const lessonHref = `/lesson/${item.kcId}-lesson`;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-10 pt-6">
      <header className="flex items-center gap-4">
        <SegmentedProgress
          total={s.items.length}
          completed={s.currentIndex}
          current={s.currentIndex}
          className="flex-1"
        />
        <span className="num text-sm text-fg-secondary">
          {s.currentIndex + 1}/{s.items.length}
        </span>
        <Link
          href="/lesson/kc-candlestick-anatomy-lesson"
          aria-label="Exit session"
          className="flex h-11 w-11 items-center justify-center rounded-control text-fg-muted hover:bg-white/5 hover:text-fg-primary"
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
            <span
              data-testid="question-type"
              className="text-label-caps uppercase tracking-wider text-fg-muted"
            >
              {item.type}
            </span>
          </div>

          <h1 className="text-headline-md text-fg-primary">
            {"question" in item.payload ? item.payload.question : item.payload.statement}
          </h1>

          {item.payload.type === "mcq" && (
            <McqOptions
              options={item.payload.options}
              selected={working.mcq}
              onSelect={(i) => setWorking((w) => ({ ...w, mcq: i }))}
              disabled={s.phase === "feedback"}
              reveal={
                record && item.answerKey.type === "mcq"
                  ? { correct: item.answerKey.correct, chosen: working.mcq ?? -1 }
                  : null
              }
            />
          )}
          {item.payload.type === "multi" && (
            <McqOptions
              multi
              options={item.payload.options}
              selected={null}
              onSelect={() => {}}
              selectedMulti={working.multi}
              onToggle={(i) =>
                setWorking((w) => ({
                  ...w,
                  multi: w.multi.includes(i) ? w.multi.filter((x) => x !== i) : [...w.multi, i],
                }))
              }
              disabled={s.phase === "feedback"}
            />
          )}
          {item.payload.type === "numeric" && (
            <NumericInput
              unit={item.payload.unit}
              min={item.payload.min}
              max={item.payload.max}
              step={item.payload.step}
              value={working.numeric}
              onChange={(v) => setWorking((w) => ({ ...w, numeric: v }))}
              disabled={s.phase === "feedback"}
            />
          )}
          {item.payload.type === "ordering" && (
            <OrderingList
              entries={item.payload.entries}
              order={working.ordering}
              onChange={(order) => setWorking((w) => ({ ...w, ordering: order }))}
              disabled={s.phase === "feedback"}
            />
          )}
          {item.payload.type === "annotation" && (
            <AnnotationChart
              candles={item.payload.candles}
              describe={item.payload.describe}
              value={working.annotation}
              onChange={(v) => setWorking((w) => ({ ...w, annotation: v }))}
              disabled={s.phase === "feedback"}
              revealZone={
                record && item.answerKey.type === "annotation" ? item.answerKey.zone : null
              }
            />
          )}
          {item.payload.type === "tf-confidence" && (
            <TfConfidence
              value={working.tf}
              confidence={working.confidence}
              onChange={(value, confidence) => setWorking((w) => ({ ...w, tf: value, confidence }))}
              disabled={s.phase === "feedback"}
            />
          )}

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
                isLast={s.currentIndex + 1 >= s.items.length}
              />
            )
          )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function SessionSummary() {
  const s = useQuizSession();
  const records = Object.values(s.answers);
  const correct = records.filter((r) => r.correct).length;

  const perKc = useMemo(() => {
    const map = new Map<string, { before: number; after: number }>();
    for (const r of records) {
      const cur = map.get(r.kcId);
      map.set(r.kcId, { before: cur?.before ?? r.pLBefore, after: r.pLAfter });
    }
    return [...map.entries()];
  }, [records]);

  return (
    <div className="mx-auto max-w-md space-y-8 px-4 pt-16 text-center">
      <div>
        <p className="text-label-caps uppercase tracking-widest text-fg-secondary">Session complete</p>
        <p className="num mt-4 text-5xl text-fg-primary">
          {correct}
          <span className="text-fg-muted">/{records.length}</span>
        </p>
        <p className="mt-1 text-sm text-fg-secondary">answers correct</p>
      </div>

      <div className="space-y-2 text-left">
        {perKc.map(([kcId, { before, after }]) => (
          <div
            key={kcId}
            className="flex items-center justify-between rounded-control bg-bg-elevated px-4 py-3 shadow-edge-lit"
          >
            <span className="text-sm capitalize text-fg-secondary">
              {kcId.replace("kc-", "").replaceAll("-", " ")}
            </span>
            <span className="num text-sm">
              <span className="text-fg-muted">{Math.round(before * 100)}%</span>
              <span className="mx-2 text-fg-muted">→</span>
              <span className={after >= before ? "text-mastery-bright" : "text-warning"}>
                {Math.round(after * 100)}%
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <Link href="/practice">
          <Button variant="secondary">Practise again</Button>
        </Link>
        <Link href="/lesson/kc-candlestick-anatomy-lesson">
          <Button>Keep learning</Button>
        </Link>
      </div>
    </div>
  );
}
