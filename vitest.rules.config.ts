import { defineConfig } from "vitest/config";
import path from "node:path";

/** Rules tests run in node against the Firestore emulator (npm run test:rules). */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
