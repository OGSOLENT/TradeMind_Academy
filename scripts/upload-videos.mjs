/**
 * Uploads the lesson recordings to the project's Vercel Blob store and
 * writes content/video-urls.json, which the content generator reads to
 * turn `Video: File.mp4` into the hosted URL.
 *
 *   node scripts/upload-videos.mjs            upload what's missing
 *   node scripts/upload-videos.mjs --force    re-upload everything
 *
 * Needs BLOB_READ_WRITE_TOKEN in .env.local (npx vercel@latest env pull
 * writes it after `vercel blob create-store`). The store is public, so the
 * URLs are plain https links the <video> element can play, and Vercel's
 * CDN caches each file (they're all under the 512 MB cache limit). The
 * Hobby plan includes 5 GB of storage and 100 GB of transfer a month, which
 * covers 1.1 GB of recordings and a few thousand plays.
 *
 * Existing blobs are listed first so a re-run only uploads what's new; the
 * files are ~30 MB each and this machine's uplink is not fast.
 */
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const VIDEO_DIR = "public/videos"; // a symlink to ~/Documents/DIssertation/Lessons
const OUT = "content/video-urls.json";
const force = process.argv.includes("--force");

function token() {
  const env = readFileSync(".env.local", "utf8");
  const m = /^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m.exec(env);
  if (!m) throw new Error("BLOB_READ_WRITE_TOKEN missing from .env.local");
  return m[1];
}

async function listExisting(t) {
  const out = new Map();
  let cursor;
  do {
    const url = new URL("https://blob.vercel-storage.com");
    url.searchParams.set("prefix", "videos/");
    url.searchParams.set("limit", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, { headers: { authorization: `Bearer ${t}` } });
    if (!res.ok) throw new Error(`list: HTTP ${res.status} ${await res.text()}`);
    const json = await res.json();
    for (const b of json.blobs ?? []) out.set(b.pathname, b.url);
    cursor = json.hasMore ? json.cursor : undefined;
  } while (cursor);
  return out;
}

async function upload(t, file, pathname) {
  const size = statSync(file).size;
  const res = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${t}`,
      "x-api-version": "7",
      "x-content-type": "video/mp4",
      "x-add-random-suffix": "0",
      "x-allow-overwrite": "1",
      "x-cache-control-max-age": String(60 * 60 * 24 * 365),
    },
    body: createReadStream(file),
    duplex: "half",
  });
  if (!res.ok) throw new Error(`${pathname}: HTTP ${res.status} ${await res.text()}`);
  const json = await res.json();
  return { url: json.url, size };
}

async function main() {
  const t = token();
  const files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".mp4")).sort();
  const existing = await listExisting(t);
  const map = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  let uploaded = 0;
  let bytes = 0;
  for (const f of files) {
    const pathname = `videos/${f}`;
    if (!force && existing.has(pathname)) {
      map[f] = existing.get(pathname);
      console.log(`  kept     ${f}`);
      continue;
    }
    const started = Date.now();
    const { url, size } = await upload(t, join(VIDEO_DIR, f), pathname);
    map[f] = url;
    uploaded++;
    bytes += size;
    writeFileSync(OUT, JSON.stringify(map, null, 2) + "\n");
    console.log(`  uploaded ${f} (${(size / 1e6).toFixed(1)} MB in ${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  writeFileSync(OUT, JSON.stringify(map, null, 2) + "\n");
  console.log(`\n${files.length} recordings, ${uploaded} uploaded (${(bytes / 1e6).toFixed(0)} MB) → ${OUT}`);
  // A quick check that the first one streams.
  const first = Object.values(map)[0];
  if (first) {
    const head = execFileSync("curl", ["-sI", first]).toString();
    console.log(head.split("\n").filter((l) => /^(HTTP|content-type|content-length)/i.test(l)).join(" | "));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
