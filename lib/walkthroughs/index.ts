import { marketStructure } from "./market-structure";
import { pdArrays } from "./pd-arrays";
import { timeSessions } from "./time-sessions";
import { entryModels } from "./entry-models";
import { htfContext } from "./htf-context";
import { execution } from "./execution";
import { fractalModel } from "./fractal-model";
import { foundations } from "./foundations";
import { instruments } from "./instruments";
import type { Walkthrough } from "./types";

export type { Walkthrough, Step, Anno, Candle, Tone } from "./types";

/**
 * Every walkthrough, by id. A lesson references one (or more) by id in its
 * meta line and the generator turns that into a walkthrough block; the
 * lesson page looks the spec up here at render time. Specs are code, not
 * Firestore, because they're built (the candles are computed from control
 * points) and because a typo in a bar index should fail the typecheck, not
 * a learner's screen.
 */
const ALL: Walkthrough[] = [
  ...foundations,
  ...marketStructure,
  ...pdArrays,
  ...timeSessions,
  ...entryModels,
  ...fractalModel,
  ...htfContext,
  ...execution,
  ...instruments,
];

export const WALKTHROUGHS: Record<string, Walkthrough> = Object.fromEntries(ALL.map((w) => [w.id, w]));

export function getWalkthrough(id: string): Walkthrough | null {
  return WALKTHROUGHS[id] ?? null;
}
