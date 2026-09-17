"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Item, Kc } from "@/lib/content/types";
import { DEFAULT_PARAMS, updateMastery } from "@/lib/bkt";
import { nextItem, targetKcId, type SelectionReason } from "@/lib/routing";
import { grade, type LearnerAnswer } from "./grade";
import { getLogger } from "@/lib/logging";

/**
 * Quiz-session state. Zustand with localStorage persistence, so a refresh
 * resumes where you were and offline keeps working because the whole item
 * pool is local.
 *
 * Adaptive sessions pick each next item live through /lib/routing: the
 * lowest-mastery unlocked KC, then the difficulty ladder, never repeating,
 * with two wrongs in a row forcing remediation. I keep the reason behind
 * every selection for the "Why this question?" popover.
 */

export interface AnswerRecord {
  itemId: string;
  kcId: string;
  questionType: string;
  answer: LearnerAnswer;
  correct: boolean;
  latencyMs: number;
  pLBefore: number;
  pLAfter: number;
}

export type SessionType = "placement" | "post-test" | "lesson-check" | "topic-test" | "review";

/** Placement and post-test measure; they never move the learner model. */
export function isAssessment(type: SessionType): boolean {
  return type === "placement" || type === "post-test";
}

interface QuizSessionState {
  uid: string | null;
  sessionId: string | null;
  sessionType: SessionType;
  /** The items asked so far, in order. It grows as the session adapts. */
  items: Item[];
  /** The candidate pool for adaptive selection. Empty for fixed sessions. */
  pool: Item[];
  kcs: Kc[];
  targetLength: number;
  currentIndex: number;
  answers: Record<string, AnswerRecord>;
  reasons: Record<string, SelectionReason>;
  mastery: Record<string, number>;
  masteryAtStart: Record<string, number>;
  consecutiveWrong: Record<string, number>;
  shownAt: number;
  phase: "answering" | "feedback" | "complete";
  direction: 1 | -1;

  /** A fixed sequence, which is what placement uses. */
  startFixed(
    uid: string,
    sessionId: string,
    type: SessionType,
    items: Item[],
    mastery: Record<string, number>,
  ): void;
  /** An adaptive session, where routing picks every item. */
  startAdaptive(
    uid: string,
    sessionId: string,
    pool: Item[],
    kcs: Kc[],
    mastery: Record<string, number>,
    targetLength: number,
  ): void;
  submit(item: Item, answer: LearnerAnswer): void;
  next(): void;
  markShown(): void;
  reset(): void;
}

function selectNext(s: QuizSessionState): { item: Item; reason: SelectionReason } | null {
  const kcId = targetKcId(
    s.kcs,
    Object.fromEntries(
      s.kcs.map((kc) => [kc.id, { pL: s.mastery[kc.id] ?? 0, attempts: 1 }]),
    ),
  );
  const askIn = kcId ?? s.kcs[0]?.id;
  if (!askIn) return null;
  const sel = nextItem(s.pool, askIn, s.mastery[askIn] ?? DEFAULT_PARAMS.pL0, {
    usedItemIds: s.items.map((i) => i.id),
    consecutiveWrong: s.consecutiveWrong[askIn] ?? 0,
  });
  if (sel) return sel;
  // The target KC has run out. Fall back to any KC with items left.
  for (const kc of s.kcs) {
    const alt = nextItem(s.pool, kc.id, s.mastery[kc.id] ?? DEFAULT_PARAMS.pL0, {
      usedItemIds: s.items.map((i) => i.id),
      consecutiveWrong: s.consecutiveWrong[kc.id] ?? 0,
    });
    if (alt) return alt;
  }
  return null;
}

export const useQuizSession = create<QuizSessionState>()(
  persist(
    (set, get) => ({
      uid: null,
      sessionId: null,
      sessionType: "topic-test",
      items: [],
      pool: [],
      kcs: [],
      targetLength: 10,
      currentIndex: 0,
      answers: {},
      reasons: {},
      mastery: {},
      masteryAtStart: {},
      consecutiveWrong: {},
      shownAt: Date.now(),
      phase: "answering",
      direction: 1,

      startFixed: (uid, sessionId, sessionType, items, mastery) =>
        set({
          uid,
          sessionId,
          sessionType,
          items,
          pool: [],
          kcs: [],
          targetLength: items.length,
          mastery,
          masteryAtStart: { ...mastery },
          currentIndex: 0,
          answers: {},
          reasons: {},
          consecutiveWrong: {},
          shownAt: Date.now(),
          phase: "answering",
          direction: 1,
        }),

      startAdaptive: (uid, sessionId, pool, kcs, mastery, targetLength) => {
        const base: Partial<QuizSessionState> = {
          uid,
          sessionId,
          sessionType: "topic-test",
          pool,
          kcs,
          targetLength,
          mastery,
          masteryAtStart: { ...mastery },
          items: [],
          currentIndex: 0,
          answers: {},
          reasons: {},
          consecutiveWrong: {},
          shownAt: Date.now(),
          phase: "answering",
          direction: 1,
        };
        set(base as QuizSessionState);
        const sel = selectNext(get());
        if (sel) {
          set({ items: [sel.item], reasons: { [sel.item.id]: sel.reason } });
        }
      },

      markShown: () => set({ shownAt: Date.now() }),

      submit: (item, answer) => {
        const s = get();
        if (!s.uid || !s.sessionId || s.answers[item.id]) return;

        const pLBefore = s.mastery[item.kcId] ?? DEFAULT_PARAMS.pL0;
        const correct = grade(answer, item.answerKey);
        const pLAfter = isAssessment(s.sessionType) ? pLBefore : updateMastery(pLBefore, correct).pL;
        const latencyMs = Math.max(0, Date.now() - s.shownAt);

        getLogger().enqueue({
          uid: s.uid,
          sessionId: s.sessionId,
          itemId: item.id,
          kcId: item.kcId,
          questionType: item.type,
          correct,
          selected: answer,
          latencyMs,
          pLBefore,
          pLAfter,
          ts: Date.now(),
        });

        set({
          answers: {
            ...s.answers,
            [item.id]: {
              itemId: item.id,
              kcId: item.kcId,
              questionType: item.type,
              answer,
              correct,
              latencyMs,
              pLBefore,
              pLAfter,
            },
          },
          mastery: { ...s.mastery, [item.kcId]: pLAfter },
          consecutiveWrong: {
            ...s.consecutiveWrong,
            [item.kcId]: correct ? 0 : (s.consecutiveWrong[item.kcId] ?? 0) + 1,
          },
          phase: "feedback",
        });
      },

      next: () => {
        const s = get();
        if (s.items.length >= s.targetLength && s.currentIndex + 1 >= s.items.length) {
          set({ phase: "complete" });
          return;
        }
        if (s.currentIndex + 1 < s.items.length) {
          set({ currentIndex: s.currentIndex + 1, phase: "answering", direction: 1, shownAt: Date.now() });
          return;
        }
        // Adaptive session, so choose the next item now.
        const sel = selectNext(s);
        if (!sel) {
          set({ phase: "complete" });
          return;
        }
        set({
          items: [...s.items, sel.item],
          reasons: { ...s.reasons, [sel.item.id]: sel.reason },
          currentIndex: s.currentIndex + 1,
          phase: "answering",
          direction: 1,
          shownAt: Date.now(),
        });
      },

      reset: () =>
        set({
          uid: null,
          sessionId: null,
          items: [],
          pool: [],
          kcs: [],
          currentIndex: 0,
          answers: {},
          reasons: {},
          mastery: {},
          masteryAtStart: {},
          consecutiveWrong: {},
          phase: "answering",
        }),
    }),
    { name: "tm-quiz-session" },
  ),
);
