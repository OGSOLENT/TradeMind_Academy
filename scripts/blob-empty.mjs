/**
 * Deletes everything in the Vercel Blob store.
 *
 *   node scripts/blob-empty.mjs          list what's there, delete nothing
 *   node scripts/blob-empty.mjs --yes    actually delete it
 *
 * The store held the lesson recordings until 22 September 2026, when it
 * went over the Hobby plan's 1 GB free allowance and Vercel suspended it,
 * which 403'd every video on the live site. The recordings are served from
 * the app now (public/videos-web), so the store is dead weight sitting over
 * an allowance, and emptying it puts the account back under.
 *
 * Why not `vercel blob empty-store`? The CLI reads .env.local, finds
 * VERCEL_OIDC_TOKEN set and BLOB_STORE_ID unset, and refuses before it ever
 * looks at the read-write token. Run from the parent folder it fails
 * differently, because there's no linked project there. The REST API takes
 * the read-write token straight, and deletes work even on a suspended
 * store, which is the one operation that does.
 *
 * Nothing here is recoverable from Vercel afterwards, but everything in the
 * store is reproducible: the originals are in ~/Documents/DIssertation/Lessons
 * and `npm run videos:compress` rebuilds the web copies.
 */
import { readFileSync } from "node:fs";

const go = process.argv.includes("--yes");

function token() {
  const env = readFileSync(".env.local", "utf8");
  const m = /^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m.exec(env);
  if (!m) throw new Error("BLOB_READ_WRITE_TOKEN missing from .env.local");
  return m[1];
}

async function listAll(t) {
  const blobs = [];
  let cursor;
  do {
    const url = new URL("https://blob.vercel-storage.com");
    url.searchParams.set("limit", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, { headers: { authorization: `Bearer ${t}` } });
    if (!res.ok) throw new Error(`list: HTTP ${res.status} ${await res.text()}`);
    const json = await res.json();
    blobs.push(...(json.blobs ?? []));
    cursor = json.hasMore ? json.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function main() {
  const t = token();
  const blobs = await listAll(t);
  const bytes = blobs.reduce((a, b) => a + (b.size ?? 0), 0);
  console.log(`${blobs.length} blobs, ${(bytes / 1e9).toFixed(2)} GB`);
  if (blobs.length === 0) return console.log("Nothing to do.");

  if (!go) {
    for (const b of blobs.slice(0, 5)) console.log(`  ${b.pathname}`);
    if (blobs.length > 5) console.log(`  ... and ${blobs.length - 5} more`);
    console.log("\nDry run. Re-run with --yes to delete all of it.");
    return;
  }

  // The delete endpoint takes a batch of URLs; keep the batches modest so a
  // failure is easy to attribute and rerunning is cheap.
  let done = 0;
  for (let i = 0; i < blobs.length; i += 100) {
    const batch = blobs.slice(i, i + 100).map((b) => b.url);
    const res = await fetch("https://blob.vercel-storage.com/delete", {
      method: "POST",
      headers: {
        authorization: `Bearer ${t}`,
        "x-api-version": "7",
        "content-type": "application/json",
      },
      body: JSON.stringify({ urls: batch }),
    });
    if (!res.ok) throw new Error(`delete: HTTP ${res.status} ${await res.text()}`);
    done += batch.length;
    console.log(`  deleted ${done}/${blobs.length}`);
  }

  const left = await listAll(t);
  console.log(`\nDone. ${left.length} blobs left.`);
  console.log("The store itself still exists and is empty. Remove it entirely from");
  console.log("the dashboard if you want it gone: Vercel > Storage > tmacademy-lessons.");
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
