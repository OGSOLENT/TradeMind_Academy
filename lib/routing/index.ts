/**
 * Rule-based routing — pure functions, zero Firebase (BUILD_PROMPT §5).
 * Given the mastery map + prereq graph, decides what the learner does next
 * and which item they see. Every decision is explainable ("Why this
 * question?" surfaces the SelectionReason verbatim).
 */
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

/** A KC is unlocked when every prerequisite is mastered (pL ≥ 0.8). */
export function unlockedKcIds(kcs: Kc[], mastery: MasteryMap): string[] {
  return kcs
    .filter((kc) =>
      kc.prereqIds.every((p) => (mastery[p]?.pL ?? 0) >= MASTERY_THRESHOLD),
    )
    .map((kc) => kc.id);
}

/** What should the learner do on this KC right now? */
export function nextActionFor(state: KcState | undefined): NextAction {
  const pL = state?.pL ?? 0;
  if ((state?.attempts ?? 0) === 0) return "lesson"; // never practised → teach first
  const band = masteryBand(pL);
  if (band === "mastered") return "advance";
  if (band === "remediate") return "remediate";
  return "practice";
}

/** The KC to work on: lowest-mastery unlocked, unmastered KC. */
export function targetKcId(kcs: Kc[], mastery: MasteryMap): string | null {
  const unlocked = new Set(unlockedKcIds(kcs, mastery));
  const candidates = kcs
    .filter((kc) => unlocked.has(kc.id) && (mastery[kc.id]?.pL ?? 0) < MASTERY_THRESHOLD)
    .sort((a, b) => (mastery[a.id]?.pL ?? 0) - (mastery[b.id]?.pL ?? 0));
  return candidates[0]?.id ?? null;
}

/** Difficulty ladder: easy below the remediation line, hard when near mastery. */
export function difficultyFor(pL: number): Difficulty {
  if (pL < REMEDIATION_THRESHOLD) return "easy";
  if (pL < 0.7) return "med";
  return "hard";
}

export interface SelectionHistory {
  usedItemIds: string[];
  /** Consecutive wrong answers on this KC within the session. */
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

/**
 * Pick the next item for a KC. Two consecutive wrongs force remediation
 * (an easy item; the caller re-serves the micro-lesson). Items never repeat
 * within a session; difficulty falls back to the nearest rung if the
 * preferred one is exhausted.
 */
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

/** KCs newly unlocked by a mastery change (for the unlock ceremony). */
export function newlyUnlocked(kcs: Kc[], before: MasteryMap, after: MasteryMap): string[] {
  const was = new Set(unlockedKcIds(kcs, before));
  return unlockedKcIds(kcs, after).filter((id) => !was.has(id));
}
