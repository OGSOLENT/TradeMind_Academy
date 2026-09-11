/**
 * A hot-reload dev server against the LIVE Firebase project.
 *
 *   npm run dev:live        (http://localhost:3001, real Google sign-in)
 *
 * `npm run dev` is pinned to the emulator on purpose, so test accounts can
 * never reach the research dataset. This script is the one sanctioned way
 * round that. It loads .env.production.local before Next reads its own env
 * files (Next never overwrites a variable that's already set), so the app
 * connects to trademind-academy while keeping hot reload. Anything you do
 * here lands in the real database, so the warning below is the only thing
 * standing between you and that.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { guard } from "./port-guard.mjs";

const port = process.env.PORT ?? "3001";
await guard(Number(port), "dev:live");

const envFile = ".env.production.local";
let loaded = 0;
for (const raw of readFileSync(envFile, "utf8").split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const eq = line.indexOf("=");
  if (eq < 0) continue;
  process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  loaded++;
}

const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
console.log(
  `\n  ⚠  dev:live → connected to LIVE project "${project}" (${loaded} vars from ${envFile})`,
);
console.log("     Every account you create here is real. Use npm run dev for throwaway testing.\n");

process.env.NEXT_DIST_DIR = ".next-live"; // its own build folder, see next.config.mjs
const child = spawn("npx", ["next", "dev", "-p", port], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
