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
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Item, Kc, Lesson, LessonBlock, Level1Content } from "../lib/content/types";
import { ITEMS } from "./level1-items";
import { WALKTHROUGHS } from "../lib/walkthroughs";
import { CASE_STUDIES } from "../lib/case-studies";

// Where the recordings are hosted. scripts/upload-videos.mjs writes this
// after pushing the files to Vercel Blob; without it, videoUrl stays the
// local /videos/ path the dev server serves through the symlink.
const VIDEO_URLS: Record<string, string> = existsSync("content/video-urls.json")
  ? (JSON.parse(readFileSync("content/video-urls.json", "utf8")) as Record<string, string>)
  : {};

// The diagram component is a client module with framer in it, so the
// generator keeps its own list of ids rather than importing it.
const DIAGRAM_IDS = new Set(["timeframe-stack", "session-clock", "instrument-map", "prop-firm-funnel"]);

const COURSE_ID = "trading-foundations";
const LESSON_DIR = "content/lessons";

/** The modules, in teaching order. Each one requires the one before it. Sixteen since September 2026. */
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
    id: "kc-market-structure",
    title: "Market Structure & Delivery",
    description:
      "The shared vocabulary of structure: BOS, CHoCH and the Market Structure Shift, the four phases of delivery, and premium, discount and the OTE band.",
    lessons: ["26", "27", "28"],
  },
  {
    id: "kc-pd-arrays",
    title: "PD Arrays",
    description:
      "The complete menu of levels and how to rank them: the matrix, breaker and mitigation blocks, the rejection block, the inversion gap, the unicorn and opening gaps.",
    lessons: ["29", "30", "31", "32", "33"],
  },
  {
    id: "kc-daily-bias",
    title: "Daily Bias",
    description:
      "Decide direction for the day using PDH, PDL and equilibrium — let the wick form, and know what to do when the bias is wrong.",
    lessons: ["12", "13", "13a", "14", "14a", "14b", "15"],
  },
  {
    id: "kc-time-sessions",
    title: "Time & Sessions",
    description:
      "When the market actually delivers: Power of Three, the Judas swing, session anatomy and the true day open, macros, the Silver Bullet, and high-impact news.",
    lessons: ["34", "35", "36", "37", "38", "39"],
  },
  {
    id: "kc-entry-models",
    title: "Entry Models",
    description:
      "The models assembled from everything before them: the 2022 model, turtle soup, the market maker model, and top-down analysis as the routine that ties them together.",
    lessons: ["40", "41", "42", "43"],
  },
  {
    id: "kc-fractal-model",
    title: "The Fractal Model",
    description:
      "The complete system: the T-Spot, standard deviation projections, fractal targets, the playbook, and then the deep end: candle counting, profiles, timeframe pairs, the 1-minute inversion, intracandle CISD and two trades end to end.",
    lessons: ["16", "17", "18", "19", "49", "50", "51", "52", "53", "54"],
  },
  {
    id: "kc-smt-divergence",
    title: "SMT Divergence",
    description:
      "Add confluence without fooling yourself — correlated markets, and why the framework always comes first.",
    lessons: ["20"],
  },
  {
    id: "kc-htf-context",
    title: "Higher-Timeframe Context",
    description:
      "The range the daily lives inside: IPDA data ranges over 20, 40 and 60 days, and the correlations between the dollar, the indices and risk.",
    lessons: ["44", "45"],
  },
  {
    id: "kc-weekly-profiles",
    title: "Weekly Profiles",
    description:
      "The four shapes a week takes, and which day to act on in each: expansion, midweek reversal, Thursday counter, consolidation.",
    lessons: ["21", "22", "23", "24", "25"],
  },
  {
    id: "kc-execution-review",
    title: "Execution & Review",
    description:
      "Everything after the entry: partials, break-even and structure-based trailing, the journal and the backtest, and thinking in probabilities.",
    lessons: ["46", "47", "48"],
  },
  {
    id: "kc-instruments",
    title: "Markets, Instruments & Funding",
    description:
      "The account behind the chart: how futures and CFDs work, which fits which trader, and how to judge a prop firm's rules before paying for an evaluation.",
    lessons: ["55", "56", "57", "58"],
  },
];

interface ParsedLesson {
  /** The filename prefix ("07", "07a"), which is the key MODULES refers to. */
  key: string;
  slug: string;
  title: string;
  video: string | null;
  /** Walkthrough ids from the meta line, in order. */
  walkthroughs: string[];
  /** Real-chart case study ids from the meta line. */
  caseStudies: string[];
  /** Diagram ids from the meta line. */
  diagrams: string[];
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
  // Walkthrough: `id` or Walkthrough: `id`, `id`. Each id has to exist in
  // lib/walkthroughs, and the check below fails the build if it doesn't.
  const walkthroughs = (/Walkthrough:\s*((?:`[^`]+`\s*,?\s*)+)/.exec(raw)?.[1] ?? "")
    .split(",")
    .map((s) => s.replace(/`/g, "").trim())
    .filter(Boolean);
  for (const id of walkthroughs) {
    if (!WALKTHROUGHS[id]) throw new Error(`${file}: unknown walkthrough "${id}"`);
  }
  // CaseStudy: `id`. A real-chart example, cut from history by
  // scripts/find-case-studies.ts; it has to exist in lib/case-studies.
  const caseStudies = (/CaseStudy:\s*((?:`[^`]+`\s*,?\s*)+)/.exec(raw)?.[1] ?? "")
    .split(",")
    .map((s) => s.replace(/`/g, "").trim())
    .filter(Boolean);
  for (const id of caseStudies) {
    if (!CASE_STUDIES[id]) throw new Error(`${file}: unknown case study "${id}"`);
  }
  // Diagram: `id`. The ids are the keys of DIAGRAMS in components/learn/diagram.tsx.
  const diagrams = (/Diagram:\s*((?:`[^`]+`\s*,?\s*)+)/.exec(raw)?.[1] ?? "")
    .split(",")
    .map((s) => s.replace(/`/g, "").trim())
    .filter(Boolean);
  for (const id of diagrams) {
    if (!DIAGRAM_IDS.has(id)) throw new Error(`${file}: unknown diagram "${id}"`);
  }

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

  return { key, slug: file.replace(/\.md$/, ""), title, video, walkthroughs, caseStudies, diagrams, main, tail };
}

function buildLesson(parsed: ParsedLesson, kc: Kc, checkItemId: string | null): Lesson {
  const blocks: LessonBlock[] = [];

  // The order is visuals first, then the prose. A recording, if there is
  // one; then every walkthrough; then the real-chart case study; then the
  // lesson. The page hides the recording where the video files aren't
  // hosted, and because the walkthrough sits right behind it, a lesson
  // whose video is missing looks exactly like a lesson that never had one.
  // There is no "coming soon" slot any more: a lesson with no video and no
  // walkthrough simply starts with its prose.
  if (parsed.video) blocks.push({ kind: "video", poster: `/posters/${kc.id}.svg` });
  for (const id of parsed.walkthroughs) blocks.push({ kind: "walkthrough", id });
  for (const id of parsed.caseStudies) blocks.push({ kind: "caseStudy", id });
  for (const id of parsed.diagrams) blocks.push({ kind: "diagram", id });
  blocks.push({ kind: "markdown", md: parsed.main });
  // The generic module figure only where there's no walkthrough to do the
  // job properly, and never for the instruments module, where a simulated
  // candle chart would illustrate nothing.
  if (parsed.walkthroughs.length === 0 && parsed.caseStudies.length === 0 && kc.id !== "kc-instruments") {
    blocks.push({
      kind: "figure",
      src: `/figures/${kc.id}.svg`,
      caption: `Fig: ${kc.title} — simulated illustration.`,
      describe: `Text alternative: a simulated candlestick series illustrating ${kc.title.toLowerCase()}. Prices are generated for teaching purposes and do not represent any real market.`,
    });
  }
  if (checkItemId) blocks.push({ kind: "checkQuestion", itemId: checkItemId });
  if (parsed.tail) blocks.push({ kind: "markdown", md: parsed.tail });

  return {
    id: `${parsed.slug}`,
    kcId: kc.id,
    title: parsed.title,
    blocks,
    videoUrl: parsed.video ? VIDEO_URLS[parsed.video] ?? `/videos/${parsed.video}` : null,
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
  const withWalkthrough = missingVideo.filter((l) => l.blocks.some((b) => b.kind === "walkthrough"));
  if (missingVideo.length)
    console.log(
      `  note: ${missingVideo.length} lesson(s) without video, ${withWalkthrough.length} of them with a walkthrough, ${missingVideo.length - withWalkthrough.length} text-first`,
    );
}

main();
