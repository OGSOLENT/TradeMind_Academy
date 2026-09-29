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
