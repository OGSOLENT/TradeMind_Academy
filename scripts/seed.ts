/**
 * Seed the Level-1 curriculum into Firestore. It targets the EMULATOR by
 * default (FIRESTORE_EMULATOR_HOST) and refuses to touch production unless
 * you pass --allow-prod explicitly. That's there to protect the research
 * dataset from me.
 *
 * Run it with the emulator up:  npm run seed
 */
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Level1Content } from "../lib/content/types";

const allowProd = process.argv.includes("--allow-prod");
if (!process.env.FIRESTORE_EMULATOR_HOST && !allowProd) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  console.log("FIRESTORE_EMULATOR_HOST not set — defaulting to localhost:8080 (emulator).");
}

const content: Level1Content = JSON.parse(readFileSync("content/level1.json", "utf8"));

const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "demo-trademind" });
const db = getFirestore(app);

async function main() {
  const batch = db.batch();

  const { course, kcs, lessons, items } = content;
  batch.set(db.doc(`courses/${course.id}`), { title: course.title, levels: course.levels });

  for (const kc of kcs) {
    const { id, ...data } = kc;
    batch.set(db.doc(`kcs/${id}`), data);
  }
  for (const lesson of lessons) {
    const { id, ...data } = lesson;
    batch.set(db.doc(`lessons/${id}`), data);
  }
  for (const item of items) {
    const { id, ...data } = item;
    batch.set(db.doc(`items/${id}`), data);
  }

  await batch.commit();
  console.log(
    `Seeded: 1 course, ${kcs.length} KCs, ${lessons.length} lessons, ${items.length} items → project ${app.options.projectId}`,
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
