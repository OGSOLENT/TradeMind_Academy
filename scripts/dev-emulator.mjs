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
