"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import type { Kc, Lesson } from "@/lib/content/types";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { nodeStateFor, unlockedKcIds, type MasteryMap, type NodeState } from "@/lib/routing";
import { orderByChain } from "@/lib/constellation";
import { COURSE_ID } from "@/lib/constants";
import { masteryOf, parseDocs, parseKc, parseLesson } from "@/lib/firebase/schemas";


export interface ModuleView extends Kc {
  pL: number;
  attempts: number;
  state: NodeState;
  lessons: Array<Pick<Lesson, "id" | "title">>;
}

/**
 * The learner's model as the navigation sees it: every module in teaching
 * order with its estimate, its state and its lessons. The Learn menu and the
 * command palette both read this, so it's one cached query rather than two.
 * The content half (modules and lesson titles) is stable, so it's cached for
 * ten minutes. The mastery half follows the shared one-minute default.
 */
export function useLearnerModel() {
  const { user } = useAuth();

  const content = useQuery({
    queryKey: ["nav-content"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { db } = getFirebase();
      const [kcsSnap, lessonsSnap] = await Promise.all([
        getDocs(collection(db, "kcs")),
        getDocs(collection(db, "lessons")),
      ]);
      const kcs = orderByChain(parseDocs(kcsSnap, parseKc));
      const lessons = lessonsSnap.docs
        .map((d) => parseLesson(d.id, d.data()))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(({ id, title, kcId }) => ({ id, title, kcId }));
      return { kcs, lessons };
    },
  });

  const mastery = useQuery({
    queryKey: ["nav-mastery", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const { db } = getFirebase();
      const snap = await getDoc(doc(db, "users", user!.uid, "mastery", COURSE_ID));
      return masteryOf(snap).kcs;
    },
  });

  const modules: ModuleView[] = (() => {
    if (!content.data) return [];
    const states = mastery.data ?? {};
    const map: MasteryMap = Object.fromEntries(
      Object.entries(states).map(([k, v]) => [k, { pL: v.pL, attempts: v.attempts }]),
    );
    const unlocked = new Set(unlockedKcIds(content.data.kcs, map));
    return content.data.kcs.map((kc) => {
      const st = states[kc.id];
      const pL = st?.pL ?? 0;
      return {
        ...kc,
        pL,
        attempts: st?.attempts ?? 0,
        state: nodeStateFor(pL, st?.attempts ?? 0, unlocked.has(kc.id)),
        lessons: content.data!.lessons.filter((l) => l.kcId === kc.id).map(({ id, title }) => ({ id, title })),
      };
    });
  })();

  return { modules, loading: content.isPending, hasModel: !!mastery.data && Object.keys(mastery.data).length > 0 };
}
