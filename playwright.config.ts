import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
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
    // The suite ALWAYS runs against the emulator server on 3100. `npm run
    // dev` is the real app now, and auto-starting that here would route E2E
    // sign-ups into the real research database, which happened once. CI has
    // no env files, so the prod-style build there runs without Firebase and
    // the Firebase specs skip themselves.
    command: process.env.CI ? "npm run build && npx next start -p 3100" : "npm run dev:emulator",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
