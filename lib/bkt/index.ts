/**
 * Bayesian Knowledge Tracing, after Corbett and Anderson (1994).
 * This is THE engine of my dissertation. Pure TypeScript, no dependencies,
 * and not a single Firebase import.
 *
 *   evidence update:  pL|correct = pL(1-pS) / (pL(1-pS) + (1-pL)pG)
 *                     pL|wrong   = pL·pS   / (pL·pS   + (1-pL)(1-pG))
 *   learning step:    pL' = pL|evidence + (1 - pL|evidence)·pT
 *   predict:          P(correct) = pL(1-pS) + (1-pL)pG
 *
 * The thresholds come from my AE1 report and they can't drift, because the
 * report is what a marker checks them against: mastered and unlock at pL of
 * 0.8 or above, remediation below 0.4.
 */

export interface BktParams {
  /** P(L0). The prior probability that the skill is already known. */
  pL0: number;
  /** P(T). The probability of learning the skill after one opportunity. */
  pT: number;
  /** P(G). The probability of guessing right while the skill isn't known. */
  pG: number;
  /** P(S). The probability of slipping up while the skill is known. */
  pS: number;
}

export const DEFAULT_PARAMS: BktParams = { pL0: 0.25, pT: 0.12, pG: 0.2, pS: 0.1 };

export const MASTERY_THRESHOLD = 0.8; // unlock and mastered
export const REMEDIATION_THRESHOLD = 0.4; // below this is the remediation band

export interface MasteryUpdate {
  /** The posterior P(L), after the evidence and the learning step. */
  pL: number;
  /** P(correct) predicted from the PRIOR pL. I log this so the model can be validated later. */
  pCorrectPredicted: number;
}

/** P(correct on the next item), given the current pL. */
export function predictCorrect(pL: number, params: BktParams = DEFAULT_PARAMS): number {
  return pL * (1 - params.pS) + (1 - pL) * params.pG;
}

/** One BKT step. Condition on the observation first, then apply the learning step. */
export function updateMastery(
  pL: number,
  correct: boolean,
  params: BktParams = DEFAULT_PARAMS,
): MasteryUpdate {
  const { pT, pG, pS } = params;
  const pCorrectPredicted = predictCorrect(pL, params);

  const evidence = correct
    ? (pL * (1 - pS)) / (pL * (1 - pS) + (1 - pL) * pG)
    : (pL * pS) / (pL * pS + (1 - pL) * (1 - pG));

  const next = evidence + (1 - evidence) * pT;
  return { pL: clamp01(next), pCorrectPredicted };
}

export interface PlacementResponse {
  kcId: string;
  correct: boolean;
}

/**
 * Initialise the per-KC pL0 from placement responses by running the full BKT
 * update sequence from the default prior. Any KC that didn't get a placement
 * question keeps params.pL0.
 */
export function initialiseFromPlacement(
  responses: PlacementResponse[],
  kcIds: string[],
  params: BktParams = DEFAULT_PARAMS,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const kcId of kcIds) out[kcId] = params.pL0;
  for (const r of responses) {
    const prior = out[r.kcId] ?? params.pL0;
    out[r.kcId] = updateMastery(prior, r.correct, params).pL;
  }
  return out;
}

export type MasteryBand = "remediate" | "practice" | "mastered";

/** Which of the three bands a mastery value falls into. */
export function masteryBand(pL: number): MasteryBand {
  if (pL >= MASTERY_THRESHOLD) return "mastered";
  if (pL < REMEDIATION_THRESHOLD) return "remediate";
  return "practice";
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
