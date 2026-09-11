/**
 * A production build and server pointed at the emulator, for the Lighthouse
 * audit: `node scripts/prod-emulator.mjs build` then `... start`. It builds
 * into .next-emulator and serves on 3100, so it can't collide with the real
 * app or send audit sign-ups into the live database.
 */
import { spawn } from "node:child_process";
import { loadEnv } from "./env.mjs";

const mode = process.argv[2];
if (mode !== "build" && mode !== "start") {
  console.error("usage: node scripts/prod-emulator.mjs build|start");
  process.exit(2);
}
loadEnv(".env.development.local");
process.env.NEXT_DIST_DIR = ".next-emulator";
const args = mode === "build" ? ["next", "build"] : ["next", "start", "-p", "3100"];
const child = spawn("npx", args, { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
