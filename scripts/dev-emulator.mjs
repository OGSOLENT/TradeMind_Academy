/**
 * `npm run dev:emulator`: the app against the local Firebase Emulator
 * Suite, on port 3100, building into its own .next-emulator folder so it can
 * run beside the real app without the two corrupting each other.
 *
 * Nothing here touches the cloud. Google sign-in shows the emulator's plain
 * "Sign-in with Google.com" page, which is the emulator doing its job. The
 * e2e suite runs against this server, and it's the one to use for
 * throwaway accounts. Needs `npm run emulators` and `npm run seed` first.
 */
import { spawn } from "node:child_process";
import { guard } from "./port-guard.mjs";
import { loadEnv } from "./env.mjs";

const port = 3100;
await guard(port, "dev:emulator");
loadEnv(".env.development.local");
process.env.NEXT_DIST_DIR = ".next-emulator";
console.log(`\n  ○  EMULATOR (demo project, nothing real). Open http://localhost:${port}\n`);
const child = spawn("npx", ["next", "dev", "-p", String(port)], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
