import { createReadStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const VIDEO_DIR = "public/videos";
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
