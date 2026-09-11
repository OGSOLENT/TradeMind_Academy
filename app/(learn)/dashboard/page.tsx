"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, orderBy, query, limit } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import type { Kc } from "@/lib/content/types";
import { MASTERY_THRESHOLD } from "@/lib/bkt";
import { nextActionFor, targetKcId, type MasteryMap, type NextAction } from "@/lib/routing";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Counter } from "@/components/ui/counter";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { LazyParticleField } from "@/components/three/lazy-particle-field";
import { KnowledgeModel } from "@/components/learn/knowledge-model";
import { ClockIcon, PulseIcon, SparkIcon } from "@/components/learn/stat-icons";
import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import type { HistoryPoint } from "@/components/learn/mastery-chart";
import { cn } from "@/lib/utils";

// lightweight-charts is heavy and sits below the fold, so I load it lazily.
const MasteryChart = dynamic(
  () => import("@/components/learn/mastery-chart").then((m) => m.MasteryChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px] w-full rounded-card" /> },
);

const COURSE_ID = "trading-foundations";
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

interface KcState {
  pL: number;
  attempts: number;
  lastSeen: number;
  masteredAt: number | null;
}

const actionCopy: Record<NextAction, { label: string; href(kcId: string): string }> = {
  lesson: { label: "Read the lesson", href: (kcId) => `/lesson/${kcId}` },
  practice: { label: "Practise now", href: () => "/practice" },
  remediate: { label: "Rebuild the basics", href: (kcId) => `/lesson/${kcId}` },
  advance: { label: "Advance", href: () => "/practice" },
};

/** "Good morning" and friends, from the local clock. */
function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late one";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [selectedKc, setSelectedKc] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["dashboard", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const { db } = getFirebase();
      const [kcsSnap, masterySnap, sessionsSnap] = await Promise.all([
        getDocs(collection(db, "kcs")),
        getDoc(doc(db, "users", user!.uid, "mastery", COURSE_ID)),
        getDocs(
          query(
            collection(db, "users", user!.uid, "sessions"),
            orderBy("startedAt", "desc"),
            limit(30),
          ),
        ),
      ]);
      const kcs = kcsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kc);
      const kcStates = (masterySnap.data()?.kcs ?? {}) as Record<string, KcState>;
      const history = (masterySnap.data()?.history ?? []) as Array<{
        ts: number;
        kcId: string;
        pL: number;
      }>;
      const sessionDays = sessionsSnap.docs
        .map((d) => d.data().startedAt?.toMillis?.() as number | undefined)
        .filter((t): t is number => typeof t === "number");
      return { kcs, kcStates, history, sessionDays };
    },
  });

  const masteryMap: MasteryMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(data?.kcStates ?? {}).map(([k, v]) => [
          k,
          { pL: v.pL, attempts: v.attempts },
        ]),
      ),
    [data],
  );

  // The header is static and renders on the server. It's the page's LCP
  // element and its h1, so it has to be there before anything else. The
  // greeting above it fades in once auth resolves, in a slot whose height
  // is reserved so nothing below it shifts.
  const firstName = user?.displayName?.trim().split(/\s+/)[0];
  const header = (
    <header>
      <p className="num min-h-4 text-label-caps uppercase tracking-[0.18em] text-fg-muted">
        {user && (
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block"
          >
            {greetingFor(new Date())}
            {firstName ? `, ${firstName}` : ""}
          </motion.span>
        )}
      </p>
      <h1 className="mt-1 text-display-lg-mobile text-fg-primary">Your dashboard</h1>
      <p className="mt-1 text-body-base text-fg-secondary">
        Live estimates from your knowledge model — simulated markets, real learning.
      </p>
    </header>
  );

  if (isPending || !data) {
    // The skeleton mirrors the loaded layout to the pixel. That's the CLS gate.
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {header}
        <Skeleton className="min-h-[240px] w-full rounded-card" />
        <Skeleton className="min-h-[380px] w-full rounded-card" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="min-h-[168px] rounded-card" />
          <Skeleton className="min-h-[168px] rounded-card" />
          <Skeleton className="min-h-[168px] rounded-card" />
        </div>
        <Skeleton className="min-h-[320px] w-full rounded-card" />
      </div>
    );
  }

  const { kcs, kcStates, history, sessionDays } = data;
  const orderedKcs = [...kcs].sort((a, b) => a.prereqIds.length - b.prereqIds.length);
  const target = targetKcId(kcs, masteryMap);
  const targetKc = kcs.find((k) => k.id === target);
  const targetState = target ? kcStates[target] : undefined;
  const action = nextActionFor(targetState);
  const noModel = Object.keys(kcStates).length === 0;

  const reviewDue = Object.entries(kcStates).filter(
    ([, st]) => st.pL < MASTERY_THRESHOLD && st.attempts > 0 && Date.now() - st.lastSeen > 3 * DAY_MS,
  );

  // The activity strip: sessions per day over the last seven days.
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const dayStart = start.getTime() - (6 - i) * DAY_MS;
    const count = sessionDays.filter((t) => t >= dayStart && t < dayStart + DAY_MS).length;
    return { dayStart, count, letter: DAY_LETTERS[new Date(dayStart).getDay()]!, today: i === 6 };
  });
  const masteredCount = Object.values(kcStates).filter((s) => s.pL >= MASTERY_THRESHOLD).length;
  const weekSessions = days.reduce((n, d) => n + d.count, 0);

  const chartKc = selectedKc ?? target ?? orderedKcs[0]?.id ?? null;
  const chartPoints: HistoryPoint[] = history
    .filter((h) => h.kcId === chartKc)
    .map((h) => ({ ts: h.ts, pL: h.pL }));

  return (
    <Stagger autoWrap={false} className="mx-auto max-w-4xl space-y-6">
      <StaggerItem>{header}</StaggerItem>

      {/* The continue-learning hero. A quiet particle field sits behind it
          and two faint orbit rings turn around the mastery ring. */}
      <StaggerItem>
        <Card
          level="elevated"
          spotlight
          className="flex min-h-[240px] flex-col items-center gap-6 p-8 sm:flex-row"
        >
          <LazyParticleField count={300} wave={0.5} intensity={0.5} spread={[18, 6, 6]} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_90%_at_18%_50%,rgba(94,106,210,0.14),transparent_70%)]"
          />
          {noModel ? (
            <div className="flex-1">
              <Pill tone="accent" dot>
                Get started
              </Pill>
              <h1 className="mt-3 text-headline-md text-fg-primary">
                Calibrate your knowledge map
              </h1>
              <p className="mt-2 text-body-base text-fg-secondary">
                Eight quick questions seed your personal model — or skip and
                start from scratch.
              </p>
              <Link href="/placement" className="mt-5 inline-block">
                <Button>Take the placement</Button>
              </Link>
            </div>
          ) : targetKc ? (
            <>
              <div className="relative shrink-0">
                <OrbitRings />
                <MasteryRing value={targetState?.pL ?? 0} size="lg" label={targetKc.title} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <Pill tone={action === "remediate" ? "warning" : "accent"} dot>
                  {action === "remediate" ? "Needs attention" : "Up next"}
                </Pill>
                <h1 className="mt-3 text-headline-md text-fg-primary">{targetKc.title}</h1>
                <p className="mt-2 text-body-base text-fg-secondary">{targetKc.description}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
                  <Link href={actionCopy[action].href(targetKc.id)}>
                    <Button>{actionCopy[action].label}</Button>
                  </Link>
                  <Link href={`/lesson/${targetKc.id}`}>
                    <Button variant="ghost">Review lesson</Button>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 text-center">
              <div className="relative mx-auto inline-block">
                <OrbitRings />
                <MasteryRing value={1} size="lg" label="Level 1" />
              </div>
              <h1 className="mt-4 text-headline-md text-fg-primary">Level 1 complete</h1>
              <p className="mt-2 text-body-base text-fg-secondary">
                Every topic mastered. Keep them fresh in review.
              </p>
            </div>
          )}
        </Card>
      </StaggerItem>

      {/* The knowledge model itself, once there is one. */}
      {!noModel && (
        <StaggerItem>
          <KnowledgeModel kcs={kcs} kcStates={kcStates} />
        </StaggerItem>
      )}

      <StaggerItem className="grid gap-4 md:grid-cols-3">
        <Card level="base" interactive spotlight className="min-h-[168px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-label-caps uppercase tracking-wider text-fg-secondary">Review due</p>
            <span className={cn("text-fg-muted", reviewDue.length > 0 && "text-warning")}>
              <ClockIcon />
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2.5">
            <Counter
              value={reviewDue.length}
              className={cn(
                "text-3xl",
                reviewDue.length > 0
                  ? "text-warning drop-shadow-[0_0_12px_rgba(255,185,85,0.35)]"
                  : "text-fg-primary",
              )}
            />
            {reviewDue.length > 0 && (
              <span aria-hidden="true" className="tm-pulse-dot h-1.5 w-1.5 rounded-pill bg-warning" />
            )}
          </p>
          <p className="mt-1 text-sm text-fg-secondary">
            {reviewDue.length === 0 ? "Nothing fading right now." : "topics fading — revisit soon."}
          </p>
          {reviewDue.length > 0 && (
            <Link href="/practice" className="mt-3 inline-block text-sm text-warning hover:underline">
              Refresh them →
            </Link>
          )}
        </Card>

        <Card level="base" interactive spotlight className="min-h-[168px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-label-caps uppercase tracking-wider text-fg-secondary">Mastered</p>
            <span className={cn("text-fg-muted", masteredCount > 0 && "text-mastery-bright")}>
              <SparkIcon />
            </span>
          </div>
          <p className="mt-2 text-3xl text-mastery-bright drop-shadow-[0_0_12px_var(--mastery-glow)]">
            <Counter value={masteredCount} />
            <span className="num text-lg text-fg-secondary">/{kcs.length}</span>
          </p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-pill bg-white/5" aria-hidden="true">
            <motion.div
              className="h-full rounded-pill bg-gradient-to-r from-mastery to-mastery-bright"
              initial={reduced ? false : { width: 0 }}
              animate={{ width: `${kcs.length ? (masteredCount / kcs.length) * 100 : 0}%` }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="mt-1.5 text-sm text-fg-secondary">Level 1 topics at 80%+.</p>
          <Link href="/skill-tree" className="mt-2 inline-block text-sm text-accent-bright hover:underline">
            View the map →
          </Link>
        </Card>

        <Card level="base" spotlight className="min-h-[168px] p-5">
          <div className="flex items-center justify-between">
            <p className="text-label-caps uppercase tracking-wider text-fg-secondary">
              Activity · 7 days
            </p>
            <span className={cn("text-fg-muted", weekSessions > 0 && "text-accent-bright")}>
              <PulseIcon />
            </span>
          </div>
          <div className="mt-3 flex h-14 items-end gap-1.5" aria-label={`${sessionDays.length} recent sessions`}>
            {days.map(({ dayStart, count }, i) => (
              <motion.div
                key={dayStart}
                title={`${count} session${count === 1 ? "" : "s"}`}
                className={cn(
                  "flex-1 origin-bottom rounded-t",
                  count > 0 ? "bg-accent shadow-glow-accent" : "bg-white/5",
                )}
                initial={reduced ? false : { scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: `${Math.min(100, 15 + count * 28)}%` }}
              />
            ))}
          </div>
          <div className="num mt-1.5 flex gap-1.5 text-[10px] text-fg-muted" aria-hidden="true">
            {days.map(({ dayStart, letter, today }) => (
              <span key={dayStart} className={cn("flex-1 text-center", today && "text-accent-bright")}>
                {letter}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-sm text-fg-secondary">
            {weekSessions} session{weekSessions === 1 ? "" : "s"} this week
          </p>
        </Card>
      </StaggerItem>

      {/* Mastery over time, one KC at a time */}
      <StaggerItem>
        <Card level="elevated" className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-headline-md text-fg-primary">Mastery over time</h2>
            <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Choose topic">
              {orderedKcs.map((kc) => (
                <button
                  key={kc.id}
                  role="tab"
                  aria-selected={chartKc === kc.id}
                  onClick={() => setSelectedKc(kc.id)}
                  className={cn(
                    "whitespace-nowrap rounded-pill px-3 py-1.5 text-label-caps uppercase tracking-wider transition-[color,background-color,box-shadow] duration-200",
                    chartKc === kc.id
                      ? "bg-mastery/10 text-mastery-bright shadow-[inset_0_0_0_1px_var(--mastery-glow)]"
                      : "bg-white/5 text-fg-secondary hover:bg-white/10 hover:text-fg-primary",
                  )}
                >
                  {kc.title}
                </button>
              ))}
            </div>
          </div>
          {/* The chart wipes in from the left, and again whenever you pick a
              different topic, so the switch reads as a redraw. */}
          <motion.div
            key={chartKc ?? "none"}
            className="mt-4"
            initial={reduced ? false : { clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <MasteryChart
              points={chartPoints}
              ariaLabel={`Mastery over time for ${kcs.find((k) => k.id === chartKc)?.title ?? "topic"}`}
            />
          </motion.div>
        </Card>
      </StaggerItem>
    </Stagger>
  );
}

/**
 * Two faint dashed rings turning slowly in opposite directions around the
 * hero's mastery ring. Pure CSS rotation, so it's free, and it stops under
 * reduced motion.
 */
function OrbitRings() {
  return (
    <>
      <span
        aria-hidden="true"
        className="tm-orbit pointer-events-none absolute -inset-4 rounded-pill border border-dashed border-accent/25"
      />
      <span
        aria-hidden="true"
        className="tm-orbit-reverse pointer-events-none absolute -inset-8 rounded-pill border border-dotted border-mastery/15"
      />
    </>
  );
}
