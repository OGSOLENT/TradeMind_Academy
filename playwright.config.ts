import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  // Figure capture isn't a test; it rewrites the report's screenshots, so it
  // only runs when asked (npm run figures:capture).
  testIgnore: process.env.CAPTURE_FIGURES === "1" ? [] : ["**/report-screens.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // CI also writes JSON, which the workflow checks so a skipped journey
  // fails the build instead of passing silently.
  reporter: process.env.CI
    ? [["github"], ["json", { outputFile: "test-results/results.json" }]]
    : "list",
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
    // sign-ups into the real research database, which happened once. In CI
    // the workflow builds the app with the emulator's demo configuration
    // and runs the suite inside `firebase emulators:exec`, so every journey
    // runs there too.
    command: process.env.CI ? "npx next start -p 3100" : "npm run dev:emulator",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
