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
import { MasteryChart, type HistoryPoint } from "@/components/learn/mastery-chart";
import { cn } from "@/lib/utils";

const COURSE_ID = "trading-foundations";
const DAY_MS = 24 * 60 * 60 * 1000;

interface KcState {
  pL: number;
  attempts: number;
  lastSeen: number;
  masteredAt: number | null;
}

const actionCopy: Record<NextAction, { label: string; href(kcId: string): string }> = {
  lesson: { label: "Read the lesson", href: (kcId) => `/lesson/${kcId}-lesson` },
  practice: { label: "Practise now", href: () => "/practice" },
  remediate: { label: "Rebuild the basics", href: (kcId) => `/lesson/${kcId}-lesson` },
  advance: { label: "Advance", href: () => "/practice" },
};

export default function DashboardPage() {
  const { user } = useAuth();
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

  if (isPending || !data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pt-4">
        <Skeleton className="h-40 w-full rounded-card" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-32 rounded-card" />
        </div>
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

  // Activity strip: sessions per day, last 7 days.
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const dayStart = start.getTime() - (6 - i) * DAY_MS;
    const count = sessionDays.filter((t) => t >= dayStart && t < dayStart + DAY_MS).length;
    return { dayStart, count };
  });
  const masteredCount = Object.values(kcStates).filter((s) => s.pL >= MASTERY_THRESHOLD).length;

  const chartKc = selectedKc ?? target ?? orderedKcs[0]?.id ?? null;
  const chartPoints: HistoryPoint[] = history
    .filter((h) => h.kcId === chartKc)
    .map((h) => ({ ts: h.ts, pL: h.pL }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Continue-learning hero */}
      <Card level="elevated" className="flex flex-col items-center gap-6 p-8 sm:flex-row">
        {noModel ? (
          <>
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
          </>
        ) : targetKc ? (
          <>
            <MasteryRing value={targetState?.pL ?? 0} size="lg" label={targetKc.title} />
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
                <Link href={`/lesson/${targetKc.id}-lesson`}>
                  <Button variant="ghost">Review lesson</Button>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 text-center">
            <MasteryRing value={1} size="lg" label="Level 1" className="mx-auto" />
            <h1 className="mt-4 text-headline-md text-fg-primary">Level 1 complete</h1>
            <p className="mt-2 text-body-base text-fg-secondary">
              Every topic mastered. Keep them fresh in review.
            </p>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card level="base" className="p-5">
          <p className="text-label-caps uppercase tracking-wider text-fg-secondary">Review due</p>
          <p className="num mt-2 text-3xl text-fg-primary">{reviewDue.length}</p>
          <p className="mt-1 text-sm text-fg-secondary">
            {reviewDue.length === 0 ? "Nothing fading right now." : "topics fading — revisit soon."}
          </p>
          {reviewDue.length > 0 && (
            <Link href="/practice" className="mt-3 inline-block text-sm text-warning hover:underline">
              Refresh them →
            </Link>
          )}
        </Card>

        <Card level="base" className="p-5">
          <p className="text-label-caps uppercase tracking-wider text-fg-secondary">Mastered</p>
          <p className="num mt-2 text-3xl text-mastery-bright">
            {masteredCount}
            <span className="text-lg text-fg-muted">/{kcs.length}</span>
          </p>
          <p className="mt-1 text-sm text-fg-secondary">Level 1 topics at 80%+.</p>
          <Link href="/skill-tree" className="mt-3 inline-block text-sm text-accent-bright hover:underline">
            View the map →
          </Link>
        </Card>

        <Card level="base" className="p-5">
          <p className="text-label-caps uppercase tracking-wider text-fg-secondary">
            Activity · 7 days
          </p>
          <div className="mt-3 flex h-14 items-end gap-1.5" aria-label={`${sessionDays.length} recent sessions`}>
            {days.map(({ dayStart, count }) => (
              <div
                key={dayStart}
                title={`${count} session${count === 1 ? "" : "s"}`}
                className={cn(
                  "flex-1 rounded-t",
                  count > 0 ? "bg-accent" : "bg-white/5",
                )}
                style={{ height: `${Math.min(100, 15 + count * 28)}%` }}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-fg-secondary">
            {days.reduce((n, d) => n + d.count, 0)} sessions this week
          </p>
        </Card>
      </div>

      {/* Mastery over time */}
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
                  "whitespace-nowrap rounded-pill px-3 py-1.5 text-label-caps uppercase tracking-wider transition-colors",
                  chartKc === kc.id
                    ? "bg-mastery/10 text-mastery-bright"
                    : "bg-white/5 text-fg-secondary hover:text-fg-primary",
                )}
              >
                {kc.title}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <MasteryChart
            points={chartPoints}
            ariaLabel={`Mastery over time for ${kcs.find((k) => k.id === chartKc)?.title ?? "topic"}`}
          />
        </div>
      </Card>
    </div>
  );
}
