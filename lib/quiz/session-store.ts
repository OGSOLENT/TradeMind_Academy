"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Item } from "@/lib/content/types";
import { DEFAULT_PARAMS, updateMastery } from "@/lib/bkt";
import { grade, type LearnerAnswer } from "./grade";
import { getLogger } from "@/lib/logging";

/**
 * Ephemeral quiz-session state (Zustand + localStorage persistence so a
 * refresh resumes mid-session — BUILD_PROMPT §6 Phase 3). Mastery numbers
 * here are the session-local view; the Firestore mastery doc is written by
 * the session page on completion (single-doc transaction per §4).
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

export type SessionType = "placement" | "lesson-check" | "topic-test" | "review";

interface QuizSessionState {
  uid: string | null;
  sessionId: string | null;
  sessionType: SessionType;
  /** Full items persisted locally so the session survives offline + refresh. */
  items: Item[];
  currentIndex: number;
  answers: Record<string, AnswerRecord>;
  mastery: Record<string, number>; // session-local pL per KC
  shownAt: number; // when the current question appeared (latency basis)
  /** UI phase: answering vs. reading feedback for the just-answered item. */
  phase: "answering" | "feedback" | "complete";
  direction: 1 | -1;

  start(uid: string, sessionId: string, type: SessionType, items: Item[], mastery: Record<string, number>): void;
  submit(item: Item, answer: LearnerAnswer): void;
  next(): void;
  markShown(): void;
  reset(): void;
}

export const useQuizSession = create<QuizSessionState>()(
  persist(
    (set, get) => ({
      uid: null,
      sessionId: null,
      sessionType: "topic-test",
      items: [],
      currentIndex: 0,
      answers: {},
      mastery: {},
      shownAt: Date.now(),
      phase: "answering",
      direction: 1,

      start: (uid, sessionId, sessionType, items, mastery) =>
        set({
          uid,
          sessionId,
          sessionType,
          items,
          mastery,
          currentIndex: 0,
          answers: {},
          shownAt: Date.now(),
          phase: "answering",
          direction: 1,
        }),

      markShown: () => set({ shownAt: Date.now() }),

      submit: (item, answer) => {
        const s = get();
        if (!s.uid || !s.sessionId || s.answers[item.id]) return;

        const pLBefore = s.mastery[item.kcId] ?? DEFAULT_PARAMS.pL0;
        const correct = grade(answer, item.answerKey);
        // Placement sessions gather evidence for initialisation; regular
        // sessions run the live BKT update.
        const pLAfter =
          s.sessionType === "placement" ? pLBefore : updateMastery(pLBefore, correct).pL;
        const latencyMs = Math.max(0, Date.now() - s.shownAt);

        const record: AnswerRecord = {
          itemId: item.id,
          kcId: item.kcId,
          questionType: item.type,
          answer,
          correct,
          latencyMs,
          pLBefore,
          pLAfter,
        };

        // Guardrail §7.2: EVERY submit logs, with pLBefore/pLAfter.
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
          answers: { ...s.answers, [item.id]: record },
          mastery: { ...s.mastery, [item.kcId]: pLAfter },
          phase: "feedback",
        });
      },

      next: () => {
        const s = get();
        if (s.currentIndex + 1 >= s.items.length) {
          set({ phase: "complete" });
        } else {
          set({
            currentIndex: s.currentIndex + 1,
            phase: "answering",
            direction: 1,
            shownAt: Date.now(),
          });
        }
      },

      reset: () =>
        set({
          uid: null,
          sessionId: null,
          items: [],
          currentIndex: 0,
          answers: {},
          mastery: {},
          phase: "answering",
        }),
    }),
    { name: "tm-quiz-session" },
  ),
);
