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
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 65,
        statements: 70,
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
