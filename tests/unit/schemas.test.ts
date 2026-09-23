import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  InvalidDocumentError,
  masteryOf,
  parseDocs,
  parseItem,
  parseKc,
  parseLesson,
  parseMasteryDoc,
  parseProfile,
} from "@/lib/firebase/schemas";
import type { Level1Content } from "@/lib/content/types";

/*
 * The validators sit between Firestore and the app. They have to accept
 * every real document (or the app breaks for learners) and reject malformed
 * ones where they are read (or the app breaks somewhere far away). The
 * first half runs the entire shipped bank through them; the second half
 * feeds them the kinds of damage a document can actually carry.
 */

const content: Level1Content = JSON.parse(readFileSync("content/level1.json", "utf8"));
const strip = <T extends { id: string }>({ id, ...rest }: T) => ({ id, data: rest });
const ts = { toMillis: () => 0 };

describe("every shipped document passes its validator", () => {
  it(`all ${content.items.length} items`, () => {
    for (const it of content.items) {
      const { id, data } = strip(it);
      expect(parseItem(id, data)).toEqual(it);
    }
  });

  it(`all ${content.lessons.length} lessons`, () => {
    for (const l of content.lessons) {
      const { id, data } = strip(l);
      expect(parseLesson(id, data)).toEqual(l);
    }
  });

  it(`all ${content.kcs.length} knowledge components`, () => {
    for (const k of content.kcs) {
      const { id, data } = strip(k);
      expect(parseKc(id, data)).toEqual(k);
    }
  });

  it("parseDocs parses a whole snapshot, keeping ids", () => {
    const snap = { docs: content.kcs.slice(0, 3).map((k) => ({ id: k.id, data: () => strip(k).data })) };
    expect(parseDocs(snap, parseKc).map((k) => k.id)).toEqual(content.kcs.slice(0, 3).map((k) => k.id));
  });
});

describe("a malformed document fails where it is read, and says where", () => {
  const mcq = strip(content.items.find((i) => i.type === "mcq")!);

  it("names the collection, the id and the field", () => {
    const bad = { ...mcq.data, answerKey: { type: "mcq", correct: "one" } };
    expect(() => parseItem(mcq.id, bad)).toThrowError(InvalidDocumentError);
    expect(() => parseItem(mcq.id, bad)).toThrowError(new RegExp(`items/${mcq.id}.*answerKey\\.correct`));
  });

  it("rejects an item whose three type fields disagree", () => {
    const bad = { ...mcq.data, answerKey: { type: "tf-confidence", value: true } };
    expect(() => parseItem(mcq.id, bad)).toThrowError(/type, payload.type and answerKey.type must match/);
  });

  it("rejects a missing required field", () => {
    const { explanation: _dropped, ...noExplanation } = mcq.data;
    expect(() => parseItem(mcq.id, noExplanation)).toThrowError(/explanation/);
  });

  it("rejects an unknown lesson block", () => {
    const l = strip(content.lessons[0]!);
    expect(() => parseLesson(l.id, { ...l.data, blocks: [{ kind: "iframe", src: "x" }] })).toThrowError(/blocks/);
  });
});

describe("the mastery document", () => {
  it("fills defaults for fields an older version didn't write", () => {
    const doc = parseMasteryDoc({ kcs: { "kc-a": { pL: 0.4 } } });
    expect(doc.kcs["kc-a"]).toEqual({ pL: 0.4, attempts: 0, lastSeen: 0, masteredAt: null });
    expect(doc.history).toEqual([]);
  });

  it("rejects an estimate outside 0 to 1", () => {
    expect(() => parseMasteryDoc({ kcs: { "kc-a": { pL: 1.5 } } })).toThrowError(/kcs\.kc-a\.pL/);
    expect(() => parseMasteryDoc({ kcs: { "kc-a": { pL: -0.1 } } })).toThrowError(InvalidDocumentError);
  });

  it("masteryOf gives an empty model for a learner who has none yet", () => {
    expect(masteryOf({ exists: () => false, data: () => undefined })).toEqual({ kcs: {}, history: [] });
  });
});

describe("the user profile", () => {
  const profile = {
    displayName: "Ada",
    createdAt: ts,
    consent: { agreedAt: ts, version: "2026-07-15.v1" },
    isAdult: true,
    settings: { theme: "dark", reducedMotion: false, colorBlindCandles: false, fontScale: 1 },
  };

  it("accepts a complete profile", () => {
    expect(parseProfile("u1", profile).displayName).toBe("Ada");
  });

  it("accepts the moment before the server confirms a timestamp", () => {
    // A serverTimestamp() field reads as null locally until the write lands,
    // which is exactly when a new learner's profile is first read.
    const pending = { ...profile, createdAt: null, consent: { agreedAt: null, version: "v" } };
    expect(parseProfile("u1", pending).createdAt).toBeNull();
  });

  it("fills settings added after launch, so older profiles still load", () => {
    const old = { ...profile, settings: { theme: "dark" } };
    expect(parseProfile("u1", old).settings).toMatchObject({ reducedMotion: false, fontScale: 1 });
  });

  it("rejects a profile without the 18+ flag", () => {
    const { isAdult: _gone, ...noFlag } = profile;
    expect(() => parseProfile("u1", noFlag)).toThrowError(/users\/u1.*isAdult/);
  });
});
