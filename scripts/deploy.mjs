import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const prod = !process.argv.includes("--preview");
const root = process.cwd();

if (!existsSync(join(root, ".vercel/project.json"))) {
  console.error("Not linked yet. Run: npx vercel@latest login && npx vercel@latest link --yes --project tmacademyuk");
  process.exit(2);
}

// Everything .vercelignore lists, read as simple root-anchored names.
const ignored = new Set(
  readFileSync(join(root, ".vercelignore"), "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("!"))
    .map((l) => l.replace(/^\//, "").replace(/\/$/, "")),
);
for (const always of [".git", "node_modules", ".next", ".next-emulator", ".next-audit", ".next-live", "public/videos"]) {
  ignored.add(always);
}

const snapshot = mkdtempSync(join(tmpdir(), "trademind-deploy-"));
cpSync(root, snapshot, {
  recursive: true,
  dereference: false,
  filter: (src) => {
    const rel = src.slice(root.length + 1);
    if (!rel) return true;
    if (ignored.has(rel)) return false;
    // Wildcards in .vercelignore are only ever prefix.* or *.ext here.
    for (const pat of ignored) {
      if (pat.endsWith("*") && rel.startsWith(pat.slice(0, -1))) return false;
      if (pat.startsWith("*") && rel.endsWith(pat.slice(1))) return false;
    }
    return true;
  },
});
cpSync(join(root, ".vercel/project.json"), join(snapshot, ".vercel/project.json"));

console.log(`Deploying ${prod ? "to production" : "a preview"} from ${snapshot}`);
const args = ["--yes", "vercel@latest", "deploy", "--yes"];
if (prod) args.push("--prod");
if (process.argv.includes("--debug")) args.push("--debug");
const result = spawnSync("npx", args, { cwd: snapshot, stdio: "inherit", env: process.env });
rmSync(snapshot, { recursive: true, force: true });
process.exit(result.status ?? 1);
