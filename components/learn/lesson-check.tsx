"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import type { Item } from "@/lib/content/types";
import { DEFAULT_PARAMS, MASTERY_THRESHOLD, updateMastery } from "@/lib/bkt";
import { grade, type LearnerAnswer } from "@/lib/quiz/grade";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { applyMasteryUpdates } from "@/lib/firebase/mastery";
import { getLogger } from "@/lib/logging";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/ui/counter";
import { Kbd } from "@/components/ui/kbd";
import { Pill } from "@/components/ui/pill";
import { MasteryCelebration } from "@/components/learn/mastery-celebration";
import { QuestionBody, answerFromWorking, freshWorking, promptOf, type Working } from "@/components/learn/question-body";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The check at the end of every lesson.
 *
 * Three questions from the module's bank, one at a time. Get one right and
 * there's a small burst and a word of encouragement. Get one wrong and it
 * doesn't just say so: it shows the answer, explains the idea in a line,
 * and then hands you a similar question from the same module so you can
 * prove the idea landed. Miss that too and it tells you the answer again
 * and moves on, because practice will bring it back round.
 *
 * None of this is theatre. Every answer, including the retries, goes into
 * the append-only response log with the model's estimate before and after,
 * and the mastery document updates at the end exactly as it would after a
 * practice session. So the numbers on the dashboard move because of what
 * you did here. Wrong answers stay amber and calm, never red.
 */

const COURSE_ID = "trading-foundations";
const QUESTIONS = 3;

const CORRECT = ["Nailed it.", "That's the one.", "Exactly right.", "Clean.", "You've got this."];
const WRONG = [
  "Not quite, and this one catches a lot of people.",
  "Close. Here's the bit that matters:",
  "Nearly. Let's look at why:",
];
const RETRY_CORRECT = ["That's it. It clicked.", "See? You had it.", "Now it's yours."];
const RETRY_WRONG = ["Still tricky. Here's the answer, and practice will bring it back round."];

type Phase = "idle" | "loading" | "question" | "correct" | "teach" | "retry" | "retry-correct" | "retry-wrong" | "done";

interface Attempt {
  item: Item;
  correct: boolean;
  retry: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Three items, spread across question types where the bank allows. */
function pickPlan(pool: Item[]): Item[] {
  const byType = new Map<string, Item[]>();
  for (const it of shuffle(pool)) {
    const list = byType.get(it.type) ?? [];
    list.push(it);
    byType.set(it.type, list);
  }
  const plan: Item[] = [];
  const types = shuffle([...byType.keys()]);
  let round = 0;
  while (plan.length < QUESTIONS && round < 10) {
    for (const t of types) {
      const next = byType.get(t)?.shift();
      if (next) plan.push(next);
      if (plan.length === QUESTIONS) break;
    }
    round++;
  }
  return plan;
}

/** A similar question: same module, not yet used, same difficulty if there is one. */
function pickSimilar(pool: Item[], used: Set<string>, like: Item): Item | null {
  const fresh = pool.filter((it) => !used.has(it.id));
  return (
    fresh.find((it) => it.difficulty === like.difficulty && it.type === like.type) ??
    fresh.find((it) => it.difficulty === like.difficulty) ??
    fresh[0] ??
    null
  );
}

/** A dozen sparks from the centre of the feedback line. */
function Burst({ tone }: { tone: "mastery" | "accent" }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className={cn("absolute h-1.5 w-1.5 rounded-pill", tone === "mastery" ? "bg-mastery-bright" : "bg-accent-bright")}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * (28 + (i % 3) * 10), y: Math.sin(a) * (28 + (i % 3) * 10), opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

export function LessonCheck({
  kcId,
  kcTitle,
  lessonId,
  excludeItemId,
  nextHref,
  nextLabel,
}: {
  kcId: string;
  kcTitle: string;
  lessonId: string;
  excludeItemId?: string | null;
  nextHref: string;
  nextLabel: string;
}) {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [pool, setPool] = useState<Item[]>([]);
  const [plan, setPlan] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<Item | null>(null);
  const [working, setWorking] = useState<Working>(() => freshWorking(undefined));
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [pLStart, setPLStart] = useState(DEFAULT_PARAMS.pL0);
  const [pL, setPL] = useState(DEFAULT_PARAMS.pL0);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string | null>(null);
  const shownAt = useRef(Date.now());
  const used = useRef(new Set<string>());
  const copyIndex = useRef(0);

  const answering = phase === "question" || phase === "retry";
  const onRetry = phase === "retry" || phase === "retry-correct" || phase === "retry-wrong";
  const graded = phase === "correct" || phase === "teach" || phase === "retry-correct" || phase === "retry-wrong";
  const canSubmit = !!current && answerFromWorking(current, working) !== null;

  const show = useCallback((item: Item) => {
    setCurrent(item);
    setWorking(freshWorking(item));
    used.current.add(item.id);
    shownAt.current = Date.now();
  }, []);

  const start = useCallback(async () => {
    if (!user) return;
    setPhase("loading");
    try {
      const { db } = getFirebase();
      const [itemsSnap, masterySnap] = await Promise.all([
        getDocs(query(collection(db, "items"), where("kcId", "==", kcId))),
        getDoc(doc(db, "users", user.uid, "mastery", COURSE_ID)),
      ]);
      const items = itemsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Item)
        .filter((it) => it.id !== excludeItemId);
      if (items.length === 0) {
        setError("There aren't any questions for this module yet.");
        setPhase("idle");
        return;
      }
      const state = (masterySnap.data()?.kcs ?? {}) as Record<string, { pL: number }>;
      const startPL = state[kcId]?.pL ?? DEFAULT_PARAMS.pL0;
      setPLStart(startPL);
      setPL(startPL);

      const id = `lesson-check-${Date.now()}`;
      sessionId.current = id;
      await setDoc(doc(db, "users", user.uid, "sessions", id), {
        type: "lesson-check",
        startedAt: serverTimestamp(),
        endedAt: null,
        kcIds: [kcId],
        lessonId,
      });

      const chosen = pickPlan(items);
      setPool(items);
      setPlan(chosen);
      setIndex(0);
      setAttempts([]);
      setStreak(0);
      setBestStreak(0);
      used.current = new Set();
      show(chosen[0]!);
      setPhase("question");
    } catch (err) {
      console.error("[lesson-check] could not start", err);
      setError("Couldn't load the check. Try again in a moment.");
      setPhase("idle");
    }
  }, [user, kcId, excludeItemId, lessonId, show]);

  const submit = useCallback(() => {
    if (!current || !user || !sessionId.current) return;
    const answer = answerFromWorking(current, working);
    if (!answer) return;
    const correct = grade(answer, current.answerKey);
    const before = pL;
    const after = updateMastery(before, correct).pL;
    const isRetry = phase === "retry";

    getLogger().enqueue({
      uid: user.uid,
      sessionId: sessionId.current,
      itemId: current.id,
      kcId: current.kcId,
      questionType: current.type,
      correct,
      selected: answer as LearnerAnswer,
      latencyMs: Math.max(0, Date.now() - shownAt.current),
      pLBefore: before,
      pLAfter: after,
      ts: Date.now(),
    });

    setPL(after);
    setAttempts((a) => [...a, { item: current, correct, retry: isRetry }]);
    if (correct) {
      setStreak((s) => {
        const n = s + 1;
        setBestStreak((b) => Math.max(b, n));
        return n;
      });
    } else {
      setStreak(0);
    }
    copyIndex.current++;
    if (isRetry) setPhase(correct ? "retry-correct" : "retry-wrong");
    else setPhase(correct ? "correct" : "teach");
  }, [current, user, working, pL, phase]);

  const advance = useCallback(() => {
    const nextIndex = index + 1;
    if (nextIndex < plan.length) {
      setIndex(nextIndex);
      show(plan[nextIndex]!);
      setPhase("question");
      return;
    }
    setPhase("done");
  }, [index, plan, show]);

  const retry = useCallback(() => {
    if (!current) return;
    const similar = pickSimilar(pool, used.current, current);
    if (!similar) {
      advance();
      return;
    }
    show(similar);
    setPhase("retry");
  }, [current, pool, show, advance]);

  // Finishing: close the session and write the model.
  useEffect(() => {
    if (phase !== "done" || !user || !sessionId.current) return;
    const { db } = getFirebase();
    const id = sessionId.current;
    void (async () => {
      try {
        await updateDoc(doc(db, "users", user.uid, "sessions", id), { endedAt: serverTimestamp() });
        await applyMasteryUpdates(db, user.uid, COURSE_ID, { [kcId]: pL }, { [kcId]: attempts.length });
      } catch (err) {
        // The responses are already safe in the append-only log. The mastery
        // doc catches up on the next completed session.
        console.error("[lesson-check] mastery write failed", err);
      }
    })();
    if (pL >= MASTERY_THRESHOLD && pLStart < MASTERY_THRESHOLD) setCelebrate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Enter submits or continues, like the quiz.
  useEffect(() => {
    if (phase === "idle" || phase === "loading" || phase === "done") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      if (answering && canSubmit) submit();
      else if (phase === "teach") retry();
      else if (graded) advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answering, canSubmit, graded, submit, retry, advance]);

  const firstTryCorrect = attempts.filter((a) => !a.retry && a.correct).length;
  const line = useMemo(() => {
    const i = copyIndex.current;
    if (phase === "correct") return CORRECT[i % CORRECT.length]!;
    if (phase === "teach") return WRONG[i % WRONG.length]!;
    if (phase === "retry-correct") return RETRY_CORRECT[i % RETRY_CORRECT.length]!;
    if (phase === "retry-wrong") return RETRY_WRONG[0]!;
    return "";
  }, [phase]);

  return (
    <section id="check" aria-label="Check yourself" className="scroll-mt-32">
      {celebrate && <MasteryCelebration kcTitle={kcTitle} onDone={() => setCelebrate(false)} />}
      <Card level="elevated" spotlight className="p-6 sm:p-7">
        {/* Header: what this is, and where you are in it. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pill tone="accent" dot>
              Check yourself
            </Pill>
            {phase !== "idle" && phase !== "loading" && phase !== "done" && (
              <span className="num text-sm text-fg-secondary">
                {Math.min(index + 1, QUESTIONS)}/{QUESTIONS}
                {onRetry && <span className="ml-1 text-warning">· similar</span>}
              </span>
            )}
          </div>
          {streak >= 2 && phase !== "done" && (
            <motion.span
              key={streak}
              initial={reduced ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16 }}
              className="num rounded-pill bg-mastery/10 px-2.5 py-1 text-xs text-mastery-bright shadow-[inset_0_0_0_1px_var(--mastery-glow)]"
            >
              ⚡ {streak} in a row
            </motion.span>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {(phase === "idle" || phase === "loading") && (
            <motion.div
              key="idle"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.35, ease: ease.choreo }}
              className="mt-4"
            >
              <h2 className="text-headline-md text-fg-primary">Did it stick?</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-fg-secondary">
                Three quick questions on {kcTitle}. If you miss one I&apos;ll show you the idea and
                hand you a similar one, so nothing gets left behind. Every answer teaches the model
                something about you.
              </p>
              {error && <p className="mt-3 text-sm text-warning">{error}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button onClick={start} loading={phase === "loading"}>
                  Start the check
                </Button>
                <span className="text-xs text-fg-muted">About two minutes</span>
              </div>
            </motion.div>
          )}

          {current && phase !== "idle" && phase !== "loading" && phase !== "done" && (
            <motion.div
              key={`${current.id}-${phase === "retry" ? "r" : "q"}`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, ease: ease.choreo }}
              className="mt-5 space-y-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-label-caps uppercase tracking-wider text-fg-secondary">
                  {onRetry ? "A similar one" : `Question ${index + 1}`} · {current.difficulty}
                </span>
                <span className="text-label-caps uppercase tracking-wider text-fg-muted">{current.type}</span>
              </div>
              <h3 className="text-body-base font-medium text-fg-primary">{promptOf(current)}</h3>

              <QuestionBody
                item={current}
                working={working}
                setWorking={(update) => setWorking(update)}
                disabled={!answering}
                graded={graded}
              />

              {answering && (
                <div className="flex items-center justify-end gap-3">
                  <span className="hidden items-center gap-1.5 text-xs text-fg-muted sm:flex">
                    <Kbd>↵ Enter</Kbd>
                  </span>
                  <Button onClick={submit} disabled={!canSubmit}>
                    Check answer
                  </Button>
                </div>
              )}

              {/* Feedback. Teal for right, amber for wrong. The wrong path
                  carries the explanation and the offer of a similar question. */}
              <AnimatePresence>
                {graded && (
                  <motion.div
                    key={phase}
                    role="status"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: ease.choreo }}
                    className={cn(
                      "relative rounded-card p-5 shadow-edge-lit",
                      phase === "correct" || phase === "retry-correct" ? "bg-mastery/10" : "bg-warning/10",
                    )}
                  >
                    {!reduced && (phase === "correct" || phase === "retry-correct") && <Burst tone="mastery" />}
                    <p
                      className={cn(
                        "font-medium",
                        phase === "correct" || phase === "retry-correct" ? "text-mastery-bright" : "text-warning",
                      )}
                    >
                      {line}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-fg-secondary">{current.explanation}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                      <span className="hidden items-center gap-1.5 text-xs text-fg-muted sm:flex">
                        <Kbd>↵ Enter</Kbd>
                      </span>
                      {phase === "teach" ? (
                        <>
                          <Button variant="ghost" onClick={advance}>
                            Skip
                          </Button>
                          <Button onClick={retry}>Try a similar one →</Button>
                        </>
                      ) : (
                        <Button onClick={advance} variant={phase === "retry-wrong" ? "secondary" : "primary"}>
                          {index + 1 < plan.length ? "Next question" : "See how you did"}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: ease.choreo }}
              className="mt-5"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-control bg-white/[0.03] p-4 shadow-hairline">
                  <p className="text-label-caps uppercase tracking-wider text-fg-secondary">First try</p>
                  <p className="mt-1 text-3xl text-fg-primary">
                    <Counter value={firstTryCorrect} />
                    <span className="num text-base text-fg-muted">/{plan.length}</span>
                  </p>
                </div>
                <div className="rounded-control bg-white/[0.03] p-4 shadow-hairline">
                  <p className="text-label-caps uppercase tracking-wider text-fg-secondary">Best streak</p>
                  <p className="mt-1 text-3xl text-mastery-bright">
                    <Counter value={bestStreak} />
                  </p>
                </div>
                <div className="rounded-control bg-white/[0.03] p-4 shadow-hairline">
                  <p className="text-label-caps uppercase tracking-wider text-fg-secondary">{kcTitle}</p>
                  <p className="num mt-1 text-lg">
                    <span className="text-fg-muted">{Math.round(pLStart * 100)}%</span>
                    <span className="mx-2 text-fg-muted">→</span>
                    <span className={pL >= pLStart ? "text-mastery-bright" : "text-warning"}>
                      <Counter value={Math.round(pL * 100)} suffix="%" />
                    </span>
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-fg-secondary">
                {firstTryCorrect === plan.length
                  ? "Every one first time. The model's estimate for this module just moved up, and it'll show on your dashboard."
                  : firstTryCorrect === 0
                    ? "A tough one. That's fine, the retries count too, and practice is where this gets locked in."
                    : "Solid. The ones you missed are exactly what the practice session will circle back to."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={nextHref}>
                  <Button>{nextLabel}</Button>
                </Link>
                <Link href="/practice">
                  <Button variant="secondary">Practise this module</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </section>
  );
}
