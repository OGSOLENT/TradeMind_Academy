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
import { CANVAS, positionFor } from "@/lib/constellation";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { clamp, cn } from "@/lib/utils";

const COURSE_ID = "trading-foundations";
const R = 26;
const CIRC = 2 * Math.PI * R;

type NodeState = "locked" | "available" | "mastered" | "remediation";

interface KcView extends Kc {
  pL: number;
  attempts: number;
  state: NodeState;
}

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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
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

  // Unlock ceremony queue: one toast per newly-unlocked KC, staggered.
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

  const viewW = CANVAS.width / zoom;
  const viewH = CANVAS.height / zoom;
  const viewBox = `${pan.x} ${pan.y} ${viewW} ${viewH}`;

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
        <div className="min-w-0 flex-1 overflow-hidden rounded-card bg-bg-base-veil shadow-hairline">
          <svg
            viewBox={viewBox}
            className="h-[480px] w-full touch-none"
            role="group"
            aria-label="Skill tree constellation"
            onPointerDown={(e) => {
              dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
            }}
            onPointerMove={(e) => {
              if (!dragStart.current) return;
              const scale = viewW / (e.currentTarget.clientWidth || 1);
              setPan({
                x: dragStart.current.panX - (e.clientX - dragStart.current.x) * scale,
                y: dragStart.current.panY - (e.clientY - dragStart.current.y) * scale,
              });
            }}
            onPointerUp={() => (dragStart.current = null)}
            onPointerLeave={() => (dragStart.current = null)}
          >
            {/* Edges */}
            {views.map((kc) =>
              kc.prereqIds.map((p) => {
                const a = positionFor(p, 0);
                const b = positionFor(kc.id, 0);
                const lit = kc.state !== "locked";
                const isNew = justUnlocked.includes(kc.id);
                return (
                  <motion.line
                    key={`${p}-${kc.id}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={lit ? "rgba(94,106,210,0.5)" : "rgba(255,255,255,0.08)"}
                    strokeWidth={lit ? 1.5 : 1}
                    initial={isNew && !reduced ? { pathLength: 0 } : { pathLength: 1 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  />
                );
              }),
            )}

            {views.map((kc, i) => {
              const pos = positionFor(kc.id, i);
              const isNew = justUnlocked.includes(kc.id);
              const color =
                kc.state === "mastered"
                  ? "var(--mastery)"
                  : kc.state === "remediation"
                    ? "var(--warning)"
                    : "var(--accent)";
              return (
                <motion.g
                  key={kc.id}
                  role="button"
                  aria-label={`${kc.title}: ${kc.state}, ${Math.round(kc.pL * 100)} percent mastery`}
                  tabIndex={0}
                  className={cn("cursor-pointer focus:outline-none", kc.state === "locked" && "opacity-40")}
                  onClick={() => setSelected(kc)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(kc)}
                  initial={isNew && !reduced ? { scale: 0.3, opacity: 0 } : undefined}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: isNew ? 0.9 : 0 }}
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                >
                  {kc.state === "available" && (
                    <circle cx={pos.x} cy={pos.y} r={R + 8} fill="var(--accent-glow)" opacity="0.5">
                      {!reduced && (
                        <animate attributeName="r" values={`${R + 5};${R + 11};${R + 5}`} dur="2.4s" repeatCount="indefinite" />
                      )}
                    </circle>
                  )}
                  {kc.state === "remediation" && !reduced && (
                    <circle cx={pos.x} cy={pos.y} r={R + 7} fill="none" stroke="var(--warning)" strokeOpacity="0.4" strokeWidth="2">
                      <animate attributeName="stroke-opacity" values="0.15;0.5;0.15" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={pos.x} cy={pos.y} r={R} fill="#101018" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - kc.pL)}
                    transform={`rotate(-90 ${pos.x} ${pos.y})`}
                  />
                  {kc.state === "locked" ? (
                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="fill-[#5B5B6B] text-[14px]">
                      🔒
                    </text>
                  ) : kc.state === "mastered" ? (
                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="fill-[#2DD4BF] text-[15px]">
                      ✓
                    </text>
                  ) : (
                    <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="num fill-[#E4E1ED] text-[12px]">
                      {Math.round(kc.pL * 100)}
                    </text>
                  )}
                  <text x={pos.x} y={pos.y + R + 18} textAnchor="middle" className="fill-[#908F9E] text-[11px]">
                    {kc.title}
                  </text>
                  {/* 12-particle unlock burst */}
                  {isNew &&
                    !reduced &&
                    Array.from({ length: 12 }, (_, pi) => (
                      <motion.circle
                        key={pi}
                        cx={pos.x}
                        cy={pos.y}
                        r={2.5}
                        fill="var(--accent-bright)"
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          cx: pos.x + Math.cos((pi / 12) * Math.PI * 2) * 52,
                          cy: pos.y + Math.sin((pi / 12) * Math.PI * 2) * 52,
                        }}
                        transition={{ duration: 0.9, delay: 1.1, ease: "easeOut" }}
                      />
                    ))}
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Desktop side panel */}
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
                    className="rounded p-1 text-fg-muted hover:text-fg-primary"
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

      {/* Mobile: Vaul-style drawer */}
      {isMobile && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ""}>
          {panel}
        </Drawer>
      )}
    </div>
  );
}
