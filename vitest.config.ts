import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      // The floor for lib/ as a whole, and much higher bars for the modules
      // the dissertation's claims rest on. CI fails if any of them slips.
      // The Firebase adapters and React hooks are left to the emulator
      // integration tests and the browser tests, which is why the overall
      // floor sits below the engine's.
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 65,
        statements: 70,
        // Guardrail 7.3: the BKT maths has to hold 100% unit coverage.
        "lib/bkt/**": { lines: 100, functions: 100, statements: 100, branches: 90 },
        "lib/mastery/**": { lines: 100, functions: 100, statements: 100, branches: 85 },
        "lib/quiz/**": { lines: 100, functions: 100, statements: 100, branches: 80 },
        "lib/routing/**": { lines: 90, functions: 85, statements: 90, branches: 85 },
        "lib/assessment.ts": { lines: 100, functions: 100, statements: 100, branches: 100 },
        "lib/content/debias.ts": { lines: 95, statements: 95, branches: 85 },
        "lib/firebase/schemas.ts": { lines: 100, functions: 100, statements: 100, branches: 85 },
      },
    },
  },
});
