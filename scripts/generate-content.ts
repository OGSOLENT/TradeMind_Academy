/**
 * Build content/level1.json from the REAL curriculum.
 *
 * Source of truth: content/lessons/*.md — the 25 written lessons derived from
 * the video series. Edit the markdown, re-run this script, re-seed.
 *
 * Structure: 8 knowledge components (the curriculum's 8 modules) in a strict
 * prerequisite chain, 25 lessons distributed across them, and 64 authored
 * questions (8 per KC) from scripts/level1-items.ts.
 *
 * Run: npx tsx scripts/generate-content.ts
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Item, Kc, Lesson, LessonBlock, Level1Content } from "../lib/content/types";
import { ITEMS } from "./level1-items";

const COURSE_ID = "trading-foundations";
const LESSON_DIR = "content/lessons";

/** The eight modules, in teaching order. Prerequisites chain strictly. */
const MODULES: Array<{ id: string; title: string; description: string; lessons: number[] }> = [
  {
    id: "kc-candle-anatomy",
    title: "The Candle",
    description:
      "Read a single candle: OHLC, the three candle types, and why every wick is a lower-timeframe trend.",
    lessons: [1, 2],
  },
  {
    id: "kc-liquidity",
    title: "Liquidity & Wicks",
    description:
      "Why price moves where it moves — buyside and sellside liquidity, and how wick size decides whether a candle can expand.",
    lessons: [3, 4],
  },
  {
    id: "kc-reversal-patterns",
    title: "Reversal Patterns",
    description:
      "What a turn actually looks like: the Candle 2 closure, the Candle 3 variant, and why context beats shape.",
    lessons: [5, 6],
  },
  {
    id: "kc-cisd-confirmation",
    title: "Confirmation & Structure",
    description:
      "Prove a turn is real, not a fakeout: CISD, protected swings, ideal swing points and order blocks.",
    lessons: [7, 8, 9, 10, 11],
  },
  {
    id: "kc-daily-bias",
    title: "Daily Bias",
    description:
      "Decide direction for the day using PDH, PDL and equilibrium — and know what to do when the bias is wrong.",
    lessons: [12, 13, 14, 15],
  },
  {
    id: "kc-fractal-model",
    title: "The Fractal Model",
    description:
      "The complete system: the T-Spot, standard deviation projections, fractal targets and the TTFM playbook.",
    lessons: [16, 17, 18, 19],
  },
  {
    id: "kc-smt-divergence",
    title: "SMT Divergence",
    description:
      "Add confluence without fooling yourself — correlated markets, and why the framework always comes first.",
    lessons: [20],
  },
  {
    id: "kc-weekly-profiles",
    title: "Weekly Profiles",
    description:
      "The four shapes a week takes, and which day to act on in each: expansion, midweek reversal, Thursday counter, consolidation.",
    lessons: [21, 22, 23, 24, 25],
  },
];

interface ParsedLesson {
  n: number;
  slug: string;
  title: string;
  video: string | null;
  main: string;
  tail: string;
}

/** Split a lesson markdown into a body and a reference tail, dropping meta. */
function parseLesson(file: string): ParsedLesson {
  const raw = readFileSync(path.join(LESSON_DIR, file), "utf8");
  const lines = raw.split("\n");

  const titleLine = lines.find((l) => l.startsWith("# ")) ?? "";
  const title = (titleLine.split("—")[1] ?? titleLine.replace(/^#\s*/, "")).trim();
  const n = Number(file.slice(0, 2));
  const video = /Video:\s*`([^`]+\.mp4)`/.exec(raw)?.[1] ?? null;

  // Drop: h1, the meta line, the standing disclaimer (the app renders its own
  // banner), the "Next:" navigation link, and the self-check section (those
  // questions became real items).
  const kept: string[] = [];
  let section = "";
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("## ")) section = t.slice(3).trim();
    if (t.startsWith("# ")) continue;
    if (t.startsWith("**Module ") && t.includes("Video:")) continue;
    if (t.startsWith("> Educational content only")) continue;
    if (t.startsWith("**Format note:**")) continue;
    if (t.startsWith("**Next:**")) continue;
    if (section === "Check your understanding") continue;
    kept.push(line);
  }

  const body = kept.join("\n").trim();
  const splitAt = body.indexOf("## Key terms");
  const main = (splitAt === -1 ? body : body.slice(0, splitAt)).trim();
  const tail = splitAt === -1 ? "" : body.slice(splitAt).trim();

  return { n, slug: file.replace(/\.md$/, ""), title, video, main, tail };
}

function buildLesson(parsed: ParsedLesson, kc: Kc, checkItemId: string | null): Lesson {
  const blocks: LessonBlock[] = [];

  if (parsed.video) {
    blocks.push({ kind: "video", poster: `/posters/${kc.id}.svg` });
  }
  blocks.push({ kind: "markdown", md: parsed.main });
  blocks.push({
    kind: "figure",
    src: `/figures/${kc.id}.svg`,
    caption: `Fig ${parsed.n}: ${kc.title} — simulated illustration.`,
    describe: `Text alternative: a simulated candlestick series illustrating ${kc.title.toLowerCase()}. Prices are generated for teaching purposes and do not represent any real market.`,
  });
  if (checkItemId) blocks.push({ kind: "checkQuestion", itemId: checkItemId });
  if (parsed.tail) blocks.push({ kind: "markdown", md: parsed.tail });

  return {
    id: `${parsed.slug}`,
    kcId: kc.id,
    title: parsed.title,
    blocks,
    videoUrl: parsed.video ? `/videos/${parsed.video}` : null,
    videoFallbackUrl: null,
  };
}

function main() {
  const files = readdirSync(LESSON_DIR)
    .filter((f) => /^\d{2}-.*\.md$/.test(f))
    .sort();

  const parsed = new Map<number, ParsedLesson>();
  for (const f of files) {
    const p = parseLesson(f);
    parsed.set(p.n, p);
  }

  const kcs: Kc[] = MODULES.map((m, i) => ({
    id: m.id,
    courseId: COURSE_ID,
    title: m.title,
    prereqIds: i === 0 ? [] : [MODULES[i - 1]!.id],
    level: 1,
    description: m.description,
  }));

  const items: Item[] = [];
  for (const kc of kcs) {
    const seeds = ITEMS[kc.id] ?? [];
    if (seeds.length === 0) throw new Error(`No items authored for ${kc.id}`);
    seeds.forEach((seed, i) => {
      items.push({ id: `${kc.id}-item-${i + 1}`, kcId: kc.id, ...seed });
    });
  }

  const lessons: Lesson[] = [];
  MODULES.forEach((m, mi) => {
    const kc = kcs[mi]!;
    // Use a different pretest-eligible MCQ as each lesson's inline check.
    const checks = items.filter((it) => it.kcId === kc.id && it.type === "mcq");
    m.lessons.forEach((n, li) => {
      const p = parsed.get(n);
      if (!p) throw new Error(`Missing lesson markdown for lesson ${n}`);
      lessons.push(buildLesson(p, kc, checks[li % checks.length]?.id ?? null));
    });
  });

  const content: Level1Content = {
    course: { id: COURSE_ID, title: "Trading Foundations", levels: [1] },
    kcs,
    lessons,
    items,
  };

  writeFileSync("content/level1.json", JSON.stringify(content, null, 2) + "\n");
  console.log(
    `content/level1.json written: ${kcs.length} KCs, ${lessons.length} lessons, ${items.length} items`,
  );
  for (const kc of kcs) {
    const n = lessons.filter((l) => l.kcId === kc.id).length;
    console.log(`  ${kc.id.padEnd(24)} ${n} lesson(s), ${ITEMS[kc.id]!.length} items`);
  }
  const missingVideo = lessons.filter((l) => !l.videoUrl);
  if (missingVideo.length) console.log(`  note: ${missingVideo.length} lesson(s) without video`);
}

main();
