/**
 * Does the routing engine teach faster than a fixed syllabus?
 *
 *   npx tsx scripts/simulate-routing.ts [--seed 7] [--learners 300] [--budget 160]
 *
 * The same synthetic learners are put through three policies over the real
 * curriculum (the sixteen knowledge components, their prerequisite chain,
 * and the real item bank with its difficulties):
 *
 *   adaptive   the engine as shipped: weakest unlocked KC, difficulty from
 *              the estimate, remediation after two wrongs, no repeats in a
 *              session (lib/routing)
 *   fixed      a syllabus: every KC in order, ten items each, medium
 *              difficulty, regardless of how the learner is doing
 *   random     any unlocked KC, any item, as a floor
 *
 * A learner has a hidden true state per KC (known or not), starts with
 * some KCs already known, learns with a per-KC probability on each
 * practice attempt, and reads the lesson before the first attempt on a KC
 * (a learning event all three policies get). Answers come from the true
 * state and the item's difficulty, not from the engine's estimate, so the
 * engine can be wrong. Each policy gets the same item budget (the adaptive
 * one stops early when its estimate says everything is mastered), and I
 * report items used, how much of the curriculum the learner actually knows
 * at the end, how many items went on things they already knew, and how far
 * the estimate is from the truth in both directions. Results go into
 * docs/EVALUATION.md.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_PARAMS, MASTERY_THRESHOLD, updateMastery } from "../lib/bkt";
import { nextItem, targetKcId, unlockedKcIds, type MasteryMap, type SelectionHistory } from "../lib/routing";
import type { Difficulty, Item, Kc, Level1Content } from "../lib/content/types";

const arg = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? Number(process.argv[i + 1]) : fallback;
};
let seed = arg("seed", 7);
const LEARNERS = arg("learners", 300);
const BUDGET = arg("budget", 160);
const SESSION = 10;

function rand(): number {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
}

const content: Level1Content = JSON.parse(readFileSync("content/level1.json", "utf8"));
const kcs: Kc[] = content.kcs;
const items: Item[] = content.items;

/** P(correct) from the true state and the item's difficulty. Guess and slip both depend on difficulty. */
const GUESS: Record<Difficulty, number> = { easy: 0.3, med: 0.2, hard: 0.12 };
const SLIP: Record<Difficulty, number> = { easy: 0.05, med: 0.1, hard: 0.18 };
const LESSON_LEARN = 0.35;

interface Learner {
  known: Record<string, boolean>;
  pT: Record<string, number>;
  read: Set<string>;
}

function makeLearner(): Learner {
  const known: Record<string, boolean> = {};
  const pT: Record<string, number> = {};
  kcs.forEach((kc, i) => {
    // Earlier modules are more often already known, as they would be for
    // someone arriving with a little experience.
    known[kc.id] = rand() < Math.max(0.05, 0.45 - i * 0.03);
    pT[kc.id] = 0.08 + rand() * 0.22;
  });
  return { known, pT, read: new Set() };
}

function answer(l: Learner, item: Item): boolean {
  const p = l.known[item.kcId] ? 1 - SLIP[item.difficulty] : GUESS[item.difficulty];
  const correct = rand() < p;
  // Practice teaches, whether or not the answer was right.
  if (!l.known[item.kcId] && rand() < l.pT[item.kcId]!) l.known[item.kcId] = true;
  return correct;
}

function readLesson(l: Learner, kcId: string) {
  if (l.read.has(kcId)) return;
  l.read.add(kcId);
  if (!l.known[kcId] && rand() < LESSON_LEARN) l.known[kcId] = true;
}

interface Outcome {
  knownAtEnd: number;
  wasted: number;
  used: number;
  /** Estimate says mastered, the learner doesn't actually know it. */
  falseMastery: number;
  /** The learner knows it, the estimate hasn't caught up. */
  missed: number;
}

type Policy = (l: Learner) => Outcome;

function freshMastery(): MasteryMap {
  const m: MasteryMap = {};
  for (const kc of kcs) m[kc.id] = { pL: DEFAULT_PARAMS.pL0, attempts: 0 };
  return m;
}

function summarise(l: Learner, mastery: MasteryMap, wasted: number, used: number): Outcome {
  const knownAtEnd = kcs.filter((kc) => l.known[kc.id]).length;
  const est = (id: string) => (mastery[id]?.pL ?? 0) >= MASTERY_THRESHOLD;
  const falseMastery = kcs.filter((kc) => est(kc.id) && !l.known[kc.id]).length;
  const missed = kcs.filter((kc) => !est(kc.id) && l.known[kc.id]).length;
  return { knownAtEnd, wasted, used, falseMastery, missed };
}

const adaptive: Policy = (l) => {
  const mastery = freshMastery();
  let wasted = 0;
  let used = 0;
  let history: Record<string, SelectionHistory> = {};
  while (used < BUDGET) {
    if (used % SESSION === 0) history = {};
    // The engine stops when its estimate says everything is mastered.
    const kcId = targetKcId(kcs, mastery);
    if (!kcId) break;
    readLesson(l, kcId);
    const h = (history[kcId] ??= { usedItemIds: [], consecutiveWrong: 0 });
    const sel = nextItem(items, kcId, mastery[kcId]!.pL, h);
    if (!sel) {
      // Bank exhausted for this session; next session resets it.
      history = {};
      continue;
    }
    if (l.known[kcId]) wasted++;
    const correct = answer(l, sel.item);
    used++;
    h.usedItemIds.push(sel.item.id);
    h.consecutiveWrong = correct ? 0 : h.consecutiveWrong + 1;
    const st = mastery[kcId]!;
    mastery[kcId] = { pL: updateMastery(st.pL, correct).pL, attempts: st.attempts + 1 };
  }
  return summarise(l, mastery, wasted, used);
};

const fixed: Policy = (l) => {
  const mastery = freshMastery();
  let wasted = 0;
  let n = 0;
  const perKc = Math.max(1, Math.round(BUDGET / kcs.length));
  for (const kc of kcs) {
    readLesson(l, kc.id);
    const pool = items.filter((it) => it.kcId === kc.id);
    const preferred = pool.filter((it) => it.difficulty === "med");
    const seq = [...preferred, ...pool.filter((it) => it.difficulty !== "med")];
    for (let i = 0; i < perKc && n < BUDGET; i++, n++) {
      const item = seq[i % seq.length]!;
      if (l.known[kc.id]) wasted++;
      const correct = answer(l, item);
      const st = mastery[kc.id]!;
      mastery[kc.id] = { pL: updateMastery(st.pL, correct).pL, attempts: st.attempts + 1 };
    }
  }
  return summarise(l, mastery, wasted, n);
};

const random: Policy = (l) => {
  const mastery = freshMastery();
  let wasted = 0;
  for (let n = 0; n < BUDGET; n++) {
    const unlocked = unlockedKcIds(kcs, mastery);
    const kcId = unlocked[Math.floor(rand() * unlocked.length)]!;
    readLesson(l, kcId);
    const pool = items.filter((it) => it.kcId === kcId);
    const item = pool[Math.floor(rand() * pool.length)]!;
    if (l.known[kcId]) wasted++;
    const correct = answer(l, item);
    const st = mastery[kcId]!;
    mastery[kcId] = { pL: updateMastery(st.pL, correct).pL, attempts: st.attempts + 1 };
  }
  return summarise(l, mastery, wasted, BUDGET);
};

function run(policy: Policy, learners: Learner[]): Outcome[] {
  return learners.map((l) => policy({ known: { ...l.known }, pT: { ...l.pT }, read: new Set() }));
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function sd(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function main() {
  const learners = Array.from({ length: LEARNERS }, makeLearner);
  const startKnown = mean(learners.map((l) => kcs.filter((kc) => l.known[kc.id]).length));
  const policies: [string, Policy][] = [
    ["Adaptive (the engine)", adaptive],
    ["Fixed syllabus", fixed],
    ["Random unlocked", random],
  ];
  const rows: string[] = [];
  rows.push(`| Policy | Items used (of ${BUDGET}) | KCs actually known at the end (of ${kcs.length}) | Items spent on KCs the learner already knew | Estimated mastered but not known | Known but not yet estimated mastered |`);
  rows.push("| --- | ---: | ---: | ---: | ---: | ---: |");
  const lines: string[] = [];
  for (const [name, policy] of policies) {
    const out = run(policy, learners);
    const used = out.map((o) => o.used);
    const known = out.map((o) => o.knownAtEnd);
    const wasted = out.map((o) => o.wasted);
    const falseM = out.map((o) => o.falseMastery);
    const missed = out.map((o) => o.missed);
    const pct = (mean(wasted) / mean(used)) * 100;
    const row = `| ${name} | ${mean(used).toFixed(1)} | ${mean(known).toFixed(2)} (sd ${sd(known).toFixed(2)}) | ${mean(wasted).toFixed(1)} (${pct.toFixed(0)}%) | ${mean(falseM).toFixed(2)} | ${mean(missed).toFixed(2)} |`;
    rows.push(row);
    lines.push(`${name.padEnd(24)} used ${mean(used).toFixed(1)}  known ${mean(known).toFixed(2)}  wasted ${mean(wasted).toFixed(1)} (${pct.toFixed(0)}%)  false-mastery ${mean(falseM).toFixed(2)}  missed ${mean(missed).toFixed(2)}`);
  }
  const header = `Routing policy simulation: ${LEARNERS} learners, ${BUDGET} items each, seed ${arg("seed", 7)}. Learners start knowing ${startKnown.toFixed(2)} of ${kcs.length} KCs on average.`;
  console.log(header + "\n");
  console.log(lines.join("\n"));
  console.log("\n" + rows.join("\n"));

  // Write into docs/EVALUATION.md between markers, creating the section if it's missing.
  const path = "docs/EVALUATION.md";
  let doc = readFileSync(path, "utf8");
  const block = `<!-- routing-sim:start -->\n${header}\n\n${rows.join("\n")}\n<!-- routing-sim:end -->`;
  if (doc.includes("<!-- routing-sim:start -->")) {
    doc = doc.replace(/<!-- routing-sim:start -->[\s\S]*<!-- routing-sim:end -->/, block);
  } else {
    doc += `\n\n## Routing policy simulation (${new Date().toISOString().slice(0, 10)})\n\nRun: \`npx tsx scripts/simulate-routing.ts\`. Same synthetic learners, three policies, one item budget; answers come from the learner's hidden true state, not from the engine's estimate.\n\n${block}\n`;
  }
  writeFileSync(path, doc);
  console.log(`\nWritten to ${path}`);
}

main();
