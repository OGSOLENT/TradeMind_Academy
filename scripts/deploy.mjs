/**
 * Deploy to Vercel from a snapshot of the working tree.
 *
 *   npm run deploy            production
 *   npm run deploy:preview    a preview URL
 *
 * Why not plain `vercel --prod`? The CLI attaches the HEAD commit's author
 * to the deployment, and a Hobby account refuses to build anything whose
 * author email isn't the account's own (readyStateReason: "the commit
 * author doesn't have permission to create deployments"). My commits are
 * signed with a different address from the Vercel login, so every direct
 * deploy sat BLOCKED forever. Copying the source into a temporary folder
 * without .git means there's no author to check, and the deployment is
 * attributed to the logged-in account instead.
 *
 * The copy honours .vercelignore plus the obvious big folders, and the
 * project link (.vercel/project.json) comes along so it lands in the right
 * Vercel project.
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const prod = !process.argv.includes("--preview");
const root = process.cwd();

if (!existsSync(join(root, ".vercel/project.json"))) {
  console.error("Not linked yet. Run: npx vercel@latest login && npx vercel@latest link --yes --project trademind-academy");
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
// The link file is gitignored and .vercelignore'd for the upload, but the
// snapshot needs it so the CLI knows which project to deploy to.
cpSync(join(root, ".vercel/project.json"), join(snapshot, ".vercel/project.json"));

console.log(`Deploying ${prod ? "to production" : "a preview"} from ${snapshot}`);
const args = ["--yes", "vercel@latest", "deploy", "--yes"];
if (prod) args.push("--prod");
const result = spawnSync("npx", args, { cwd: snapshot, stdio: "inherit", env: process.env });
rmSync(snapshot, { recursive: true, force: true });
process.exit(result.status ?? 1);
