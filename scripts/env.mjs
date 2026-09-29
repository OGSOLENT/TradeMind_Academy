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
