/**
 * Load one of the .env files into process.env before Next starts.
 *
 * Next never overwrites a variable that's already set, so whatever I load
 * here wins over whichever .env.*.local Next would pick on its own. That's
 * the whole trick that lets `npm run dev` talk to the live project even
 * though `next dev` would normally read .env.development.local.
 */
import { readFileSync } from "node:fs";

export function loadEnv(file) {
  let loaded = 0;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    loaded++;
  }
  return loaded;
}
