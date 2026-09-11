/**
 * Build content/level1.json from the real curriculum.
 *
 * The source of truth is content/lessons/*.md, the written lessons I derived
 * from the video series. Edit the markdown, run this again, reseed. That's
 * the whole workflow.
 *
 * The structure is the knowledge components (one per module) in a strict
 * prerequisite chain, the lessons spread across them, and the authored
 * questions from scripts/level1-items.ts.
 *
 * Run: npx tsx scripts/generate-content.ts
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Item, Kc, Lesson, LessonBlock, Level1Content } from "../lib/content/types";
import { ITEMS } from "./level1-items";

const COURSE_ID = "trading-foundations";
const LESSON_DIR = "content/lessons";

/** The modules, in teaching order. Each one requires the one before it. */
const MODULES: Array<{ id: string; title: string; description: string; lessons: string[] }> = [
  {
    id: "kc-candle-anatomy",
    title: "The Candle",
    description:
      "Read a single candle: OHLC, the three candle types, and why every wick is a lower-timeframe trend.",
    lessons: ["01", "02"],
  },
  {
    id: "kc-liquidity",
    title: "Liquidity & Wicks",
    description:
      "Why price moves where it moves — buyside and sellside liquidity, and how wick size decides whether a candle can expand.",
    lessons: ["03", "04"],
  },
  {
    id: "kc-risk-sizing",
    title: "Risk & Position Sizing",
    description:
      "Fixed risk, calculated size: why the stop is set by structure and the quantity is the variable that follows.",
    lessons: ["03a", "03b", "03c"],
  },
  {
    id: "kc-reversal-patterns",
    title: "Reversal Patterns",
    description:
      "What a turn actually looks like: the Candle 2 closure, the Candle 3 variant, and why context beats shape.",
    lessons: ["05", "06"],
  },
  {
    id: "kc-cisd-confirmation",
    title: "Confirmation & Structure",
    description:
      "Prove a turn is real, not a fakeout: CISD, fair value gaps, protected swings, ideal swing points and order blocks.",
    lessons: ["07", "07a", "08", "09", "10", "11", "11a"],
  },
  {
    id: "kc-daily-bias",
    title: "Daily Bias",
    description:
      "Decide direction for the day using PDH, PDL and equilibrium — let the wick form, and know what to do when the bias is wrong.",
    lessons: ["12", "13", "13a", "14", "14a", "14b", "15"],
  },
  {
    id: "kc-fractal-model",
    title: "The Fractal Model",
    description:
      "The complete system: the T-Spot, standard deviation projections, fractal targets and the TTFM playbook.",
    lessons: ["16", "17", "18", "19"],
  },
  {
    id: "kc-smt-divergence",
    title: "SMT Divergence",
    description:
      "Add confluence without fooling yourself — correlated markets, and why the framework always comes first.",
    lessons: ["20"],
  },
  {
    id: "kc-weekly-profiles",
    title: "Weekly Profiles",
    description:
      "The four shapes a week takes, and which day to act on in each: expansion, midweek reversal, Thursday counter, consolidation.",
    lessons: ["21", "22", "23", "24", "25"],
  },
];

interface ParsedLesson {
  /** The filename prefix ("07", "07a"), which is the key MODULES refers to. */
  key: string;
  slug: string;
  title: string;
  video: string | null;
  main: string;
  tail: string;
}

/** Split a lesson's markdown into the body and the reference tail, dropping the meta lines. */
function parseLesson(file: string): ParsedLesson {
  const raw = readFileSync(path.join(LESSON_DIR, file), "utf8");
  const lines = raw.split("\n");

  const titleLine = lines.find((l) => l.startsWith("# ")) ?? "";
  const title = (titleLine.split("—")[1] ?? titleLine.replace(/^#\s*/, "")).trim();
  const key = /^([0-9]{2}[a-z]?)-/.exec(file)?.[1] ?? file.slice(0, 2);
  const video = /Video:\s*`([^`]+\.mp4)`/.exec(raw)?.[1] ?? null;

  // I drop the h1, the meta line, the standing disclaimer (the app renders
  // its own banner), the "Next:" navigation link, and the self-check section
  // because those questions became real items.
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

  return { key, slug: file.replace(/\.md$/, ""), title, video, main, tail };
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
    caption: `Fig: ${kc.title} — simulated illustration.`,
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
    .filter((f) => /^\d{2}[a-z]?-.*\.md$/.test(f))
    .sort();

  const parsed = new Map<string, ParsedLesson>();
  for (const f of files) {
    const p = parseLesson(f);
    parsed.set(p.key, p);
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
    // Each lesson gets a different pretest-eligible MCQ as its inline check.
    const checks = items.filter((it) => it.kcId === kc.id && it.type === "mcq");
    m.lessons.forEach((key, li) => {
      const p = parsed.get(key);
      if (!p) throw new Error(`Missing lesson markdown for lesson ${key}`);
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
