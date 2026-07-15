/**
 * Deterministically generate the Level-1 placeholder curriculum
 * (content/level1.json). Structure and KC ids are canonical (BUILD_PROMPT §6
 * Phase 2); the copy is placeholder and will be replaced by the author.
 *
 * Run: npx tsx scripts/generate-content.ts
 */
import { writeFileSync } from "node:fs";
import type {
  AnswerKey,
  Item,
  ItemPayload,
  Kc,
  Lesson,
  Level1Content,
} from "../lib/content/types";

const COURSE_ID = "trading-foundations";

const KC_DEFS: Array<{ id: string; title: string }> = [
  { id: "kc-candlestick-anatomy", title: "Candlestick anatomy" },
  { id: "kc-market-structure", title: "Market structure" },
  { id: "kc-support-resistance", title: "Support & resistance" },
  { id: "kc-liquidity-basics", title: "Liquidity basics" },
  { id: "kc-fair-value-gaps", title: "Fair value gaps" },
  { id: "kc-kill-zones", title: "Kill zones" },
  { id: "kc-risk-management", title: "Risk management" },
  { id: "kc-position-sizing", title: "Position sizing" },
];

/** Small synthetic OHLC series for annotation items — simulated data only. */
function candles(seed: number) {
  const out: Array<{ time: string; open: number; high: number; low: number; close: number }> = [];
  let price = 100 + seed * 3;
  for (let i = 0; i < 12; i++) {
    const drift = Math.sin(seed + i * 0.9) * 2;
    const open = price;
    const close = price + drift;
    out.push({
      time: `2024-01-${String(i + 1).padStart(2, "0")}`,
      open: round(open),
      high: round(Math.max(open, close) + 0.8),
      low: round(Math.min(open, close) - 0.8),
      close: round(close),
    });
    price = close;
  }
  return out;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function buildItems(kc: Kc, index: number): Item[] {
  const t = kc.title;
  const mk = (
    n: number,
    type: Item["type"],
    difficulty: Item["difficulty"],
    payload: ItemPayload,
    answerKey: AnswerKey,
    isPretestEligible: boolean,
  ): Item => ({
    id: `${kc.id}-item-${n}`,
    kcId: kc.id,
    type,
    difficulty,
    payload,
    answerKey,
    explanation: `Placeholder explanation for ${t.toLowerCase()} item ${n}: the correct response follows from the definition introduced in the lesson.`,
    isPretestEligible,
  });

  const opts = (stem: string) => [
    `${stem} — option A (placeholder)`,
    `${stem} — option B (placeholder, correct)`,
    `${stem} — option C (placeholder)`,
    `${stem} — option D (placeholder)`,
  ];

  return [
    mk(1, "mcq", "easy", { type: "mcq", question: `Which statement about ${t.toLowerCase()} is correct? (placeholder)`, options: opts(t) }, { type: "mcq", correct: 1 }, true),
    mk(2, "mcq", "med", { type: "mcq", question: `In the scenario described, how does ${t.toLowerCase()} apply? (placeholder)`, options: opts(t) }, { type: "mcq", correct: 1 }, true),
    mk(3, "mcq", "hard", { type: "mcq", question: `Which subtle case violates the ${t.toLowerCase()} principle? (placeholder)`, options: opts(t) }, { type: "mcq", correct: 1 }, false),
    mk(4, "multi", "med", { type: "multi", question: `Select every true statement about ${t.toLowerCase()}. (placeholder)`, options: opts(t) }, { type: "multi", correct: [1, 3] }, false),
    mk(5, "numeric", "easy", { type: "numeric", question: `Compute the placeholder ${t.toLowerCase()} value.`, unit: "pts", min: 0, max: 100, step: 0.5 }, { type: "numeric", value: 42, tolerance: 0.5 }, true),
    mk(6, "ordering", "med", { type: "ordering", question: `Order the steps of the ${t.toLowerCase()} checklist. (placeholder)`, entries: ["Step one (placeholder)", "Step two (placeholder)", "Step three (placeholder)", "Step four (placeholder)"] }, { type: "ordering", order: [0, 1, 2, 3] }, false),
    mk(7, "annotation", "hard", { type: "annotation", question: `Mark the zone on this simulated chart where ${t.toLowerCase()} is in play. (placeholder)`, candles: candles(index), describe: `A simulated 12-candle daily series used for the ${t.toLowerCase()} exercise; prices drift in a gentle sine pattern between roughly 96 and 108.` }, { type: "annotation", zone: { from: "2024-01-04", to: "2024-01-07", priceLow: 98, priceHigh: 104 } }, false),
    mk(8, "tf-confidence", "easy", { type: "tf-confidence", statement: `True or false: the placeholder definition of ${t.toLowerCase()} holds. (placeholder)` }, { type: "tf-confidence", value: true }, true),
  ];
}

function buildLesson(kc: Kc, index: number): Lesson {
  return {
    id: `${kc.id}-lesson`,
    kcId: kc.id,
    title: kc.title,
    blocks: [
      {
        kind: "markdown",
        md: `## ${kc.title}\n\nPlaceholder introduction to **${kc.title.toLowerCase()}**. This copy will be replaced by the author; the structure (reading column, figure, video, inline check) is canonical.\n\n- Placeholder key idea one\n- Placeholder key idea two\n- Placeholder key idea three\n\nAll charts in this lesson use simulated data. This is education, not financial advice.`,
      },
      {
        kind: "figure",
        src: `/figures/${kc.id}.svg`,
        caption: `Fig 1: placeholder ${kc.title.toLowerCase()} illustration (simulated data).`,
        describe: `Text alternative: a simulated chart illustrating ${kc.title.toLowerCase()}. Placeholder description to be replaced with the final figure copy.`,
      },
      { kind: "video", poster: `/posters/${kc.id}.svg` },
      { kind: "checkQuestion", itemId: `${kc.id}-item-1` },
    ],
    videoUrl: null, // NotebookLM videos slot in later
    videoFallbackUrl: null,
  };
}

const kcs: Kc[] = KC_DEFS.map((def, i) => ({
  ...def,
  courseId: COURSE_ID,
  prereqIds: i === 0 ? [] : [KC_DEFS[i - 1]!.id],
  level: 1,
  description: `Placeholder description for ${def.title.toLowerCase()} — replaced by author copy later.`,
}));

const content: Level1Content = {
  course: { id: COURSE_ID, title: "Trading Foundations", levels: [1] },
  kcs,
  lessons: kcs.map(buildLesson),
  items: kcs.flatMap(buildItems),
};

writeFileSync("content/level1.json", JSON.stringify(content, null, 2) + "\n");
console.log(
  `content/level1.json written: ${content.kcs.length} KCs, ${content.lessons.length} lessons, ${content.items.length} items`,
);
