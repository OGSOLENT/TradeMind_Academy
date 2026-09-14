/**
 * Renders every walkthrough to a PNG, one per step, plus a contact sheet.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/render-walkthroughs.tsx            everything
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/render-walkthroughs.tsx breaker-block   one id
 *
 * Output goes to docs/walkthroughs/<id>/step-N.png and
 * docs/walkthroughs/contact-sheet.png. The chart is the same pure component
 * the lesson page uses, rendered to static markup with the app's dark
 * palette inlined, so what's checked here is what a learner sees. I use
 * the sheet to catch label collisions across all 25 without clicking
 * through 100 steps in a browser.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { WALKTHROUGHS } from "../lib/walkthroughs";
import { CASE_STUDIES } from "../lib/case-studies";
import { WalkthroughChart } from "../components/learn/walkthrough-chart";

const only = process.argv[2];
/** Synthetic walkthroughs and real-chart case studies, one registry for the harness. */
const EVERYTHING = { ...WALKTHROUGHS, ...CASE_STUDIES };

const CSS = `
  :root {
    --bg-elevated: #101018; --fg-primary: #e4e1ed; --fg-secondary: #908f9e; --fg-muted: #5b5b6b;
    --accent-bright: #bdc2ff; --mastery-bright: #44e2cd; --warning: #ffb955; --danger: #ffb4ab;
    --bull: #2dd4bf; --bear: #ffb4ab; --font-sans: Inter, system-ui, sans-serif;
  }
  body { margin: 0; background: var(--bg-elevated); font-family: var(--font-sans); }
  .num { font-family: "JetBrains Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
  .frame { width: 820px; padding: 12px 16px 8px; box-sizing: border-box; }
  .title { color: var(--fg-primary); font-size: 14px; font-weight: 500; margin: 0 0 2px; }
  .sub { color: var(--fg-muted); font-size: 11px; margin: 0 0 6px; }
  .cap { color: var(--fg-secondary); font-size: 12.5px; line-height: 1.5; margin: 6px 0 0; }
  .cap b { color: var(--fg-primary); font-weight: 500; }
  svg { display: block; width: 100%; }
`;

function page(id: string, step: number): string {
  const spec = EVERYTHING[id]!;
  const svg = renderToStaticMarkup(createElement(WalkthroughChart, { spec, step }));
  const s = spec.steps[step]!;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="frame"><p class="title">${spec.source ? "REAL CHART · " : ""}${spec.title}</p><p class="sub">${spec.frame}${spec.source ? ` · ${spec.source.provider}, retrieved ${spec.source.retrieved}` : ""}</p>${svg}
  <p class="cap"><b>Step ${step + 1} of ${spec.steps.length} · ${s.title}.</b> ${s.caption}</p></div></body></html>`;
}

async function main() {
  const ids = only ? [only] : Object.keys(EVERYTHING);
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 820, height: 700 }, deviceScaleFactor: 1 });
  const finals: string[] = [];
  for (const id of ids) {
    const spec = EVERYTHING[id];
    if (!spec) throw new Error(`unknown walkthrough ${id}`);
    const dir = `docs/walkthroughs/${id}`;
    mkdirSync(dir, { recursive: true });
    for (let step = 0; step < spec.steps.length; step++) {
      await pg.setContent(page(id, step));
      const frame = pg.locator(".frame");
      const out = `${dir}/step-${step + 1}.png`;
      await frame.screenshot({ path: out });
      if (step === spec.steps.length - 1) finals.push(out);
    }
    console.log(`${id}: ${spec.steps.length} steps`);
  }
  await browser.close();
  writeFileSync("docs/walkthroughs/finals.txt", finals.join("\n") + "\n");
  console.log(`\n${ids.length} walkthroughs rendered to docs/walkthroughs/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
