import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Chromium-based mobile emulation. The mobile project checks layout, and
    // I avoid WebKit because its long-poll channel is flaky against the
    // Firestore emulator (docs/DECISIONS.md, 2026-07-15).
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Locally this is ALWAYS the dev server, because it reads
    // .env.development.local (the emulator config). The production build
    // reads .env.production.local (real Firebase), and auto-starting that
    // here once routed E2E traffic into the real research database. CI has no
    // env files, so the prod-style build there runs without Firebase and the
    // Firebase specs skip themselves.
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
