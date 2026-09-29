import type { Difficulty, Item, Kc } from "@/lib/content/types";
import {
  MASTERY_THRESHOLD,
  REMEDIATION_THRESHOLD,
  masteryBand,
  predictCorrect,
} from "@/lib/bkt";

export type NextAction = "lesson" | "practice" | "remediate" | "advance";

export interface KcState {
  pL: number;
  attempts: number;
}

export type MasteryMap = Record<string, KcState | undefined>;

export function unlockedKcIds(kcs: Kc[], mastery: MasteryMap): string[] {
  return kcs
    .filter((kc) =>
      kc.prereqIds.every((p) => (mastery[p]?.pL ?? 0) >= MASTERY_THRESHOLD),
    )
    .map((kc) => kc.id);
}

/** What should the learner be doing on this KC right now? */
export function nextActionFor(state: KcState | undefined): NextAction {
  const pL = state?.pL ?? 0;
  if ((state?.attempts ?? 0) === 0) return "lesson"; // never practised, so teach it first
  const band = masteryBand(pL);
  if (band === "mastered") return "advance";
  if (band === "remediate") return "remediate";
  return "practice";
}

export function targetKcId(kcs: Kc[], mastery: MasteryMap): string | null {
  const unlocked = new Set(unlockedKcIds(kcs, mastery));
  const candidates = kcs
    .filter((kc) => unlocked.has(kc.id) && (mastery[kc.id]?.pL ?? 0) < MASTERY_THRESHOLD)
    .sort((a, b) => (mastery[a.id]?.pL ?? 0) - (mastery[b.id]?.pL ?? 0));
  return candidates[0]?.id ?? null;
}

export function difficultyFor(pL: number): Difficulty {
  if (pL < REMEDIATION_THRESHOLD) return "easy";
  if (pL < 0.7) return "med";
  return "hard";
}

export interface SelectionHistory {
  usedItemIds: string[];
  /** How many wrong answers in a row on this KC, within the session. */
  consecutiveWrong: number;
}

export interface SelectionReason {
  kcId: string;
  pL: number;
  band: "remediate" | "practice" | "mastered";
  difficulty: Difficulty;
  pCorrectPredicted: number;
  remediation: boolean;
}

export interface Selection {
  item: Item;
  reason: SelectionReason;
}

const LADDER: Difficulty[] = ["easy", "med", "hard"];

export function nextItem(
  items: Item[],
  kcId: string,
  pL: number,
  history: SelectionHistory,
): Selection | null {
  const remediation = history.consecutiveWrong >= 2;
  const preferred: Difficulty = remediation ? "easy" : difficultyFor(pL);
  const used = new Set(history.usedItemIds);
  const pool = items.filter((it) => it.kcId === kcId && !used.has(it.id));
  if (pool.length === 0) return null;

  const byDistance = [...LADDER].sort(
    (a, b) =>
      Math.abs(LADDER.indexOf(a) - LADDER.indexOf(preferred)) -
      Math.abs(LADDER.indexOf(b) - LADDER.indexOf(preferred)),
  );
  for (const difficulty of byDistance) {
    const candidate = pool.find((it) => it.difficulty === difficulty);
    if (candidate) {
      return {
        item: candidate,
        reason: {
          kcId,
          pL,
          band: masteryBand(pL),
          difficulty: candidate.difficulty,
          pCorrectPredicted: predictCorrect(pL),
          remediation,
        },
      };
    }
  }
  return null;
}

export function newlyUnlocked(kcs: Kc[], before: MasteryMap, after: MasteryMap): string[] {
  const was = new Set(unlockedKcIds(kcs, before));
  return unlockedKcIds(kcs, after).filter((id) => !was.has(id));
}

export type NodeState = "locked" | "available" | "mastered" | "remediation";

export function nodeStateFor(pL: number, attempts: number, unlocked: boolean): NodeState {
  if (!unlocked) return "locked";
  if (pL >= MASTERY_THRESHOLD) return "mastered";
  if (attempts > 0 && pL < REMEDIATION_THRESHOLD) return "remediation";
  return "available";
}
