import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SRC = "public/videos";
const OUT = "public/videos-web";
const CRF = 28;
const force = process.argv.includes("--force");

function duration(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]).toString().trim();
  return Number(out) || 0;
}

function main() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    console.error("ffmpeg not found. Install it with:  brew install ffmpeg");
    process.exit(1);
  }
  if (!existsSync(SRC)) {
    console.error(`${SRC} is missing. It's a symlink to the Lessons folder.`);
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });

  const files = readdirSync(SRC).filter((f) => f.endsWith(".mp4")).sort();
  let before = 0;
  let after = 0;
  let done = 0;

  for (const f of files) {
    const src = join(SRC, f);
    const out = join(OUT, f);
    const srcSize = statSync(src).size;
    before += srcSize;

    if (!force && existsSync(out)) {
      const ok = Math.abs(duration(out) - duration(src)) < 1;
      if (ok) {
        after += statSync(out).size;
        console.log(`  kept     ${f}`);
        continue;
      }
      console.log(`  redo     ${f} (previous encode was incomplete)`);
    }

    const started = Date.now();
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-i", src,
      // Constant quality, not constant bitrate: still slides cost nothing.
      "-c:v", "libx264", "-crf", String(CRF), "-preset", "slow",
      // Baseline-friendly output so it plays everywhere, iOS included.
      "-profile:v", "high", "-pix_fmt", "yuv420p",
      // The source audio is 96 kbps mono speech; 64 kbps AAC is transparent for that.
      "-c:a", "aac", "-b:a", "64k", "-ac", "1",
      "-movflags", "+faststart",
      out,
    ], { stdio: ["ignore", "ignore", "inherit"] });

    const outSize = statSync(out).size;
    after += outSize;
    done++;
    console.log(
      `  encoded  ${f} (${(srcSize / 1e6).toFixed(1)} → ${(outSize / 1e6).toFixed(1)} MB, ` +
        `${((Date.now() - started) / 1000).toFixed(0)}s)`,
    );
  }

  console.log(
    `\n${files.length} recordings, ${done} encoded. ` +
      `${(before / 1e9).toFixed(2)} GB → ${(after / 1e9).toFixed(2)} GB ` +
      `(${(before / after).toFixed(1)}x smaller) → ${OUT}`,
  );
}

main();
