import type { Item, Kc } from "./content/types";

export type AssessmentForm = "A" | "B";

export function pickAssessment(kcs: Kc[], eligible: Item[], form: AssessmentForm): Item[] {
  const picked: Item[] = [];
  for (const kc of kcs) {
    const pool = eligible.filter((e) => e.kcId === kc.id && !picked.includes(e));
    if (pool.length === 0) continue;
    picked.push(form === "A" ? pool[0]! : pool[pool.length - 1]!);
  }
  return picked;
}

export function normalisedGain(pre: number, post: number, total: number): number | null {
  if (total <= 0 || pre >= total) return null;
  return (post - pre) / (total - pre);
}

export const SUS_ITEMS: readonly string[] = [
  "I think that I would like to use TMAcademy frequently.",
  "I found TMAcademy unnecessarily complex.",
  "I thought TMAcademy was easy to use.",
  "I think that I would need the support of a technical person to be able to use TMAcademy.",
  "I found the various functions in TMAcademy were well integrated.",
  "I thought there was too much inconsistency in TMAcademy.",
  "I would imagine that most people would learn to use TMAcademy very quickly.",
  "I found TMAcademy very cumbersome to use.",
  "I felt very confident using TMAcademy.",
  "I needed to learn a lot of things before I could get going with TMAcademy.",
];

export function susScore(answers: readonly number[]): number | null {
  if (answers.length !== 10 || answers.some((a) => !Number.isInteger(a) || a < 1 || a > 5)) return null;
  let sum = 0;
  answers.forEach((a, i) => {
    sum += i % 2 === 0 ? a - 1 : 5 - a;
  });
  return sum * 2.5;
}
