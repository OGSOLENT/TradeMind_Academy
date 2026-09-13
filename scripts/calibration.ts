/**
 * The BKT calibration report. "Does the model's number mean what it says?"
 *
 * Every response in the log carries pLBefore, the model's estimate that the
 * learner knew the skill before answering. Through the BKT emission model
 * that becomes a predicted probability of a correct answer. If the model is
 * calibrated, answers the model gave a 70% chance to should come out right
 * about 70% of the time. This script checks exactly that:
 *
 *   1. a reliability table: predictions binned into deciles, with the
 *      observed accuracy in each bin and how many answers landed there
 *   2. the Brier score (mean squared error of the probabilities, lower is
 *      better), against a baseline that always predicts the overall
 *      accuracy, and the skill score that compares the two
 *   3. expected calibration error (ECE), the count-weighted gap between
 *      predicted and observed across the bins
 *   4. a held-out test of fixed priors against per-learner fitted
 *      parameters: fit (pL0, pT) on the first half of each learner's
 *      answers by maximum likelihood, predict the second half, and score
 *      both models the same way
 *
 * It runs on two kinds of data:
 *
 *   npx tsx scripts/calibration.ts --sim [--seed 42]   simulated learners with
 *                                                      known truth, so the
 *                                                      result is reproducible
 *   npx tsx scripts/calibration.ts --csv export/responses.csv
 *                                                      a real export from
 *                                                      scripts/export.ts
 *
 * Both write docs/report/CALIBRATION.md and a reliability diagram to
 * docs/report-figures/17-calibration.svg. The simulated cohort is the one
 * the report quotes, because the live dataset is a handful of people; the
 * CSV path is there for when the pilot has run.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { DEFAULT_PARAMS, predictCorrect, updateMastery, type BktParams } from "../lib/bkt";

const BINS = 10;

interface Obs {
  /** The model's predicted probability of a correct answer. */
  p: number;
  correct: boolean;
}

interface Scores {
  n: number;
  accuracy: number;
  brier: number;
  brierBase: number;
  skill: number;
  ece: number;
  bins: { lo: number; hi: number; n: number; predicted: number; observed: number }[];
}

// ---- Scoring ---------------------------------------------------------------

function score(obs: Obs[]): Scores {
  const n = obs.length;
  const accuracy = obs.filter((o) => o.correct).length / n;
  let brier = 0;
  let brierBase = 0;
  for (const o of obs) {
    const y = o.correct ? 1 : 0;
    brier += (o.p - y) ** 2;
    brierBase += (accuracy - y) ** 2;
  }
  brier /= n;
  brierBase /= n;
  const bins = Array.from({ length: BINS }, (_, i) => ({
    lo: i / BINS,
    hi: (i + 1) / BINS,
    n: 0,
    predicted: 0,
    observed: 0,
  }));
  for (const o of obs) {
    const i = Math.min(BINS - 1, Math.floor(o.p * BINS));
    const b = bins[i]!;
    b.n++;
    b.predicted += o.p;
    b.observed += o.correct ? 1 : 0;
  }
  let ece = 0;
  for (const b of bins) {
    if (b.n === 0) continue;
    b.predicted /= b.n;
    b.observed /= b.n;
    ece += (b.n / n) * Math.abs(b.predicted - b.observed);
  }
  return { n, accuracy, brier, brierBase, skill: 1 - brier / brierBase, ece, bins };
}

// ---- Simulated learners ----------------------------------------------------
// Same generator as scripts/simulate.ts: the truth is drawn from a range the
// fixed priors don't sit in the middle of, so the model has to earn its
// calibration rather than being handed it.

const seedArg = process.argv.indexOf("--seed");
let seed = seedArg > -1 ? Number(process.argv[seedArg + 1]) : 42;
function rand(): number {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
}

interface Learner {
  truth: BktParams;
  responses: boolean[];
}

function generateLearner(opportunities: number): Learner {
  const truth: BktParams = {
    pL0: 0.05 + rand() * 0.4,
    pT: 0.05 + rand() * 0.2,
    pG: DEFAULT_PARAMS.pG,
    pS: DEFAULT_PARAMS.pS,
  };
  let known = rand() < truth.pL0;
  const responses: boolean[] = [];
  for (let t = 0; t < opportunities; t++) {
    const pCorrect = known ? 1 - truth.pS : truth.pG;
    responses.push(rand() < pCorrect);
    if (!known && rand() < truth.pT) known = true;
  }
  return { truth, responses };
}

/** Run the real engine over a sequence and collect (prediction, outcome) pairs. */
function trace(responses: boolean[], params: BktParams, from = 0): Obs[] {
  let pL = params.pL0;
  const out: Obs[] = [];
  responses.forEach((correct, i) => {
    const p = predictCorrect(pL, params);
    if (i >= from) out.push({ p, correct });
    pL = updateMastery(pL, correct, params).pL;
  });
  return out;
}

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

function fitParams(responses: boolean[]): BktParams {
  let best: BktParams = { ...DEFAULT_PARAMS };
  let bestLL = -Infinity;
  for (let pL0 = 0.025; pL0 <= 0.5; pL0 += 0.025) {
    for (let pT = 0.02; pT <= 0.3; pT += 0.01) {
      const candidate = { ...DEFAULT_PARAMS, pL0, pT };
      const ll = logLikelihood(responses, candidate);
      if (ll > bestLL) {
        bestLL = ll;
        best = candidate;
      }
    }
  }
  return best;
}

// ---- The real log ----------------------------------------------------------

function readCsv(path: string): Obs[] {
  const [header, ...lines] = readFileSync(path, "utf8").split("\n").filter(Boolean);
  const cols = header!.split(",");
  const iCorrect = cols.indexOf("correct");
  const iBefore = cols.indexOf("pLBefore");
  if (iCorrect < 0 || iBefore < 0) throw new Error("CSV needs correct and pLBefore columns");
  const obs: Obs[] = [];
  for (const line of lines) {
    // Quoted fields can hold commas (the selected answer), so split carefully.
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    const pL = Number(cells[iBefore]);
    if (!Number.isFinite(pL)) continue;
    obs.push({ p: predictCorrect(pL), correct: cells[iCorrect] === "true" });
  }
  return obs;
}

// ---- Output ----------------------------------------------------------------

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function reliabilityTable(s: Scores): string {
  const rows = s.bins
    .filter((b) => b.n > 0)
    .map(
      (b) =>
        `| ${b.lo.toFixed(1)} to ${b.hi.toFixed(1)} | ${b.n} | ${pct(b.predicted)} | ${pct(b.observed)} | ${((b.observed - b.predicted) * 100).toFixed(1)} pp |`,
    );
  return [
    "| Predicted P(correct) | Answers | Mean predicted | Observed accuracy | Gap |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...rows,
  ].join("\n");
}

function diagram(fixed: Scores, fitted: Scores | null): string {
  const W = 560;
  const H = 420;
  const m = { l: 64, r: 24, t: 28, b: 56 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const x = (v: number) => m.l + v * pw;
  const y = (v: number) => m.t + (1 - v) * ph;
  const path = (s: Scores) =>
    s.bins
      .filter((b) => b.n > 0)
      .map((b, i) => `${i === 0 ? "M" : "L"}${x(b.predicted).toFixed(1)},${y(b.observed).toFixed(1)}`)
      .join(" ");
  const dots = (s: Scores, colour: string) =>
    s.bins
      .filter((b) => b.n > 0)
      .map(
        (b) =>
          `<circle cx="${x(b.predicted).toFixed(1)}" cy="${y(b.observed).toFixed(1)}" r="${(3 + 5 * Math.sqrt(b.n / s.n)).toFixed(1)}" fill="${colour}" fill-opacity="0.85"/>`,
      )
      .join("");
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1]
    .map(
      (t) =>
        `<text x="${x(t)}" y="${H - m.b + 20}" text-anchor="middle" class="t">${t.toFixed(1)}</text>` +
        `<text x="${m.l - 10}" y="${y(t) + 4}" text-anchor="end" class="t">${t.toFixed(1)}</text>` +
        `<line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H - m.b}" class="g"/>` +
        `<line y1="${y(t)}" y2="${y(t)}" x1="${m.l}" x2="${W - m.r}" class="g"/>`,
    )
    .join("");
  const legend =
    `<circle cx="${m.l + 12}" cy="${m.t + 12}" r="5" fill="#5e6ad2"/><text x="${m.l + 24}" y="${m.t + 16}" class="t">fixed priors${fitted ? ", held-out half" : ""} (Brier ${fixed.brier.toFixed(3)})</text>` +
    (fitted
      ? `<circle cx="${m.l + 12}" cy="${m.t + 32}" r="5" fill="#2dd4bf"/><text x="${m.l + 24}" y="${m.t + 36}" class="t">fitted per learner, held-out half (Brier ${fitted.brier.toFixed(3)})</text>`
      : "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, system-ui, sans-serif">
<style>.t{font-size:12px;fill:#444}.g{stroke:#e5e5ea;stroke-width:1}.ax{font-size:13px;fill:#222}</style>
<rect width="${W}" height="${H}" fill="#fff"/>
${ticks}
<line x1="${x(0)}" y1="${y(0)}" x2="${x(1)}" y2="${y(1)}" stroke="#999" stroke-dasharray="5 5"/>
<path d="${path(fixed)}" fill="none" stroke="#5e6ad2" stroke-width="2"/>
${dots(fixed, "#5e6ad2")}
${fitted ? `<path d="${path(fitted)}" fill="none" stroke="#2dd4bf" stroke-width="2"/>${dots(fitted, "#2dd4bf")}` : ""}
${legend}
<text x="${m.l + pw / 2}" y="${H - 12}" text-anchor="middle" class="ax">Predicted P(correct)</text>
<text x="16" y="${m.t + ph / 2}" text-anchor="middle" transform="rotate(-90 16 ${m.t + ph / 2})" class="ax">Observed accuracy</text>
</svg>
`;
}

function summary(label: string, s: Scores): string {
  return [
    `| ${label} | ${s.n} | ${pct(s.accuracy)} | ${s.brier.toFixed(4)} | ${s.brierBase.toFixed(4)} | ${(s.skill * 100).toFixed(1)}% | ${(s.ece * 100).toFixed(2)} pp |`,
  ].join("\n");
}

/** The report builder embeds PNGs (python-docx can't read SVG), so render one. */
async function rasterise(svg: string, out: string) {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 560, height: 420 }, deviceScaleFactor: 2 });
    await page.setContent(`<body style="margin:0">${svg}</body>`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 560, height: 420 } });
    await browser.close();
  } catch (err) {
    console.warn("PNG not written (no browser available):", (err as Error).message);
  }
}

async function main() {
  const csvArg = process.argv.indexOf("--csv");
  const useSim = process.argv.includes("--sim") || csvArg < 0;
  const N = 200;
  const OPP = 40;

  let source: string;
  let fixed: Scores;
  let heldFixed: Scores | null = null;
  let heldFitted: Scores | null = null;

  if (useSim) {
    const learners = Array.from({ length: N }, () => generateLearner(OPP));
    // Everything the model predicted, over every answer, with the fixed priors.
    fixed = score(learners.flatMap((l) => trace(l.responses, DEFAULT_PARAMS)));
    // Held out: fit on the first half, predict the second half, both models.
    const half = OPP / 2;
    const fixedObs: Obs[] = [];
    const fittedObs: Obs[] = [];
    for (const l of learners) {
      fixedObs.push(...trace(l.responses, DEFAULT_PARAMS, half));
      const fit = fitParams(l.responses.slice(0, half));
      fittedObs.push(...trace(l.responses, fit, half));
    }
    heldFixed = score(fixedObs);
    heldFitted = score(fittedObs);
    source = `${N} simulated learners × ${OPP} opportunities, seed ${seedArg > -1 ? process.argv[seedArg + 1] : 42}. Ground truth pL0 ~ U(0.05, 0.45), pT ~ U(0.05, 0.25); guess and slip fixed at the engine's values. The engine runs with its fixed priors (pL0 ${DEFAULT_PARAMS.pL0}, pT ${DEFAULT_PARAMS.pT}, pG ${DEFAULT_PARAMS.pG}, pS ${DEFAULT_PARAMS.pS}).`;
  } else {
    const path = process.argv[csvArg + 1]!;
    fixed = score(readCsv(path));
    source = `Real responses from \`${path}\` (${fixed.n} answers). Predicted P(correct) is the BKT emission applied to the logged pLBefore.`;
  }

  const lines: string[] = [];
  lines.push("# BKT calibration report");
  lines.push("");
  lines.push(`Generated by \`scripts/calibration.ts\` on ${new Date().toISOString().slice(0, 10)}.`);
  lines.push("");
  lines.push("## What this measures");
  lines.push("");
  lines.push(
    "Every logged answer carries the model's estimate that the learner knew the skill beforehand (pLBefore). Passed through the BKT emission model, P(correct) = pL(1 − slip) + (1 − pL)guess, that becomes a forecast. A calibrated model's forecasts come true at the rate they claim: answers given a 70% chance should be right about 70% of the time. The reliability table bins the forecasts into deciles and compares each bin's mean forecast with its observed accuracy. The Brier score is the mean squared error of the forecasts (0 is perfect, 0.25 is a coin toss); the baseline always forecasts the overall accuracy, and the skill score is the fraction of the baseline's error the model removes. Expected calibration error (ECE) is the count-weighted mean gap across the bins.",
  );
  lines.push("");
  lines.push("## Data");
  lines.push("");
  lines.push(source);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Model | Answers | Accuracy | Brier | Brier (baseline) | Skill | ECE |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  lines.push(summary("Fixed priors, all answers", fixed));
  if (heldFixed && heldFitted) {
    lines.push(summary("Fixed priors, held-out second half", heldFixed));
    lines.push(summary("Fitted per learner, held-out second half", heldFitted));
  }
  lines.push("");
  lines.push("## Reliability, fixed priors");
  lines.push("");
  lines.push(reliabilityTable(fixed));
  if (heldFitted) {
    lines.push("");
    lines.push("## Reliability, fitted per learner (held-out half)");
    lines.push("");
    lines.push(reliabilityTable(heldFitted));
  }
  lines.push("");
  lines.push("![Reliability diagram](../report-figures/17-calibration.png)");
  lines.push("");
  lines.push("## Reading it");
  lines.push("");
  if (heldFixed && heldFitted) {
    const gain = heldFixed.brier - heldFitted.brier;
    lines.push(
      `Fitting (pL0, pT) to each learner's first twenty answers ${gain > 0 ? "lowers" : "raises"} the held-out Brier score by ${Math.abs(gain).toFixed(4)} (${((Math.abs(gain) / heldFixed.brier) * 100).toFixed(1)}% of the fixed-prior error). ${gain > 0.002 ? "That's the case for estimating parameters from the pilot data rather than keeping the priors fixed once there's enough of it." : "The fixed priors hold up: with this little data per learner, fitting buys almost nothing, which is the case for keeping them until the pilot has run."}`,
    );
    lines.push("");
  }
  if (useSim) {
    lines.push(
      "A limit to be honest about: the simulated learners share the engine's guess and slip values, so this run tests what happens when the priors on initial knowledge and learning rate are wrong (they are, by construction), not whether the emission model itself is right. That second question needs real answers, which is what the `--csv` path is for once the pilot has run.",
    );
    lines.push("");
  }
  lines.push(
    `The dotted line is perfect calibration. Points above it are bins where learners did better than the model expected; points below, worse. Dot size is the share of answers in the bin. ECE of ${(fixed.ece * 100).toFixed(2)} pp means the model's number is, on average, within about ${Math.ceil(fixed.ece * 100)} percentage point${Math.ceil(fixed.ece * 100) === 1 ? "" : "s"} of what actually happened.`,
  );
  lines.push("");

  mkdirSync("docs/report", { recursive: true });
  mkdirSync("docs/report-figures", { recursive: true });
  writeFileSync("docs/report/CALIBRATION.md", lines.join("\n"));
  // Like against like: both lines on the diagram are the held-out half when
  // there is one, so the two Brier scores in the legend are comparable.
  const svg = diagram(heldFixed ?? fixed, heldFitted);
  writeFileSync("docs/report-figures/17-calibration.svg", svg);
  await rasterise(svg, "docs/report-figures/17-calibration.png");

  console.log(lines.slice(0, 40).join("\n"));
  console.log("\nWrote docs/report/CALIBRATION.md and docs/report-figures/17-calibration.{svg,png}");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
