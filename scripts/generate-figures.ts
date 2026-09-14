/**
 * Generate placeholder figure and poster SVGs for the Level-1 lessons.
 * Simple branded frames with simulated candle glyphs. Real figures replace
 * them as I supply them. Run: npx tsx scripts/generate-figures.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Level1Content } from "../lib/content/types";

const content: Level1Content = JSON.parse(readFileSync("content/level1.json", "utf8"));

function candleGlyphs(seed: number): string {
  let out = "";
  for (let i = 0; i < 14; i++) {
    const x = 80 + i * 76;
    const mid = 260 + Math.sin(seed + i * 0.8) * 90;
    const h = 50 + ((seed * 7 + i * 13) % 60);
    const up = Math.sin(seed * 1.7 + i) > 0;
    const color = up ? "#2DD4BF" : "#FFB4AB";
    out += `<line x1="${x + 14}" y1="${mid - h / 2 - 24}" x2="${x + 14}" y2="${mid + h / 2 + 24}" stroke="${color}" stroke-width="3" opacity="0.7"/>`;
    out += `<rect x="${x}" y="${mid - h / 2}" width="28" height="${h}" rx="4" fill="${color}" opacity="0.85"/>`;
  }
  return out;
}

/** Titles go into XML text nodes, so the five special characters have to be escaped. */
function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * The lecture poster: the module title centred over the glyphs, nothing
 * else. The lesson page draws its own play button and label on top, so the
 * poster stays quiet, and it's object-cover'd into a 16:9 frame so the
 * text sits where the crop can't reach it.
 */
function poster(title: string, seed: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1a1a30"/>
      <stop offset="100%" stop-color="#07070c"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <g transform="translate(0 80)" opacity="0.55">${candleGlyphs(seed)}</g>
  <text x="600" y="600" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="600" fill="#E4E1ED">${esc(title)}</text>
</svg>\n`;
}

function svg(title: string, subtitle: string, seed: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520">
  <rect width="1200" height="520" fill="#0A0A0F"/>
  <rect x="1" y="1" width="1198" height="518" rx="16" fill="none" stroke="rgba(255,255,255,0.08)"/>
  ${candleGlyphs(seed)}
  <rect x="0" y="400" width="1200" height="120" fill="#050507" opacity="0.85"/>
  <text x="48" y="452" font-family="Menlo, monospace" font-size="26" fill="#E4E1ED">${esc(title)}</text>
  <text x="48" y="486" font-family="Menlo, monospace" font-size="16" fill="#908F9E">${esc(subtitle)}</text>
  <text x="1152" y="452" text-anchor="end" font-family="Menlo, monospace" font-size="14" fill="#FFB955">SIMULATED DATA · EDUCATION ONLY</text>
</svg>\n`;
}

mkdirSync("public/figures", { recursive: true });
mkdirSync("public/posters", { recursive: true });

content.kcs.forEach((kc, i) => {
  writeFileSync(`public/figures/${kc.id}.svg`, svg(kc.title, "Simulated candles, for illustration", i + 1));
  writeFileSync(`public/posters/${kc.id}.svg`, poster(kc.title, i + 5));
});

console.log(`Wrote ${content.kcs.length} figures + ${content.kcs.length} posters to public/`);
