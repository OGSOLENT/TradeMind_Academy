/**
 * The research-dataset export. Responses go out as a tidy CSV, one row per
 * response, with columns matching the schema in section 4, ready for the
 * Python evaluation notebook. It's an admin tool and it targets the emulator
 * unless you pass --allow-prod.
 *
 * Usage:
 *   npx tsx scripts/export.ts                 # every user, to export/responses.csv
 *   npx tsx scripts/export.ts --uid <uid>     # one user
 *   npx tsx scripts/export.ts --out my.csv
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const allowProd = process.argv.includes("--allow-prod");
if (!process.env.FIRESTORE_EMULATOR_HOST && !allowProd) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
}

const uidArg = process.argv.indexOf("--uid");
const onlyUid = uidArg > -1 ? process.argv[uidArg + 1] : null;
const outArg = process.argv.indexOf("--out");
const outPath = outArg > -1 ? process.argv[outArg + 1]! : "export/responses.csv";

const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "demo-trademind" });
const db = getFirestore(app);

const COLUMNS = [
  "uid",
  "sessionId",
  "sessionType",
  "responseId",
  "itemId",
  "kcId",
  "questionType",
  "correct",
  "selected",
  "latencyMs",
  "pLBefore",
  "pLAfter",
  "ts",
] as const;

function csvEscape(value: unknown): string {
  const s = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

async function main() {
  const usersSnap = onlyUid
    ? { docs: [await db.doc(`users/${onlyUid}`).get()] }
    : await db.collection("users").get();

  const rows: string[] = [COLUMNS.join(",")];
  let count = 0;

  for (const userDoc of usersSnap.docs) {
    if (!userDoc.exists) continue;
    const uid = userDoc.id;
    const sessions = await db.collection(`users/${uid}/sessions`).get();
    for (const session of sessions.docs) {
      const sessionType = (session.data().type as string) ?? "";
      const responses = await db
        .collection(`users/${uid}/sessions/${session.id}/responses`)
        .orderBy("ts")
        .get();
      for (const r of responses.docs) {
        const d = r.data();
        rows.push(
          [
            uid,
            session.id,
            sessionType,
            r.id,
            d.itemId,
            d.kcId,
            d.questionType,
            d.correct,
            d.selected,
            d.latencyMs,
            d.pLBefore,
            d.pLAfter,
            d.ts,
          ]
            .map(csvEscape)
            .join(","),
        );
        count++;
      }
    }
  }

  mkdirSync(outPath.includes("/") ? outPath.slice(0, outPath.lastIndexOf("/")) : ".", {
    recursive: true,
  });
  writeFileSync(outPath, rows.join("\n") + "\n");
  console.log(`Exported ${count} responses → ${outPath}`);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
