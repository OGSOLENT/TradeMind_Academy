/**
 * Simulated-learner harness (BUILD_PROMPT §5) — dissertation evidence.
 *
 * Generates N=200 synthetic learners with KNOWN ground-truth BKT parameters,
 * has them answer through the true generative model, runs the REAL engine
 * over their responses, then:
 *   1. asserts the three AE1 sanity behaviours, and
 *   2. recovers (pL0, pT) per learner by maximum-likelihood grid search and
 *      reports RMSE against ground truth,
 * writing the results table into docs/EVALUATION.md between markers.
 *
 * Run: npx tsx scripts/simulate.ts [--seed 42]
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  DEFAULT_PARAMS,
  MASTERY_THRESHOLD,
  REMEDIATION_THRESHOLD,
  predictCorrect,
  updateMastery,
  type BktParams,
} from "../lib/bkt";

const N = 200;
const OPPORTUNITIES = 40;
const seedArg = process.argv.indexOf("--seed");
let seed = seedArg > -1 ? Number(process.argv[seedArg + 1]) : 42;

/** Deterministic LCG so the report table is reproducible. */
function rand(): number {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
}

interface Learner {
  truth: BktParams;
  responses: boolean[];
}

function generateLearner(): Learner {
  const truth: BktParams = {
    pL0: 0.05 + rand() * 0.4, // U(0.05, 0.45)
    pT: 0.05 + rand() * 0.2, // U(0.05, 0.25)
    pG: DEFAULT_PARAMS.pG, // fixed — identifiability
    pS: DEFAULT_PARAMS.pS,
  };
  let known = rand() < truth.pL0;
  const responses: boolean[] = [];
  for (let t = 0; t < OPPORTUNITIES; t++) {
    const pCorrect = known ? 1 - truth.pS : truth.pG;
    responses.push(rand() < pCorrect);
    if (!known && rand() < truth.pT) known = true;
  }
  return { truth, responses };
}

/** Log-likelihood of a response sequence under BKT(params). */
function logLikelihood(responses: boolean[], params: BktParams): number {
  let pL = params.pL0;
  let ll = 0;
  for (const correct of responses) {
    const p = predictCorrect(pL, params);
    ll += Math.log(correct ? p : 1 - p);
    pL = updateMastery(pL, correct, params).pL;
  }
  return ll;
}

function fitParams(responses: boolean[]): { pL0: number; pT: number } {
  let best = { pL0: 0.25, pT: 0.12 };
  let bestLL = -Infinity;
  for (let pL0 = 0.025; pL0 <= 0.5; pL0 += 0.025) {
    for (let pT = 0.02; pT <= 0.3; pT += 0.01) {
      const ll = logLikelihood(responses, { ...DEFAULT_PARAMS, pL0, pT });
      if (ll > bestLL) {
        bestLL = ll;
        best = { pL0, pT };
      }
    }
  }
  return best;
}

function main() {
  console.log(
    `\n━━━ TradeMind simulated-learner harness — N=${N}, ${OPPORTUNITIES} opportunities ━━━\n`,
  );

  // ---- Sanity 1: all-correct streak crosses 0.8 within a few items -------
  let pL = DEFAULT_PARAMS.pL0;
  let toMastery = 0;
  while (pL < MASTERY_THRESHOLD) {
    pL = updateMastery(pL, true).pL;
    toMastery++;
  }
  const sanity1 = toMastery <= 5;
  console.log(
    `Sanity 1 — correct streak crosses ${MASTERY_THRESHOLD}: ${toMastery} items ${sanity1 ? "✅" : "❌"}`,
  );

  // ---- Sanity 2: all-wrong streak stays below 0.4 -------------------------
  pL = DEFAULT_PARAMS.pL0;
  let maxWrong = 0;
  for (let i = 0; i < 20; i++) {
    pL = updateMastery(pL, false).pL;
    maxWrong = Math.max(maxWrong, pL);
  }
  const sanity2 = maxWrong < REMEDIATION_THRESHOLD;
  console.log(
    `Sanity 2 — wrong streak stays < ${REMEDIATION_THRESHOLD}: max ${maxWrong.toFixed(4)} ${sanity2 ? "✅" : "❌"}`,
  );

  // ---- Generate cohort -----------------------------------------------------
  const learners = Array.from({ length: N }, generateLearner);

  // ---- Sanity 3: improving learners climb monotonically-ish ---------------
  let climbing = 0;
  for (const learner of learners) {
    let est = DEFAULT_PARAMS.pL0;
    const trajectory: number[] = [est];
    for (const r of learner.responses) {
      est = updateMastery(est, r).pL;
      trajectory.push(est);
    }
    const first = trajectory[Math.floor(trajectory.length / 4)]!;
    const last = trajectory[trajectory.length - 1]!;
    if (last > first) climbing++;
  }
  const climbPct = (climbing / N) * 100;
  const sanity3 = climbPct >= 80;
  console.log(
    `Sanity 3 — learners climb (last quarter > first quarter): ${climbPct.toFixed(1)}% ${sanity3 ? "✅" : "❌"}`,
  );

  // ---- Parameter recovery ---------------------------------------------------
  let seL0 = 0;
  let seT = 0;
  let biasL0 = 0;
  let biasT = 0;
  // Per-learner truth vs fit, dumped as CSV so the report can plot recovery
  // rather than quote a single RMSE (docs/simulation-recovery.csv).
  const rows = ["learner,true_pL0,fit_pL0,true_pT,fit_pT,correct_rate"];
  for (const [i, learner] of learners.entries()) {
    const fit = fitParams(learner.responses);
    seL0 += (fit.pL0 - learner.truth.pL0) ** 2;
    seT += (fit.pT - learner.truth.pT) ** 2;
    biasL0 += fit.pL0 - learner.truth.pL0;
    biasT += fit.pT - learner.truth.pT;
    const rate = learner.responses.filter(Boolean).length / learner.responses.length;
    rows.push(
      `${i},${learner.truth.pL0.toFixed(4)},${fit.pL0.toFixed(4)},${learner.truth.pT.toFixed(4)},${fit.pT.toFixed(4)},${rate.toFixed(4)}`,
    );
  }
  writeFileSync("docs/simulation-recovery.csv", rows.join("\n") + "\n");
  const rmseL0 = Math.sqrt(seL0 / N);
  const rmseT = Math.sqrt(seT / N);

  const table = [
    "| Metric | Value |",
    "| --- | --- |",
    `| Learners (N) | ${N} |`,
    `| Opportunities per learner | ${OPPORTUNITIES} |`,
    `| Sanity 1 — correct streak crosses 0.8 | ${toMastery} items ${sanity1 ? "✅" : "❌"} |`,
    `| Sanity 2 — wrong streak stays < 0.4 | max pL ${maxWrong.toFixed(4)} ${sanity2 ? "✅" : "❌"} |`,
    `| Sanity 3 — improving learners climb | ${climbPct.toFixed(1)}% of cohort ${sanity3 ? "✅" : "❌"} |`,
    `| RMSE(pL0) — recovery vs ground truth | ${rmseL0.toFixed(4)} (bias ${(biasL0 / N).toFixed(4)}) |`,
    `| RMSE(pT) — recovery vs ground truth | ${rmseT.toFixed(4)} (bias ${(biasT / N).toFixed(4)}) |`,
    `| Ground-truth priors | pL0 ~ U(0.05, 0.45) · pT ~ U(0.05, 0.25) · pG=${DEFAULT_PARAMS.pG} · pS=${DEFAULT_PARAMS.pS} fixed |`,
  ].join("\n");

  console.log(
    `\nParameter recovery: RMSE(pL0)=${rmseL0.toFixed(4)}  RMSE(pT)=${rmseT.toFixed(4)}\n`,
  );
  console.log(table);

  // ---- Write into EVALUATION.md between markers -----------------------------
  const path = "docs/EVALUATION.md";
  const START = "<!-- SIMULATION:START -->";
  const END = "<!-- SIMULATION:END -->";
  const section = `${START}\n\n### Simulated-learner harness (BKT validation)\n\nGenerated ${new Date().toISOString().slice(0, 10)} by \`scripts/simulate.ts\` (seeded, reproducible).\n\n${table}\n\n${END}`;
  let md = readFileSync(path, "utf8");
  if (md.includes(START)) {
    md = md.replace(new RegExp(`${START}[\\s\\S]*${END}`), section);
  } else {
    md += `\n${section}\n`;
  }
  writeFileSync(path, md);
  console.log(`\nWritten to ${path}.`);

  if (!sanity1 || !sanity2 || !sanity3) {
    console.error("\n❌ Sanity behaviour failed — engine must not ship.");
    process.exit(1);
  }
}

main();
