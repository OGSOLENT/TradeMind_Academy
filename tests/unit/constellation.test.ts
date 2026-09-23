import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CANVAS, journeyPath, layoutPositions, orderByChain, positionFor } from "@/lib/constellation";
import type { Level1Content } from "@/lib/content/types";

const content: Level1Content = JSON.parse(readFileSync("content/level1.json", "utf8"));

describe("orderByChain", () => {
  it("puts the shipped curriculum in teaching order whatever order it arrives in", () => {
    const shuffled = [...content.kcs].reverse();
    const ordered = orderByChain(shuffled);
    expect(ordered.map((k) => k.id)).toEqual(content.kcs.map((k) => k.id));
    // Each module's prerequisite comes before it.
    ordered.forEach((k, i) => {
      for (const pre of k.prereqIds) expect(ordered.findIndex((x) => x.id === pre)).toBeLessThan(i);
    });
  });

  it("keeps modules off the main chain, at the end, rather than losing them", () => {
    const kcs = [
      { id: "b", prereqIds: ["a"] },
      { id: "a", prereqIds: [] },
      { id: "stray", prereqIds: ["missing"] },
    ];
    expect(orderByChain(kcs).map((k) => k.id)).toEqual(["a", "b", "stray"]);
  });

  it("returns the input untouched when there is no root", () => {
    const kcs = [{ id: "x", prereqIds: ["y"] }];
    expect(orderByChain(kcs)).toEqual(kcs);
  });
});

describe("layoutPositions", () => {
  it("places all sixteen modules inside the canvas, each in its own spot", () => {
    const pos = layoutPositions(content.kcs.map((k) => k.id));
    const pts = Object.values(pos);
    expect(pts).toHaveLength(16);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(CANVAS.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(CANVAS.height);
    }
    expect(new Set(pts.map((p) => `${p.x},${p.y}`)).size).toBe(16);
  });

  it("climbs: the last module sits higher on the canvas than the first", () => {
    const ids = content.kcs.map((k) => k.id);
    const pos = layoutPositions(ids);
    expect(pos[ids.at(-1)!]!.y).toBeLessThan(pos[ids[0]!]!.y);
  });

  it("positionFor gives an unknown module a spot on the canvas", () => {
    const p = positionFor("kc-unknown", 5);
    expect(p.x).toBeLessThanOrEqual(CANVAS.width);
  });
});

describe("journeyPath", () => {
  it("is empty for fewer than two points and a single cubic path otherwise", () => {
    expect(journeyPath([{ x: 0, y: 0 }])).toBe("");
    const d = journeyPath([{ x: 0, y: 100 }, { x: 100, y: 50 }, { x: 200, y: 0 }]);
    expect(d.startsWith("M 0 100")).toBe(true);
    expect(d.match(/ C /g)).toHaveLength(2);
    expect(d.endsWith("200 0")).toBe(true);
  });

  it("keeps control points inside the bounds it is given", () => {
    const d = journeyPath([{ x: 0, y: 0 }, { x: 10, y: 100 }, { x: 20, y: 0 }], 0.5, { minY: 0, maxY: 100 });
    const ys = [...d.matchAll(/C ([\d.-]+) ([\d.-]+), ([\d.-]+) ([\d.-]+)/g)].flatMap((m) => [Number(m[2]), Number(m[4])]);
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    }
  });
});
