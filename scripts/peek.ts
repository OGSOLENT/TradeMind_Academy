/**
 * A terminal view of the database, for when the console is a hassle.
 * Read-only: counts per collection, the learners, and their recent sessions.
 *
 *   npm run db:peek          production (needs serviceAccountKey.json)
 *   npm run db:peek:local    the emulator
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const live = process.argv.includes("--live");
if (!live && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "localhost:9099";
}
const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "demo-trademind" });
const db = getFirestore(app);

const when = (t: unknown) =>
  t && typeof (t as { toDate?: unknown }).toDate === "function"
    ? (t as { toDate(): Date }).toDate().toISOString().slice(0, 16).replace("T", " ")
    : "–";

async function main() {
  console.log(`Database: ${live ? "PRODUCTION (trademind-academy)" : "emulator (localhost:8080)"}\n`);

  for (const name of ["courses", "kcs", "lessons", "items", "users"]) {
    const n = (await db.collection(name).count().get()).data().count;
    console.log(`${name.padEnd(9)} ${n}`);
  }

  const emails = new Map<string, string>();
  const auth = getAuth(app);
  let token: string | undefined;
  do {
    const page = await auth.listUsers(1000, token);
    for (const u of page.users) emails.set(u.uid, u.email ?? "(no email)");
    token = page.pageToken;
  } while (token);

  const users = await db.collection("users").get();
  console.log(`\nLearners (${users.size}):`);
  for (const u of users.docs) {
    const d = u.data();
    const sessions = await db.collection(`users/${u.id}/sessions`).orderBy("startedAt", "desc").limit(5).get();
    let responses = 0;
    for (const s of (await db.collection(`users/${u.id}/sessions`).get()).docs) {
      responses += (await db.collection(`users/${u.id}/sessions/${s.id}/responses`).count().get()).data().count;
    }
    const mastery = await db.doc(`users/${u.id}/mastery/trading-foundations`).get();
    const kcs = (mastery.data()?.kcs ?? {}) as Record<string, { pL?: number }>;
    const mastered = Object.values(kcs).filter((k) => (k.pL ?? 0) >= 0.8).length;
    const survey = await db.doc(`users/${u.id}/surveys/sus`).get();
    console.log(
      `\n  ${emails.get(u.id) ?? "?"}  uid ${u.id}\n` +
        `    signed up ${when(d.createdAt)} · consent ${d.consent ? "yes" : "no"} · 18+ ${d.isAdult ? "yes" : "no"}` +
        ` · ${responses} responses · ${mastered}/16 mastered · SUS ${survey.exists ? survey.data()?.score : "–"}`,
    );
    for (const s of sessions.docs) {
      const sd = s.data();
      const score = sd.score ? ` ${sd.score.correct}/${sd.score.total}` : "";
      console.log(`    ${when(sd.startedAt)}  ${String(sd.type).padEnd(12)} ${sd.endedAt ? "done" : "open"}${score}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
