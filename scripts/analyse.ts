/**
 * The pilot analysis: every learner's placement, post-test, practice and
 * questionnaire, reduced to the numbers the evaluation chapter needs.
 *
 *   npm run analyse                   the emulator (localhost:8080)
 *   npm run analyse -- --include-test the emulator, keeping the E2E learners
 *   npm run analyse:live              production, read-only, needs serviceAccountKey.json
 *
 * Writes docs/report/PILOT_RESULTS.md. Learners are pseudonymised as P1,
 * P2, ... in order of sign-up; no uid, name or email leaves this script.
 * Test accounts (@example.com) are dropped. It never writes to Firestore.
 *
 * Per learner:
 *   pre        placement score, one item per KC (form A)
 *   post       first completed post-test score (form B)
 *   gain       Hake's normalised gain (post - pre) / (N - pre)
 *   practice   completed practice sessions and answered items
 *   time       time on task, as the sum of answer latencies (a floor:
 *              reading isn't in it), plus wall-clock session spans
 *   mastered   KCs at or above the 0.8 threshold in the model now
 *   SUS        the questionnaire score, 0 to 100
 * and the post-test as a held-out check of the model: each answer was
 * logged with the model's pL at the time, so accuracy on items the model
 * called mastered versus not is a calibration number the practice log
 * can't give (practice answers move the model; these don't).
 */
import { writeFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { MASTERY_THRESHOLD } from "../lib/bkt";
import { normalisedGain } from "../lib/assessment";

const live = process.argv.includes("--live");
/** Keep the @example.com accounts (the E2E learners), to see the tables filled on the emulator. */
const includeTest = process.argv.includes("--include-test");
if (!live && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "localhost:9099";
  console.log("FIRESTORE_EMULATOR_HOST not set — defaulting to localhost:8080 (emulator).");
}
const COURSE_ID = "trading-foundations";
const OUT = "docs/report/PILOT_RESULTS.md";

interface Row {
  id: string;
  signedUp: Date | null;
  consent: boolean;
  pre: { correct: number; total: number } | null;
  post: { correct: number; total: number } | null;
  gain: number | null;
  practiceSessions: number;
  practiceItems: number;
  practiceAccuracy: number | null;
  latencyMin: number;
  wallMin: number;
  mastered: number;
  sus: number | null;
  comments: Record<string, string> | null;
  /** Post-test answers against the model's estimate going in. */
  heldOut: { pL: number; correct: boolean }[];
}

function fmt(n: number | null | undefined, d = 2): string {
  return n === null || n === undefined || Number.isNaN(n) ? "–" : n.toFixed(d);
}
function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}
function sd(xs: number[]): number | null {
  const m = mean(xs);
  if (m === null || xs.length < 2) return null;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}
function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

async function scoreOf(
  db: Firestore,
  uid: string,
  sid: string,
  stored: { correct: number; total: number } | undefined,
): Promise<{ correct: number; total: number; answers: { pL: number; correct: boolean }[] }> {
  const rs = await db.collection(`users/${uid}/sessions/${sid}/responses`).get();
  const answers = rs.docs.map((d) => ({ pL: Number(d.data().pLBefore ?? 0), correct: !!d.data().correct }));
  if (stored) return { ...stored, answers };
  return { correct: answers.filter((a) => a.correct).length, total: answers.length, answers };
}

async function learner(db: Firestore, uid: string, data: FirebaseFirestore.DocumentData): Promise<Row> {
  const sessionsSnap = await db.collection(`users/${uid}/sessions`).orderBy("startedAt").get();
  type Session = { id: string } & Record<string, unknown>;
  const sessions: Session[] = sessionsSnap.docs.map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }));
  const ended = (s: Session) => s.endedAt != null;
  const ms = (t: unknown) => (t && typeof (t as { toMillis?: unknown }).toMillis === "function" ? (t as { toMillis(): number }).toMillis() : null);

  const placement = sessions.find((s) => s.type === "placement" && ended(s));
  const postTest = sessions.find((s) => s.type === "post-test" && ended(s));
  const practice = sessions.filter((s) => ended(s) && s.type !== "placement" && s.type !== "post-test");

  const pre = placement ? await scoreOf(db, uid, placement.id, placement.score as { correct: number; total: number } | undefined) : null;
  const post = postTest ? await scoreOf(db, uid, postTest.id, postTest.score as { correct: number; total: number } | undefined) : null;

  let practiceItems = 0;
  let practiceCorrect = 0;
  let latencyMs = 0;
  let wallMs = 0;
  for (const s of practice) {
    const rs = await db.collection(`users/${uid}/sessions/${s.id}/responses`).get();
    practiceItems += rs.size;
    for (const r of rs.docs) {
      if (r.data().correct) practiceCorrect++;
      latencyMs += Number(r.data().latencyMs ?? 0);
    }
    const a = ms(s.startedAt);
    const b = ms(s.endedAt);
    if (a !== null && b !== null && b > a) wallMs += Math.min(b - a, 2 * 60 * 60 * 1000);
  }
  for (const s of [placement, postTest]) {
    if (!s) continue;
    const rs = await db.collection(`users/${uid}/sessions/${s.id}/responses`).get();
    for (const r of rs.docs) latencyMs += Number(r.data().latencyMs ?? 0);
  }

  const masterySnap = await db.doc(`users/${uid}/mastery/${COURSE_ID}`).get();
  const kcs = (masterySnap.data()?.kcs ?? {}) as Record<string, { pL?: number }>;
  const mastered = Object.values(kcs).filter((k) => (k.pL ?? 0) >= MASTERY_THRESHOLD).length;

  const surveySnap = await db.doc(`users/${uid}/surveys/sus`).get();
  const survey = surveySnap.exists ? surveySnap.data() : null;

  return {
    id: uid,
    signedUp: ms(data.createdAt) !== null ? new Date(ms(data.createdAt)!) : null,
    consent: data.consent != null && data.consent !== false,
    pre: pre ? { correct: pre.correct, total: pre.total } : null,
    post: post ? { correct: post.correct, total: post.total } : null,
    gain: pre && post ? normalisedGain(pre.correct, post.correct, post.total) : null,
    practiceSessions: practice.length,
    practiceItems,
    practiceAccuracy: practiceItems ? practiceCorrect / practiceItems : null,
    latencyMin: latencyMs / 60000,
    wallMin: wallMs / 60000,
    mastered,
    sus: survey && typeof survey.score === "number" ? survey.score : null,
    comments: survey?.comments ?? null,
    heldOut: post?.answers ?? [],
  };
}

async function main() {
  const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "demo-trademind" });
  const db = getFirestore(app);
  // Emails live in Auth, not in the profile document; they're only used
  // here to drop the test accounts and never written anywhere.
  const emails = new Map<string, string>();
  let pageToken: string | undefined;
  do {
    const page = await getAuth(app).listUsers(1000, pageToken);
    for (const u of page.users) emails.set(u.uid, u.email ?? "");
    pageToken = page.pageToken;
  } while (pageToken);

  const usersSnap = await db.collection("users").get();
  const rows: Row[] = [];
  let dropped = 0;
  for (const u of usersSnap.docs) {
    if (!includeTest && (emails.get(u.id) ?? "").endsWith("@example.com")) {
      dropped++;
      continue;
    }
    rows.push(await learner(db, u.id, u.data()));
  }
  if (dropped) console.log(`Dropped ${dropped} test account${dropped === 1 ? "" : "s"} (@example.com).`);
  rows.sort((a, b) => (a.signedUp?.getTime() ?? 0) - (b.signedUp?.getTime() ?? 0));
  const label = new Map(rows.map((r, i) => [r.id, `P${i + 1}`]));

  const withBoth = rows.filter((r) => r.pre && r.post);
  const gains = withBoth.map((r) => r.gain).filter((g): g is number => g !== null);
  const sus = rows.map((r) => r.sus).filter((s): s is number => s !== null);
  const active = rows.filter((r) => r.practiceSessions > 0);

  const heldOut = rows.flatMap((r) => r.heldOut);
  const called = heldOut.filter((h) => h.pL >= MASTERY_THRESHOLD);
  const notCalled = heldOut.filter((h) => h.pL < MASTERY_THRESHOLD);
  const acc = (xs: { correct: boolean }[]) => (xs.length ? xs.filter((x) => x.correct).length / xs.length : null);

  const lines: string[] = [];
  lines.push(`# Pilot results`);
  lines.push("");
  lines.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/analyse.ts\` from ${live ? "the production database (read-only)" : "the emulator"}. Learners are pseudonymised in sign-up order; test accounts are excluded. n = ${rows.length}.`);
  lines.push("");
  if (rows.length === 0) {
    lines.push("No learner accounts yet. The tables below fill in when the pilot runs.");
    lines.push("");
  }

  lines.push(`## Per learner`);
  lines.push("");
  lines.push(`| Learner | Consent | Placement | Post-test | Normalised gain | Practice sessions | Items answered | Practice accuracy | Time on task (answers, min) | Session wall-clock (min) | KCs mastered (of 16) | SUS |`);
  lines.push(`| --- | :---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |`);
  for (const r of rows) {
    lines.push(
      `| ${label.get(r.id)} | ${r.consent ? "yes" : "no"} | ${r.pre ? `${r.pre.correct}/${r.pre.total}` : "skipped"} | ${r.post ? `${r.post.correct}/${r.post.total}` : "–"} | ${fmt(r.gain)} | ${r.practiceSessions} | ${r.practiceItems} | ${r.practiceAccuracy === null ? "–" : `${(r.practiceAccuracy * 100).toFixed(0)}%`} | ${fmt(r.latencyMin, 1)} | ${fmt(r.wallMin, 1)} | ${r.mastered} | ${r.sus === null ? "–" : r.sus.toFixed(1)} |`,
    );
  }
  lines.push("");

  lines.push(`## Summary`);
  lines.push("");
  lines.push(`| Measure | Value |`);
  lines.push(`| --- | ---: |`);
  lines.push(`| Learners signed up | ${rows.length} |`);
  lines.push(`| Learners with at least one practice session | ${active.length} |`);
  lines.push(`| Learners with placement and post-test | ${withBoth.length} |`);
  lines.push(`| Mean placement score | ${withBoth.length ? fmt(mean(withBoth.map((r) => r.pre!.correct))) + ` / ${withBoth[0]!.pre!.total}` : "–"} |`);
  lines.push(`| Mean post-test score | ${withBoth.length ? fmt(mean(withBoth.map((r) => r.post!.correct))) + ` / ${withBoth[0]!.post!.total}` : "–"} |`);
  lines.push(`| Mean normalised gain (sd) | ${fmt(mean(gains))} (${fmt(sd(gains))}) |`);
  lines.push(`| Median normalised gain | ${fmt(median(gains))} |`);
  lines.push(`| Learners with positive gain | ${gains.length ? `${gains.filter((g) => g > 0).length} of ${gains.length}` : "–"} |`);
  lines.push(`| Mean practice sessions per active learner | ${fmt(mean(active.map((r) => r.practiceSessions)), 1)} |`);
  lines.push(`| Mean items answered per active learner | ${fmt(mean(active.map((r) => r.practiceItems)), 1)} |`);
  lines.push(`| Mean time on task per active learner (min) | ${fmt(mean(active.map((r) => r.latencyMin)), 1)} |`);
  lines.push(`| Mean KCs mastered per active learner | ${fmt(mean(active.map((r) => r.mastered)), 1)} |`);
  lines.push(`| SUS responses | ${sus.length} |`);
  lines.push(`| Mean SUS (sd) | ${fmt(mean(sus), 1)} (${fmt(sd(sus), 1)}) |`);
  lines.push("");
  lines.push(`Hake (1998) reads normalised gain as low below 0.3, medium from 0.3 to 0.7 and high above 0.7. Bangor, Kortum and Miller (2008) put the SUS average at 68; above 80 is the top decile.`);
  lines.push("");

  lines.push(`## The post-test as a held-out check of the model`);
  lines.push("");
  lines.push(`Each post-test answer was logged with the model's estimate for that module at the time. Practice answers can't give this number cleanly because they move the estimate; post-test answers don't.`);
  lines.push("");
  lines.push(`| Model said | Post-test items | Answered correctly |`);
  lines.push(`| --- | ---: | ---: |`);
  lines.push(`| Mastered (pL ≥ ${MASTERY_THRESHOLD}) | ${called.length} | ${acc(called) === null ? "–" : `${(acc(called)! * 100).toFixed(0)}%`} |`);
  lines.push(`| Not yet mastered | ${notCalled.length} | ${acc(notCalled) === null ? "–" : `${(acc(notCalled)! * 100).toFixed(0)}%`} |`);
  lines.push(`| All | ${heldOut.length} | ${acc(heldOut) === null ? "–" : `${(acc(heldOut)! * 100).toFixed(0)}%`} |`);
  lines.push("");

  const comments = rows.filter((r) => r.comments && Object.values(r.comments).some((c) => c && c.trim()));
  lines.push(`## Open answers`);
  lines.push("");
  if (!comments.length) lines.push("None yet.");
  for (const r of comments) {
    lines.push(`**${label.get(r.id)}**`);
    for (const [k, v] of Object.entries(r.comments!)) {
      if (v && v.trim()) lines.push(`- *${k}*: ${v.trim().replace(/\s+/g, " ")}`);
    }
    lines.push("");
  }
  lines.push("");
  lines.push(`## Caveats`);
  lines.push("");
  lines.push(`- Placement (form A) and post-test (form B) use different items for every module except Liquidity, which has one pretest-eligible item, so that module is a repeat.`);
  lines.push(`- Time on task from answer latencies excludes reading lessons and watching recordings; it's a floor. Session wall-clock includes them but is capped at two hours per session to stop an abandoned tab counting.`);
  lines.push(`- There's no control group. Gains are pre/post on one group and can't separate the routing from the content. The routing question is addressed by simulation in EVALUATION.md.`);
  lines.push(`- Only the first completed post-test per learner counts.`);
  lines.push("");

  writeFileSync(OUT, lines.join("\n"));
  console.log(lines.slice(0, 40).join("\n"));
  console.log(`\nWritten to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
