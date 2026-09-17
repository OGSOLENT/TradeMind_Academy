import type { Item, Kc } from "./content/types";

/**
 * The two fixed assessments the pilot study uses: placement before the
 * course (form A) and a post-test after it (form B). Both take one
 * pretest-eligible item per knowledge component, in prerequisite order,
 * so the two scores are directly comparable and a normalised gain can be
 * computed (Hake, 1998). Where a KC has more than one eligible item, form
 * B takes a different one, so the post-test isn't a memory test of the
 * placement; a KC with a single eligible item reuses it, which the
 * analysis script flags.
 */
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

/** Hake's normalised gain: the fraction of the available headroom the learner made up. */
export function normalisedGain(pre: number, post: number, total: number): number | null {
  if (total <= 0 || pre >= total) return null;
  return (post - pre) / (total - pre);
}

/**
 * The System Usability Scale (Brooke, 1996). Ten statements, odd ones
 * positive, even ones negative, each answered 1 (strongly disagree) to
 * 5 (strongly agree). Score is 0 to 100; 68 is the published average.
 */
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
