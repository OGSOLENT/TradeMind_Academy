/**
 * The Phase 6 audit runner. Lighthouse accessibility and performance across
 * the public AND the signed-in pages. It launches a headless Chrome with a
 * debugging port, signs a fresh user in over CDP (auth persists in the
 * profile's IndexedDB), then points Lighthouse at that same browser.
 *
 * Needs the emulator production server on :3100 (`npm run build:emulator`
 * then `npm run start:emulator`), the emulators and the seed, and Chrome at
 * the standard macOS path. Run: npx tsx scripts/audit.ts
 */
import { execFileSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { chromium } from "@playwright/test";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9223;
const PROFILE = "/tmp/tm-audit-profile";
const BASE = "http://localhost:3100";

interface AuditRow {
  page: string;
  url: string;
  categories: string[];
}

const TARGETS: AuditRow[] = [
  { page: "Landing", url: `${BASE}/`, categories: ["accessibility", "performance"] },
  { page: "Sign-in", url: `${BASE}/sign-in`, categories: ["accessibility"] },
  { page: "Legal", url: `${BASE}/legal`, categories: ["accessibility"] },
  { page: "Dashboard (authed)", url: `${BASE}/dashboard`, categories: ["accessibility", "performance"] },
  { page: "Skill tree (authed)", url: `${BASE}/skill-tree`, categories: ["accessibility"] },
  { page: "Settings (authed)", url: `${BASE}/settings`, categories: ["accessibility"] },
  { page: "Kitchen sink", url: `${BASE}/dev/kitchen-sink`, categories: ["accessibility"] },
];

async function chromeAlive(): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${PORT}/json/version`, {
      signal: AbortSignal.timeout(1000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  let chrome: ReturnType<typeof spawn> | null = null;
  if (!(await chromeAlive())) {
    rmSync(PROFILE, { recursive: true, force: true });
    chrome = spawn(
      CHROME,
      [`--headless=new`, `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, "about:blank"],
      { stdio: "ignore" },
    );
    await new Promise((r) => setTimeout(r, 3000));
  }

  try {
    // Sign a fresh user in inside THIS browser, so the Lighthouse tabs are signed in too.
    const browser = await chromium.connectOverCDP(`http://localhost:${PORT}`);
    const ctx = browser.contexts()[0] ?? (await browser.newContext());
    const page = await ctx.newPage();
    await page.goto(`${BASE}/sign-up`);
    await page.getByLabel("Email address").fill(`audit-${Date.now()}@example.com`);
    await page.getByLabel("Password").fill("a-long-strong-passphrase-3!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByRole("button", { name: "I consent — start learning" }).click();
    await page.getByRole("button", { name: /Skip — start from scratch/ }).click({ timeout: 20_000 });
    await page.waitForURL(/dashboard/, { timeout: 20_000 });
    await page.close();
    // Disconnect the CDP client. A live Playwright session starves
    // Lighthouse's own connection to the same browser.
    await browser.close();
    console.log("Authenticated audit profile ready.\n");

    const rows: string[] = ["| Page | Accessibility | Performance |", "| --- | --- | --- |"];
    for (const t of TARGETS) {
      const out = `/tmp/lh-${t.page.replaceAll(/[^a-z]/gi, "-").toLowerCase()}.json`;
      execFileSync(
        "npx",
        [
          "-y",
          "lighthouse",
          t.url,
          `--port=${PORT}`,
          `--only-categories=${t.categories.join(",")}`,
          "--output=json",
          `--output-path=${out}`,
          "--quiet",
        ],
        { stdio: ["ignore", "ignore", "inherit"], timeout: 300_000 },
      );
      const report = JSON.parse(execFileSync("cat", [out]).toString()) as {
        categories: Record<string, { score: number | null }>;
      };
      const a11y = report.categories.accessibility
        ? Math.round((report.categories.accessibility.score ?? 0) * 100)
        : null;
      const perf = report.categories.performance
        ? Math.round((report.categories.performance.score ?? 0) * 100)
        : null;
      rows.push(`| ${t.page} | ${a11y ?? "—"} | ${perf ?? "—"} |`);
      console.log(`${t.page}: a11y=${a11y ?? "—"} perf=${perf ?? "—"}`);
    }

    console.log("\n" + rows.join("\n"));
  } finally {
    chrome?.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
