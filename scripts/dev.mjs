/**
 * `npm run dev`: the app against the local emulators, on port 3000 only.
 * Fails fast if 3000 is busy instead of hopping to 3001 or 3002, because a
 * second server sharing .next is how the dev build gets corrupted.
 */
import { spawn } from "node:child_process";
import { guard } from "./port-guard.mjs";

const port = 3000;
await guard(port, "dev");
const child = spawn("npx", ["next", "dev", "-p", String(port)], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
