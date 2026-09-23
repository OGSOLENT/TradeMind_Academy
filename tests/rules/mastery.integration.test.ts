/**
 * The learner-model write path, end to end against the Firestore emulator
 * and the real security rules: closing a session, and repairing the model
 * from the response log when a close didn't make it.
 *
 *   npm run test:rules
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { completeSession, reconcileMastery } from "@/lib/firebase/mastery";
import { rebuildMastery } from "@/lib/mastery/ledger";
import { updateMastery } from "@/lib/bkt";

let env: RulesTestEnvironment;
const UID = "learner-1";
const COURSE = "trading-foundations";
const KCS = ["kc-a", "kc-b"];

const fs = (): Firestore => env.authenticatedContext(UID).firestore() as unknown as Firestore;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-trademind-mastery",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const id of KCS) await setDoc(doc(ctx.firestore(), "kcs", id), { title: id });
  });
});

afterAll(async () => {
  await env.cleanup();
});

/** Open a session and log answers exactly as the app does. */
async function runSession(sid: string, type: string, answers: Array<{ kcId: string; correct: boolean; ts: number }>) {
  const db = fs();
  await setDoc(doc(db, "users", UID, "sessions", sid), {
    type,
    startedAt: serverTimestamp(),
    endedAt: null,
    kcIds: [...new Set(answers.map((a) => a.kcId))],
  });
  for (const a of answers) {
    await addDoc(collection(db, "users", UID, "sessions", sid, "responses"), {
      itemId: `${a.kcId}-item`,
      kcId: a.kcId,
      questionType: "mcq",
      correct: a.correct,
      selected: { type: "mcq", selected: 0 },
      latencyMs: 1000,
      pLBefore: 0.25,
      pLAfter: 0.5,
      ts: a.ts,
      serverTs: serverTimestamp(),
    });
  }
}

const readMastery = async () => (await getDoc(doc(fs(), "users", UID, "mastery", COURSE))).data();
const readSession = async (sid: string) => (await getDoc(doc(fs(), "users", UID, "sessions", sid))).data();

describe("completeSession", () => {
  it("closes a practice session and writes its result in one step, through the rules", async () => {
    await runSession("s1", "topic-test", [{ kcId: "kc-a", correct: true, ts: 10 }]);
    const pL = updateMastery(0.25, true).pL;
    const ok = await completeSession(fs(), UID, COURSE, {
      sessionId: "s1",
      type: "topic-test",
      after: { "kc-a": pL },
      attempts: { "kc-a": 1 },
      score: { correct: 1, total: 1 },
    });
    expect(ok).toBe(true);
    const m = await readMastery();
    expect(m?.kcs["kc-a"].pL).toBeCloseTo(pL, 12);
    expect(m?.kcs["kc-a"].attempts).toBe(1);
    const s = await readSession("s1");
    expect(s?.masteryApplied).toBe(true);
    expect(s?.endedAt).not.toBeNull();
    expect(s?.score).toEqual({ correct: 1, total: 1 });
  });

  it("initialises the whole model from a placement", async () => {
    await runSession("p1", "placement", [
      { kcId: "kc-a", correct: true, ts: 1 },
      { kcId: "kc-b", correct: false, ts: 2 },
    ]);
    await completeSession(fs(), UID, COURSE, {
      sessionId: "p1",
      type: "placement",
      kcIds: KCS,
      placementAnswers: [
        { kcId: "kc-a", correct: true, ts: 1 },
        { kcId: "kc-b", correct: false, ts: 2 },
      ],
      score: { correct: 1, total: 2 },
    });
    const m = await readMastery();
    expect(m?.kcs["kc-a"].pL).toBeCloseTo(0.648, 12);
    expect(m?.kcs["kc-b"].pL).toBeCloseTo(0.1552, 12);
  });

  it("closes a post-test without touching the model", async () => {
    await runSession("t1", "post-test", [{ kcId: "kc-a", correct: false, ts: 5 }]);
    await completeSession(fs(), UID, COURSE, { sessionId: "t1", type: "post-test", score: { correct: 0, total: 1 } });
    expect(await readMastery()).toBeUndefined();
    expect((await readSession("t1"))?.masteryApplied).toBe(true);
  });
});

describe("reconcileMastery", () => {
  it("does nothing when every finished session made it into the model", async () => {
    await runSession("s1", "topic-test", [{ kcId: "kc-a", correct: true, ts: 10 }]);
    await completeSession(fs(), UID, COURSE, {
      sessionId: "s1",
      type: "topic-test",
      after: { "kc-a": updateMastery(0.25, true).pL },
      attempts: { "kc-a": 1 },
    });
    expect(await reconcileMastery(fs(), UID, COURSE)).toBe(0);
  });

  it("restores a session whose model write was lost, from the log", async () => {
    // Placement applied normally.
    await runSession("p1", "placement", [{ kcId: "kc-a", correct: true, ts: 1 }]);
    await completeSession(fs(), UID, COURSE, {
      sessionId: "p1",
      type: "placement",
      kcIds: KCS,
      placementAnswers: [{ kcId: "kc-a", correct: true, ts: 1 }],
    });
    const before = (await readMastery())?.kcs["kc-a"].pL as number;

    // A practice session whose answers were logged and which was closed,
    // but whose mastery write never landed: exactly the old bug.
    await runSession("s2", "topic-test", [
      { kcId: "kc-a", correct: true, ts: 20 },
      { kcId: "kc-a", correct: true, ts: 21 },
    ]);
    await updateDoc(doc(fs(), "users", UID, "sessions", "s2"), { endedAt: serverTimestamp(), masteryApplied: false });

    expect(await reconcileMastery(fs(), UID, COURSE)).toBe(1);

    const expected = rebuildMastery(KCS, [
      { id: "p1", type: "placement", answers: [{ kcId: "kc-a", correct: true, ts: 1 }] },
      {
        id: "s2",
        type: "topic-test",
        answers: [
          { kcId: "kc-a", correct: true, ts: 20 },
          { kcId: "kc-a", correct: true, ts: 21 },
        ],
      },
    ]);
    const after = (await readMastery())?.kcs["kc-a"].pL as number;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeCloseTo(expected.kcs["kc-a"]!.pL, 12);
    const s2 = await readSession("s2");
    expect(s2?.masteryApplied).toBe(true);
    expect(s2?.repairedAt).toBeDefined();

    // And it's idempotent: a second visit finds nothing to do.
    expect(await reconcileMastery(fs(), UID, COURSE)).toBe(0);
  });

  it("overwrites a tampered model with the one the log supports", async () => {
    await runSession("s1", "topic-test", [{ kcId: "kc-a", correct: false, ts: 10 }]);
    await updateDoc(doc(fs(), "users", UID, "sessions", "s1"), { endedAt: serverTimestamp(), masteryApplied: false });
    // The owner edits their own cache to claim mastery.
    await setDoc(doc(fs(), "users", UID, "mastery", COURSE), {
      kcs: { "kc-a": { pL: 1, attempts: 99, lastSeen: 0, masteredAt: 0 } },
      history: [],
      updatedAt: serverTimestamp(),
    });
    await reconcileMastery(fs(), UID, COURSE);
    const m = await readMastery();
    expect(m?.kcs["kc-a"].pL).toBeCloseTo(updateMastery(0.25, false).pL, 12);
    expect(m?.kcs["kc-a"].attempts).toBe(1);
    expect(m?.rebuiltAt).toBeDefined();
  });
});
