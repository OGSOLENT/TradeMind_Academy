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
 *   mastered   KCs at or above the 0.8 threshold, rebuilt from the response
 *              log rather than read from the learner's mastery document,
 *              which the learner's own browser writes and could edit
 *   repaired   sessions whose model write failed and was restored from the
 *              log (lib/firebase/mastery.ts), so a lost write is visible
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
import { kindOf, rebuildMastery, type LoggedSession } from "../lib/mastery/ledger";
import { normalisedGain } from "../lib/assessment";

const live = process.argv.includes("--live");
/** Keep the @example.com accounts (the E2E learners), to see the tables filled on the emulator. */
const includeTest = process.argv.includes("--include-test");
if (!live && !process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "localhost:9099";
  console.log("FIRESTORE_EMULATOR_HOST not set — defaulting to localhost:8080 (emulator).");
}
/** The course's KC ids, read from the database the app used. */
let KC_IDS: string[] = [];
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
  repaired: number;
  sus: number | null;
  comments: Record<string, string> | null;
  /** Post-test answers against the model's estimate going in. */
  heldOut: { pL: number; correct: boolean }[];
  /** Practice answers in order per KC, for the learning-curve check. */
  curve: { kcId: string; opportunity: number; correct: boolean }[];
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
  const seen: Record<string, number> = {};
  const curve: { kcId: string; opportunity: number; correct: boolean }[] = [];
  let latencyMs = 0;
  let wallMs = 0;
  const logged: LoggedSession[] = [];
  for (const s of practice) {
    const rs = await db.collection(`users/${uid}/sessions/${s.id}/responses`).get();
    practiceItems += rs.size;
    // addDoc ids are random, so the documents come back in no useful order.
    // The learning curve and the rebuild both need the order of answering.
    const ordered = [...rs.docs].sort((x, y) => Number(x.data().ts ?? 0) - Number(y.data().ts ?? 0));
    logged.push({
      id: s.id,
      type: String(s.type),
      answers: ordered.map((r) => ({ kcId: String(r.data().kcId), correct: r.data().correct === true, ts: Number(r.data().ts ?? 0) })),
    });
    for (const r of ordered) {
      if (r.data().correct) practiceCorrect++;
      latencyMs += Number(r.data().latencyMs ?? 0);
      const kcId = String(r.data().kcId ?? "");
      if (kcId) {
        seen[kcId] = (seen[kcId] ?? 0) + 1;
        curve.push({ kcId, opportunity: seen[kcId]!, correct: !!r.data().correct });
      }
    }
    const a = ms(s.startedAt);
    const b = ms(s.endedAt);
    if (a !== null && b !== null && b > a) wallMs += Math.min(b - a, 2 * 60 * 60 * 1000);
  }
  // Every placement counts toward the model (not only the first), in order.
  for (const s of sessions.filter((x) => ended(x) && kindOf(String(x.type)) === "placement")) {
    const rs = await db.collection(`users/${uid}/sessions/${s.id}/responses`).get();
    logged.push({
      id: s.id,
      type: "placement",
      answers: rs.docs.map((r) => ({ kcId: String(r.data().kcId), correct: r.data().correct === true, ts: Number(r.data().ts ?? 0) })),
    });
  }
  for (const s of [placement, postTest]) {
    if (!s) continue;
    const rs = await db.collection(`users/${uid}/sessions/${s.id}/responses`).get();
    for (const r of rs.docs) latencyMs += Number(r.data().latencyMs ?? 0);
  }

  // Mastery from the append-only log, never from the client-written cache.
  const rebuilt = rebuildMastery(KC_IDS, logged);
  const mastered = Object.values(rebuilt.kcs).filter((k) => k.pL >= MASTERY_THRESHOLD).length;
  const repaired = sessions.filter((x) => x.repairedAt != null).length;

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
    repaired,
    sus: survey && typeof survey.score === "number" ? survey.score : null,
    comments: survey?.comments ?? null,
    heldOut: post?.answers ?? [],
    curve,
  };
}

async function main() {
  const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "demo-trademind" });
  const db = getFirestore(app);
  KC_IDS = (await db.collection("kcs").get()).docs.map((d) => d.id);
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
  lines.push(`| Mean KCs mastered per active learner (rebuilt from the log) | ${fmt(mean(active.map((r) => r.mastered)), 1)} |`);
  lines.push(`| Sessions whose model write failed and was restored from the log | ${rows.reduce((a, r) => a + r.repaired, 0)} |`);
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
  // ---- KC validation: do error rates fall with practice? -------------------
  // The standard data-driven check on a knowledge-component decomposition
  // (Cen, Koedinger and Junker, 2006) is whether the learning curve is
  // smooth and downward: if a KC is really one skill, error rate should fall
  // as opportunities accumulate. A flat curve suggests the KC is not being
  // learned; a jagged or rising one suggests it bundles several skills, or
  // that its items are not measuring the same thing. It needs learner data,
  // so it reports itself as pending until the pilot runs.
  lines.push(`## Knowledge-component validation (learning curves)`);
  lines.push("");
  lines.push(`A knowledge component should behave like one skill: error rate falls as opportunities accumulate (Cen, Koedinger and Junker, 2006). A flat curve suggests the component is not being learned; a rising or jagged one suggests it bundles more than one skill, or that its items do not measure the same thing. This is the check that turns the decomposition in Section 5.6 from an assertion into a result.`);
  lines.push("");
  const curve = rows.flatMap((r) => r.curve);
  if (curve.length === 0) {
    lines.push(`No practice answers yet, so no curves. This section fills in when the pilot runs.`);
  } else {
    const byKc = new Map<string, Map<number, { n: number; wrong: number }>>();
    for (const c of curve) {
      const m = byKc.get(c.kcId) ?? new Map();
      const cell = m.get(c.opportunity) ?? { n: 0, wrong: 0 };
      cell.n += 1;
      if (!c.correct) cell.wrong += 1;
      m.set(c.opportunity, cell);
      byKc.set(c.kcId, m);
    }
    lines.push(`| Knowledge component | Opportunities | Error rate, first half | Error rate, second half | Slope per opportunity | Reads as |`);
    lines.push(`| --- | ---: | ---: | ---: | ---: | --- |`);
    for (const [kcId, m] of [...byKc.entries()].sort()) {
      const pts = [...m.entries()].sort((a, b) => a[0] - b[0]);
      const total = pts.reduce((a, [, c]) => a + c.n, 0);
      const mid = Math.ceil(pts.length / 2);
      const rate = (sel: typeof pts) => {
        const n = sel.reduce((a, [, c]) => a + c.n, 0);
        return n ? sel.reduce((a, [, c]) => a + c.wrong, 0) / n : null;
      };
      const first = rate(pts.slice(0, mid));
      const second = rate(pts.slice(mid));
      // Least-squares slope of error rate against opportunity.
      const xs = pts.map(([o]) => o);
      const ys = pts.map(([, c]) => c.wrong / c.n);
      const mx = mean(xs)!;
      const my = mean(ys)!;
      const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
      const slope = den ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i]! - my), 0) / den : 0;
      const reads =
        total < 10 ? "too few answers to read"
          : slope < -0.02 ? "learning, as expected"
          : slope > 0.02 ? "error rising, inspect this component"
          : "flat, inspect this component";
      lines.push(
        `| ${kcId.replace("kc-", "")} | ${total} | ${first === null ? "–" : (first * 100).toFixed(0) + "%"} | ${second === null ? "–" : (second * 100).toFixed(0) + "%"} | ${slope.toFixed(3)} | ${reads} |`,
      );
    }
    lines.push("");
    lines.push(`Components reading as flat or rising are the ones to re-examine: either the lessons are not teaching them or the items are not measuring one skill.`);
  }
  lines.push("");

  lines.push(`## Caveats`);
  lines.push("");
  lines.push(`- Placement (form A) and post-test (form B) use different items for every module except Liquidity, which has one pretest-eligible item, so that module is a repeat.`);
  lines.push(`- Time on task from answer latencies excludes reading lessons and watching recordings; it's a floor. Session wall-clock includes them but is capped at two hours per session to stop an abandoned tab counting.`);
  lines.push(`- There's no control group. Gains are pre/post on one group and can't separate the routing from the content. The routing question is addressed by simulation in EVALUATION.md.`);
  lines.push(`- Only the first completed post-test per learner counts.`);
  lines.push(`- Modules mastered are rebuilt from the append-only response log, not read from the learner's mastery document, which the browser writes. The log's shape and ranges are enforced by the security rules, but answers are graded in the browser, so the log records what the learner's client reported (see the report's limitations).`);
  lines.push(`- Option positions are evened out at build time (lib/content/debias.ts), so no answer position is worth guessing. Two authoring tells remain and are not corrected: the correct option is the longest in 37 of 55 multiple-choice items (42 characters against 26 for the distractors), and the true/false items run 5 true to 10 false. Both would inflate scores slightly for a test-wise participant.`);
  lines.push("");

  writeFileSync(OUT, lines.join("\n"));
  console.log(lines.slice(0, 40).join("\n"));
  console.log(`\nWritten to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
