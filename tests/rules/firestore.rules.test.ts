/**
 * The security-rules tests (BUILD_PROMPT section 4). They run inside the
 * Firestore emulator:
 *   npm run test:rules
 * which wraps: firebase emulators:exec --only firestore "vitest run --config vitest.rules.config.ts"
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

let env: RulesTestEnvironment;

const ALICE = "alice-uid";
const BOB = "bob-uid";

function db(uid: string | null, claims?: Record<string, unknown>) {
  return uid
    ? env.authenticatedContext(uid, claims).firestore()
    : env.unauthenticatedContext().firestore();
}

// Exactly what createUserProfile writes (lib/firebase/repos.ts).
const settings = {
  theme: "dark",
  reducedMotion: false,
  colorBlindCandles: false,
  fontScale: 1,
  highContrast: false,
  readableFont: false,
  comfortableReading: false,
  calmMode: false,
};
const validProfile = () => ({
  displayName: "Alice",
  createdAt: serverTimestamp(),
  consent: null,
  isAdult: true,
  settings,
});

// Exactly what the logger sends (lib/logging/index.ts).
const validResponse = () => ({
  itemId: "kc-candle-anatomy-item-1",
  kcId: "kc-candle-anatomy",
  questionType: "mcq",
  correct: true,
  selected: { type: "mcq", selected: 1 },
  latencyMs: 4200,
  pLBefore: 0.25,
  pLAfter: 0.648,
  ts: 1_790_000_000_000,
  serverTs: serverTimestamp(),
});

const validSession = () => ({
  type: "topic-test",
  startedAt: serverTimestamp(),
  endedAt: null,
  kcIds: ["kc-candle-anatomy"],
});

const validMastery = () => ({
  kcs: { "kc-candle-anatomy": { pL: 0.648, attempts: 1, lastSeen: 1, masteredAt: null } },
  history: [],
  updatedAt: serverTimestamp(),
});

const sessionRef = (uid: string | null, sid = "s1") => doc(db(uid), "users", ALICE, "sessions", sid);
const responseRef = (uid: string | null, rid = "r1") =>
  doc(db(uid), "users", ALICE, "sessions", "s1", "responses", rid);
const profileRef = (uid: string | null) => doc(db(uid), "users", ALICE);
const masteryRef = (uid: string | null) => doc(db(uid), "users", ALICE, "mastery", "trading-foundations");

async function aliceWithSession() {
  await assertSucceeds(setDoc(sessionRef(ALICE), validSession()));
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-trademind-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env.cleanup();
});

describe("users/{uid}", () => {
  it("owner can create their profile with isAdult=true", async () => {
    await assertSucceeds(setDoc(profileRef(ALICE), validProfile()));
  });

  it("create is rejected without the 18+ flag", async () => {
    await assertFails(setDoc(profileRef(ALICE), { ...validProfile(), isAdult: false }));
  });

  it("create is rejected with a client-chosen sign-up date or pre-filled consent", async () => {
    await assertFails(setDoc(profileRef(ALICE), { ...validProfile(), createdAt: new Date(2020, 0, 1) }));
    await assertFails(
      setDoc(profileRef(ALICE), { ...validProfile(), consent: { agreedAt: serverTimestamp(), version: "v" } }),
    );
  });

  it("create is rejected with fields the app never writes", async () => {
    await assertFails(setDoc(profileRef(ALICE), { ...validProfile(), role: "admin" }));
  });

  it("owner can give consent and change settings, and nothing else", async () => {
    await assertSucceeds(setDoc(profileRef(ALICE), validProfile()));
    await assertSucceeds(
      updateDoc(profileRef(ALICE), { consent: { agreedAt: serverTimestamp(), version: "2026-07-15.v1" } }),
    );
    await assertSucceeds(updateDoc(profileRef(ALICE), { settings: { ...settings, calmMode: true } }));
    await assertFails(updateDoc(profileRef(ALICE), { isAdult: false }));
    await assertFails(updateDoc(profileRef(ALICE), { createdAt: serverTimestamp() }));
    await assertFails(updateDoc(profileRef(ALICE), { settings: { ...settings, fontScale: 9 } }));
    await assertFails(updateDoc(profileRef(ALICE), { settings: { ...settings, sneaky: true } }));
  });

  it("another user cannot read or write my profile", async () => {
    await assertSucceeds(setDoc(profileRef(ALICE), validProfile()));
    await assertFails(getDoc(profileRef(BOB)));
    await assertFails(updateDoc(profileRef(BOB), { displayName: "hax" }));
  });

  it("unauthenticated access is denied", async () => {
    await assertFails(getDoc(profileRef(null)));
  });
});

describe("users/{uid}/mastery", () => {
  it("owner reads/writes a well-formed mastery doc", async () => {
    await assertSucceeds(setDoc(masteryRef(ALICE), validMastery()));
    await assertSucceeds(getDoc(masteryRef(ALICE)));
  });

  it("a rebuilt doc may carry its rebuild time", async () => {
    await assertSucceeds(setDoc(masteryRef(ALICE), { ...validMastery(), rebuiltAt: serverTimestamp() }));
  });

  it("rejects extra fields, a missing history, or a history past its cap", async () => {
    await assertFails(setDoc(masteryRef(ALICE), { ...validMastery(), cheat: true }));
    const { history: _h, ...noHistory } = validMastery();
    await assertFails(setDoc(masteryRef(ALICE), noHistory));
    const long = Array.from({ length: 201 }, (_, i) => ({ ts: i, kcId: "k", pL: 0.5 }));
    await assertFails(setDoc(masteryRef(ALICE), { ...validMastery(), history: long }));
  });

  it("stranger cannot touch my mastery", async () => {
    await assertFails(setDoc(masteryRef(BOB), validMastery()));
  });
});

describe("users/{uid}/sessions", () => {
  it("owner can open a session with exactly the app's fields", async () => {
    await aliceWithSession();
    await assertSucceeds(
      setDoc(sessionRef(ALICE, "lc"), { ...validSession(), type: "lesson-check", lessonId: "01-x" }),
    );
  });

  it("rejects an unknown session type, a client start time, or a session opened already ended", async () => {
    await assertFails(setDoc(sessionRef(ALICE, "a"), { ...validSession(), type: "free-marks" }));
    await assertFails(setDoc(sessionRef(ALICE, "b"), { ...validSession(), startedAt: new Date() }));
    await assertFails(setDoc(sessionRef(ALICE, "c"), { ...validSession(), endedAt: serverTimestamp() }));
  });

  it("can be closed and applied, with a sane score", async () => {
    await aliceWithSession();
    await assertSucceeds(
      updateDoc(sessionRef(ALICE), {
        endedAt: serverTimestamp(),
        masteryApplied: true,
        score: { correct: 7, total: 10 },
      }),
    );
    await assertSucceeds(updateDoc(sessionRef(ALICE), { masteryApplied: true, repairedAt: serverTimestamp() }));
  });

  it("rejects an impossible score, a rewritten type, or a client end time", async () => {
    await aliceWithSession();
    await assertFails(updateDoc(sessionRef(ALICE), { score: { correct: 11, total: 10 } }));
    await assertFails(updateDoc(sessionRef(ALICE), { type: "placement" }));
    await assertFails(updateDoc(sessionRef(ALICE), { endedAt: new Date() }));
  });

  it("sessions cannot be deleted", async () => {
    await aliceWithSession();
    await assertFails(deleteDoc(sessionRef(ALICE)));
  });
});

describe("responses — the append-only research log", () => {
  it("owner can create a well-formed response in an existing session", async () => {
    await aliceWithSession();
    await assertSucceeds(setDoc(responseRef(ALICE), validResponse()));
  });

  it("accepts a very slow answer: a real answer is never refused for latency", async () => {
    await aliceWithSession();
    await assertSucceeds(setDoc(responseRef(ALICE), { ...validResponse(), latencyMs: 3 * 86_400_000 }));
  });

  it("rejects a response to a session that doesn't exist", async () => {
    await assertFails(setDoc(responseRef(ALICE), validResponse()));
  });

  it("rejects estimates outside 0 to 1, negative latency, or an unknown question type", async () => {
    await aliceWithSession();
    await assertFails(setDoc(responseRef(ALICE, "a"), { ...validResponse(), pLAfter: 1.4 }));
    await assertFails(setDoc(responseRef(ALICE, "b"), { ...validResponse(), pLBefore: -0.2 }));
    await assertFails(setDoc(responseRef(ALICE, "c"), { ...validResponse(), latencyMs: -5 }));
    await assertFails(setDoc(responseRef(ALICE, "d"), { ...validResponse(), questionType: "essay" }));
    await assertFails(setDoc(responseRef(ALICE, "e"), { ...validResponse(), correct: "yes" }));
  });

  it("rejects a backdated server time, a missing field, or an extra one", async () => {
    await aliceWithSession();
    await assertFails(setDoc(responseRef(ALICE, "a"), { ...validResponse(), serverTs: new Date(2020, 0, 1) }));
    const { kcId: _k, ...noKc } = validResponse();
    await assertFails(setDoc(responseRef(ALICE, "b"), noKc));
    await assertFails(setDoc(responseRef(ALICE, "c"), { ...validResponse(), bonus: 10 }));
  });

  it("responses can NEVER be updated — even by the owner", async () => {
    await aliceWithSession();
    await assertSucceeds(setDoc(responseRef(ALICE), validResponse()));
    await assertFails(updateDoc(responseRef(ALICE), { correct: false }));
  });

  it("responses can NEVER be deleted — even by the owner", async () => {
    await aliceWithSession();
    await assertSucceeds(setDoc(responseRef(ALICE), validResponse()));
    await assertFails(deleteDoc(responseRef(ALICE)));
  });

  it("stranger cannot read or write my responses", async () => {
    await aliceWithSession();
    await assertSucceeds(setDoc(responseRef(ALICE), validResponse()));
    await assertFails(getDoc(responseRef(BOB)));
    await assertFails(setDoc(responseRef(BOB, "r2"), validResponse()));
  });
});

describe("users/{uid}/surveys", () => {
  const survey = () => ({
    answers: [4, 2, 5, 1, 4, 2, 5, 2, 4, 2],
    score: 82.5,
    comments: { helped: "", confused: "", trust: "" },
    submittedAt: serverTimestamp(),
  });
  const surveyRef = (uid: string | null) => doc(db(uid), "users", ALICE, "surveys", "sus");

  it("owner writes their own survey, and can change their answers", async () => {
    await assertSucceeds(setDoc(surveyRef(ALICE), survey()));
    await assertSucceeds(setDoc(surveyRef(ALICE), { ...survey(), score: 80 }));
    await assertSucceeds(getDoc(surveyRef(ALICE)));
  });

  it("rejects the wrong number of answers or a score off the SUS scale", async () => {
    await assertFails(setDoc(surveyRef(ALICE), { ...survey(), answers: [5, 5, 5] }));
    await assertFails(setDoc(surveyRef(ALICE), { ...survey(), score: 140 }));
  });

  it("stranger cannot read or write my survey", async () => {
    await assertFails(setDoc(surveyRef(BOB), survey()));
    await assertFails(getDoc(surveyRef(BOB)));
    await assertFails(getDoc(surveyRef(null)));
  });
});

describe("content collections", () => {
  it("authed users can read content, unauthenticated cannot", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "kcs", "kc-1"), { title: "KC", courseId: "c1" });
    });
    await assertSucceeds(getDoc(doc(db(ALICE), "kcs", "kc-1")));
    await assertFails(getDoc(doc(db(null), "kcs", "kc-1")));
  });

  it("regular users cannot write content", async () => {
    for (const col of ["courses", "kcs", "lessons", "items"]) {
      await assertFails(setDoc(doc(db(ALICE), col, "x"), { title: "nope" }));
    }
  });

  it("admin custom claim can write content", async () => {
    for (const col of ["courses", "kcs", "lessons", "items"]) {
      await assertSucceeds(setDoc(doc(db("admin-uid", { admin: true }), col, "x"), { title: "ok" }));
    }
  });
});
