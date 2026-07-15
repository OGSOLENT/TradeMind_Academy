/**
 * Bayesian Knowledge Tracing — Corbett & Anderson (1994).
 * THE dissertation engine: pure TypeScript, zero dependencies, zero Firebase.
 *
 *   evidence update:  pL|correct = pL(1-pS) / (pL(1-pS) + (1-pL)pG)
 *                     pL|wrong   = pL·pS   / (pL·pS   + (1-pL)(1-pG))
 *   learning step:    pL' = pL|evidence + (1 - pL|evidence)·pT
 *   predict:          P(correct) = pL(1-pS) + (1-pL)pG
 *
 * Thresholds are report-canonical (AE1) and must never drift:
 * mastered/unlock at pL ≥ 0.8, remediation below 0.4.
 */

export interface BktParams {
  /** P(L0) — prior probability the skill is already known. */
  pL0: number;
  /** P(T) — probability of learning after an opportunity. */
  pT: number;
  /** P(G) — probability of guessing correctly while unlearned. */
  pG: number;
  /** P(S) — probability of slipping while learned. */
  pS: number;
}

export const DEFAULT_PARAMS: BktParams = { pL0: 0.25, pT: 0.12, pG: 0.2, pS: 0.1 };

export const MASTERY_THRESHOLD = 0.8; // unlock / mastered
export const REMEDIATION_THRESHOLD = 0.4; // below = remediation band

export interface MasteryUpdate {
  /** Posterior P(L) after evidence + learning step. */
  pL: number;
  /** P(correct) predicted from the PRIOR pL — logged for model validation. */
  pCorrectPredicted: number;
}

/** P(correct on next item) given current pL. */
export function predictCorrect(pL: number, params: BktParams = DEFAULT_PARAMS): number {
  return pL * (1 - params.pS) + (1 - pL) * params.pG;
}

/** One BKT step: evidence conditioning on the observation, then learning. */
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
 * Initialise per-KC pL0 from placement responses by running the full BKT
 * update sequence from the default prior. KCs without placement evidence
 * keep params.pL0.
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

/** Which canonical band a mastery value falls in. */
export function masteryBand(pL: number): MasteryBand {
  if (pL >= MASTERY_THRESHOLD) return "mastered";
  if (pL < REMEDIATION_THRESHOLD) return "remediate";
  return "practice";
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
