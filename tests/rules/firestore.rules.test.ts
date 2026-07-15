/**
 * Security-rules tests (BUILD_PROMPT §4). Run inside the Firestore emulator:
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
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

let env: RulesTestEnvironment;

const ALICE = "alice-uid";
const BOB = "bob-uid";

function db(uid: string | null, claims?: Record<string, unknown>) {
  return uid
    ? env.authenticatedContext(uid, claims).firestore()
    : env.unauthenticatedContext().firestore();
}

const validProfile = {
  displayName: "Alice",
  createdAt: new Date(),
  consent: null,
  isAdult: true,
  settings: { theme: "dark", reducedMotion: false, colorBlindCandles: false, fontScale: 1 },
};

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
    await assertSucceeds(setDoc(doc(db(ALICE), "users", ALICE), validProfile));
  });

  it("create is rejected without the 18+ flag", async () => {
    await assertFails(setDoc(doc(db(ALICE), "users", ALICE), { ...validProfile, isAdult: false }));
  });

  it("another user cannot read or write my profile", async () => {
    await assertSucceeds(setDoc(doc(db(ALICE), "users", ALICE), validProfile));
    await assertFails(getDoc(doc(db(BOB), "users", ALICE)));
    await assertFails(updateDoc(doc(db(BOB), "users", ALICE), { displayName: "hax" }));
  });

  it("unauthenticated access is denied", async () => {
    await assertFails(getDoc(doc(db(null), "users", ALICE)));
  });
});

describe("users/{uid}/mastery + sessions", () => {
  it("owner reads/writes own mastery doc", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "users", ALICE, "mastery", "trading-foundations"), {
        kcs: {},
        updatedAt: new Date(),
      }),
    );
  });

  it("stranger cannot touch my mastery", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "users", ALICE, "mastery", "trading-foundations"), { kcs: {} }),
    );
  });

  it("sessions cannot be deleted", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "users", ALICE, "sessions", "s1"), {
        type: "topic-test",
        startedAt: new Date(),
        endedAt: null,
        kcIds: ["kc-candlestick-anatomy"],
      }),
    );
    await assertFails(deleteDoc(doc(db(ALICE), "users", ALICE, "sessions", "s1")));
  });
});

describe("responses — the append-only research log", () => {
  const response = {
    itemId: "kc-candlestick-anatomy-item-1",
    kcId: "kc-candlestick-anatomy",
    questionType: "mcq",
    correct: true,
    selected: 1,
    latencyMs: 4200,
    pLBefore: 0.25,
    pLAfter: 0.38,
    ts: new Date(),
  };

  it("owner can create a response", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "users", ALICE, "sessions", "s1", "responses", "r1"), response),
    );
  });

  it("responses can NEVER be updated — even by the owner", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "users", ALICE, "sessions", "s1", "responses", "r1"), response),
    );
    await assertFails(
      updateDoc(doc(db(ALICE), "users", ALICE, "sessions", "s1", "responses", "r1"), {
        correct: false,
      }),
    );
  });

  it("responses can NEVER be deleted — even by the owner", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "users", ALICE, "sessions", "s1", "responses", "r1"), response),
    );
    await assertFails(
      deleteDoc(doc(db(ALICE), "users", ALICE, "sessions", "s1", "responses", "r1")),
    );
  });

  it("stranger cannot read my responses", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "users", ALICE, "sessions", "s1", "responses", "r1"), response),
    );
    await assertFails(
      getDoc(doc(db(BOB), "users", ALICE, "sessions", "s1", "responses", "r1")),
    );
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
