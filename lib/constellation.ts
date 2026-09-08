/**
 * Constellation layout shared by the skill tree and the model-initialization
 * moment. Positions are hand-placed on a 1000×560 canvas in prerequisite
 * order — a rising arc with slight scatter, per skill_tree_constellation_map.
 */

export interface NodePosition {
  x: number;
  y: number;
}

export const CANVAS = { width: 1000, height: 560 } as const;

export const NODE_POSITIONS: Record<string, NodePosition> = {
  "kc-candle-anatomy": { x: 90, y: 420 },
  "kc-liquidity": { x: 220, y: 320 },
  "kc-reversal-patterns": { x: 360, y: 400 },
  "kc-cisd-confirmation": { x: 490, y: 280 },
  "kc-daily-bias": { x: 610, y: 380 },
  "kc-fractal-model": { x: 720, y: 240 },
  "kc-smt-divergence": { x: 840, y: 330 },
  "kc-weekly-profiles": { x: 930, y: 180 },
};

export function positionFor(kcId: string, index: number): NodePosition {
  return (
    NODE_POSITIONS[kcId] ?? {
      x: 90 + (index % 8) * 120,
      y: 300 + (index % 2) * 100,
    }
  );
}
