/**
 * The constellation layout, shared by the skill tree and the
 * model-initialisation moment.
 *
 * The modules form a strict prerequisite chain, so I draw the map as a
 * climb: a winding ascent from bottom-left to top-right. Reading it left to
 * right is reading the curriculum in order, and gaining height is gaining
 * mastery. The layout carries the meaning, not just the labels.
 */

export interface NodePosition {
  x: number;
  y: number;
}

export const CANVAS = { width: 1000, height: 470 } as const;

/** In curriculum order. Each step rises overall but dips between peaks, so
 *  no two consecutive nodes ever sit on one flat line. */
export const NODE_POSITIONS: Record<string, NodePosition> = {
  "kc-candle-anatomy": { x: 78, y: 396 },
  "kc-liquidity": { x: 196, y: 306 },
  "kc-risk-sizing": { x: 316, y: 374 },
  "kc-reversal-patterns": { x: 434, y: 268 },
  "kc-cisd-confirmation": { x: 556, y: 340 },
  "kc-daily-bias": { x: 672, y: 232 },
  "kc-fractal-model": { x: 786, y: 314 },
  "kc-smt-divergence": { x: 886, y: 200 },
  "kc-weekly-profiles": { x: 952, y: 96 },
};

export function positionFor(kcId: string, index: number): NodePosition {
  return (
    NODE_POSITIONS[kcId] ?? {
      x: 88 + (index % 8) * 122,
      y: 380 - (index % 3) * 90,
    }
  );
}

/**
 * A smooth Catmull-Rom spline through the waypoints, emitted as cubic
 * beziers. The journey has to read as one continuous route. When I tried
 * straight segments between nodes it looked like a diagram of unrelated
 * points.
 */
export function journeyPath(
  points: NodePosition[],
  tension = 0.5,
  /** Clamp the control points' y to this range, so a step in the data can't
   *  make the curve overshoot past the data itself. */
  bounds?: { minY: number; maxY: number },
): string {
  if (points.length < 2) return "";
  const p = points;
  const cy = (y: number) => (bounds ? Math.min(bounds.maxY, Math.max(bounds.minY, y)) : y);
  let d = `M ${p[0]!.x} ${p[0]!.y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]!;
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p3 = p[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const c1y = cy(p1.y + ((p2.y - p0.y) / 6) * tension * 2);
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const c2y = cy(p2.y - ((p3.y - p1.y) / 6) * tension * 2);
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Walk the prerequisite chain from the root so the modules come out in
 * teaching order. Sorting by prerequisite count was my first attempt and it
 * was wrong: every module after the first has exactly one prerequisite, so
 * the order came out arbitrary. Anything off the main chain keeps a stable
 * spot at the end.
 */
export function orderByChain<T extends { id: string; prereqIds: string[] }>(kcs: T[]): T[] {
  const nextOf = new Map<string, T>();
  for (const k of kcs) for (const pre of k.prereqIds) nextOf.set(pre, k);
  const root = kcs.find((k) => k.prereqIds.length === 0);
  if (!root) return [...kcs];
  const chain: T[] = [root];
  const seen = new Set([root.id]);
  let cur = root;
  while (chain.length < kcs.length) {
    const nxt = nextOf.get(cur.id);
    if (!nxt || seen.has(nxt.id)) break;
    chain.push(nxt);
    seen.add(nxt.id);
    cur = nxt;
  }
  for (const k of kcs) if (!seen.has(k.id)) chain.push(k);
  return chain;
}
