"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import type { Kc } from "@/lib/content/types";
import { MASTERY_THRESHOLD, REMEDIATION_THRESHOLD } from "@/lib/bkt";
import { unlockedKcIds, type MasteryMap } from "@/lib/routing";
import { ConstellationMap, type KcView, type NodeState } from "@/components/learn/constellation-map";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { clamp, cn } from "@/lib/utils";

const COURSE_ID = "trading-foundations";
function stateFor(pL: number, attempts: number, unlocked: boolean): NodeState {
  if (!unlocked) return "locked";
  if (pL >= MASTERY_THRESHOLD) return "mastered";
  if (attempts > 0 && pL < REMEDIATION_THRESHOLD) return "remediation";
  return "available";
}

export default function SkillTreePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-card" />}>
      <SkillTree />
    </Suspense>
  );
}

function SkillTree() {
  const { user } = useAuth();
  const params = useSearchParams();
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<KcView | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [ceremonyIndex, setCeremonyIndex] = useState(0);

  const justUnlocked = useMemo(
    () => (params.get("unlocked")?.split(",").filter(Boolean) ?? []),
    [params],
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // The unlock ceremony queue. One toast per newly unlocked KC, staggered so
  // they don't all land at once.
  useEffect(() => {
    if (ceremonyIndex >= justUnlocked.length) return;
    const t = setTimeout(() => {
      const kcId = justUnlocked[ceremonyIndex]!;
      toast({
        title: "Topic unlocked",
        description: kcId.replace("kc-", "").replaceAll("-", " "),
        variant: "success",
      });
      setCeremonyIndex((i) => i + 1);
    }, 900 + ceremonyIndex * 1200);
    return () => clearTimeout(t);
  }, [ceremonyIndex, justUnlocked]);

  const { data } = useQuery({
    queryKey: ["skill-tree", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const { db } = getFirebase();
      const [kcsSnap, masterySnap] = await Promise.all([
        getDocs(collection(db, "kcs")),
        getDoc(doc(db, "users", user!.uid, "mastery", COURSE_ID)),
      ]);
      const kcs = kcsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Kc);
      const kcStates = (masterySnap.data()?.kcs ?? {}) as Record<
        string,
        { pL: number; attempts: number }
      >;
      return { kcs, kcStates };
    },
  });

  const views: KcView[] = useMemo(() => {
    if (!data) return [];
    const masteryMap: MasteryMap = Object.fromEntries(
      Object.entries(data.kcStates).map(([k, v]) => [k, { pL: v.pL, attempts: v.attempts }]),
    );
    const unlocked = new Set(unlockedKcIds(data.kcs, masteryMap));
    return data.kcs
      .sort((a, b) => a.prereqIds.length - b.prereqIds.length)
      .map((kc) => {
        const st = data.kcStates[kc.id];
        return {
          ...kc,
          pL: st?.pL ?? 0,
          attempts: st?.attempts ?? 0,
          state: stateFor(st?.pL ?? 0, st?.attempts ?? 0, unlocked.has(kc.id)),
        };
      });
  }, [data]);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl pt-4">
        <Skeleton className="h-[480px] w-full rounded-card" />
      </div>
    );
  }

  const panel = selected && (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Pill
          tone={
            selected.state === "mastered"
              ? "mastery"
              : selected.state === "remediation"
                ? "warning"
                : selected.state === "locked"
                  ? "neutral"
                  : "accent"
          }
          dot
        >
          {selected.state}
        </Pill>
        <span className="num text-sm text-fg-secondary">{Math.round(selected.pL * 100)}% mastery</span>
      </div>
      <p className="text-sm leading-6 text-fg-secondary">{selected.description}</p>
      <p className="num text-xs text-fg-secondary">{selected.attempts} attempts recorded</p>
      {selected.state === "locked" ? (
        <p className="text-sm text-fg-secondary">
          Master{" "}
          <span className="text-fg-primary">
            {selected.prereqIds.map((p) => p.replace("kc-", "").replaceAll("-", " ")).join(", ")}
          </span>{" "}
          to unlock this topic.
        </p>
      ) : (
        <div className="flex gap-3">
          <Link href={`/lesson/${selected.id}`}>
            <Button variant="secondary" size="sm">
              Lesson
            </Button>
          </Link>
          <Link href="/practice">
            <Button size="sm">Practise</Button>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md text-fg-primary">Skill constellation</h1>
          <p className="mt-1 text-sm text-fg-secondary">
            Your visible mind — every node is a live model estimate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Zoom out" onClick={() => setZoom((z) => clamp(z - 0.25, 0.75, 2))}>
            −
          </Button>
          <span className="num w-12 text-center text-sm text-fg-secondary">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" aria-label="Zoom in" onClick={() => setZoom((z) => clamp(z + 0.25, 0.75, 2))}>
            +
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-card bg-bg-base-veil shadow-hairline">
          <div
            className="h-[520px] w-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            <ConstellationMap
              views={views}
              justUnlocked={justUnlocked}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          </div>

          {/* The route legend, the map's own key. */}
          <div className="pointer-events-none absolute right-5 top-4 flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-label-caps uppercase tracking-wider text-fg-secondary">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-mastery" /> mastered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-accent" /> in progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-warning" /> needs work
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-[#3a3a48]" /> locked
            </span>
          </div>
        </div>

        {/* The desktop side panel */}
        {!isMobile && (
          <AnimatePresence>
            {selected && (
              <motion.aside
                key={selected.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-80 shrink-0 rounded-card bg-bg-elevated-veil p-6 shadow-edge-lit"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-headline-md text-fg-primary">{selected.title}</h2>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close panel"
                    className="rounded p-1 text-fg-muted transition-colors duration-200 hover:text-fg-primary"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-4">{panel}</div>
              </motion.aside>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* On mobile the panel becomes the Vaul-style drawer */}
      {isMobile && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ""}>
          {panel}
        </Drawer>
      )}
    </div>
  );
}
