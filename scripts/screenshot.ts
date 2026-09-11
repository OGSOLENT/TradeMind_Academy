/**
 * Capture report screenshots of the running app. It expects the emulator
 * server on 3100 (`npm run dev:emulator`) to be up. Usage: npx tsx scripts/screenshot.ts
 */
import { chromium, devices } from "@playwright/test";

const BASE = "http://localhost:3100";
const OUT = "docs/screenshots";

async function main() {
  const browser = await chromium.launch();

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(`${BASE}/dev/kitchen-sink`, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 1500));
  await desktop.screenshot({ path: `${OUT}/kitchen-sink-desktop.png`, fullPage: true });
  await desktop.goto(`${BASE}/`, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 1500));
  await desktop.screenshot({ path: `${OUT}/home-desktop.png` });

  const mobile = await browser.newPage({ ...devices["iPhone 13"] });
  await mobile.goto(`${BASE}/dev/kitchen-sink`, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 1500));
  await mobile.screenshot({ path: `${OUT}/kitchen-sink-mobile.png`, fullPage: true });

  await browser.close();
  console.log(`Screenshots written to ${OUT}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
