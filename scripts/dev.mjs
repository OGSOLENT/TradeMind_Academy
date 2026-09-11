/**
 * `npm run dev`: THE app. Live Firebase project, real Google sign-in, real
 * database, hot reload, on port 3000 and nowhere else.
 *
 * It loads .env.production.local before Next reads its own env files, so
 * the client connects to trademind-academy instead of the emulator. Every
 * account created here is real. The emulator has its own script now
 * (`npm run dev:emulator`, port 3100) and only the test suite uses it, so
 * there's no longer a second "3000" that looks the same and behaves
 * differently.
 *
 * It refuses to start if 3000 is busy, because two dev servers sharing one
 * .next folder is how the build got corrupted three times in a day.
 */
import { spawn } from "node:child_process";
import { guard } from "./port-guard.mjs";
import { loadEnv } from "./env.mjs";

const port = 3000;
await guard(port, "dev");
const loaded = loadEnv(".env.production.local");
console.log(
  `\n  ●  LIVE project "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}" (${loaded} vars from .env.production.local)` +
    `\n     Real Google sign-in. Real database. Open http://localhost:${port}\n`,
);
const child = spawn("npx", ["next", "dev", "-p", String(port)], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
