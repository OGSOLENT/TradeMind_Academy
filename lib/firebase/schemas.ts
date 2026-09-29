import { z } from "zod";
import type { Timestamp } from "firebase/firestore";
import type { Item, Kc, Lesson } from "@/lib/content/types";
import type { UserProfile } from "./types";
import type { MasteryDoc } from "@/lib/mastery/ledger";

const Difficulty = z.enum(["easy", "med", "hard"]);

export const KcSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  prereqIds: z.array(z.string()),
  level: z.number(),
  description: z.string(),
});

const Candle = z.object({
  time: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
});

const Payload = z.discriminatedUnion("type", [
  z.object({ type: z.literal("mcq"), question: z.string(), options: z.array(z.string()).min(2) }),
  z.object({ type: z.literal("multi"), question: z.string(), options: z.array(z.string()).min(2) }),
  z.object({
    type: z.literal("numeric"),
    question: z.string(),
    unit: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number(),
  }),
  z.object({ type: z.literal("ordering"), question: z.string(), entries: z.array(z.string()).min(2) }),
  z.object({
    type: z.literal("annotation"),
    question: z.string(),
    candles: z.array(Candle),
    describe: z.string(),
  }),
  z.object({ type: z.literal("tf-confidence"), statement: z.string() }),
]);

const Key = z.discriminatedUnion("type", [
  z.object({ type: z.literal("mcq"), correct: z.number().int().nonnegative() }),
  z.object({ type: z.literal("multi"), correct: z.array(z.number().int().nonnegative()).min(1) }),
  z.object({ type: z.literal("numeric"), value: z.number(), tolerance: z.number().nonnegative() }),
  z.object({ type: z.literal("ordering"), order: z.array(z.number().int().nonnegative()) }),
  z.object({
    type: z.literal("annotation"),
    zone: z.object({ from: z.string(), to: z.string(), priceLow: z.number(), priceHigh: z.number() }),
  }),
  z.object({ type: z.literal("tf-confidence"), value: z.boolean() }),
]);

export const ItemSchema = z
  .object({
    kcId: z.string(),
    type: z.enum(["mcq", "multi", "numeric", "ordering", "annotation", "tf-confidence"]),
    difficulty: Difficulty,
    payload: Payload,
    answerKey: Key,
    explanation: z.string(),
    isPretestEligible: z.boolean(),
  })
  .refine((it) => it.type === it.payload.type && it.type === it.answerKey.type, {
    message: "type, payload.type and answerKey.type must match",
  });

const Block = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("markdown"), md: z.string() }),
  z.object({ kind: z.literal("figure"), src: z.string(), caption: z.string(), describe: z.string() }),
  z.object({ kind: z.literal("video"), poster: z.string() }),
  z.object({ kind: z.literal("walkthrough"), id: z.string() }),
  z.object({ kind: z.literal("caseStudy"), id: z.string() }),
  z.object({ kind: z.literal("diagram"), id: z.string() }),
  z.object({ kind: z.literal("checkQuestion"), itemId: z.string() }),
]);

export const LessonSchema = z.object({
  kcId: z.string(),
  title: z.string(),
  blocks: z.array(Block),
  videoUrl: z.string().nullable(),
  videoFallbackUrl: z.string().nullable().default(null),
});

const KcRecordSchema = z.object({
  pL: z.number().min(0).max(1),
  attempts: z.number().int().nonnegative().default(0),
  lastSeen: z.number().default(0),
  masteredAt: z.number().nullable().default(null),
});

export const MasteryDocSchema = z.object({
  kcs: z.record(KcRecordSchema).default({}),
  history: z
    .array(z.object({ ts: z.number(), kcId: z.string(), pL: z.number().min(0).max(1) }))
    .default([]),
});

const TimestampLike = z
  .custom<Timestamp>((v) => typeof (v as { toMillis?: unknown } | null)?.toMillis === "function", {
    message: "expected a Firestore timestamp",
  })
  .nullable();

const SettingsSchema = z.object({
  theme: z.literal("dark").default("dark"),
  reducedMotion: z.boolean().default(false),
  colorBlindCandles: z.boolean().default(false),
  fontScale: z.union([z.literal(1), z.literal(1.15), z.literal(1.3)]).default(1),
  highContrast: z.boolean().optional(),
  readableFont: z.boolean().optional(),
  comfortableReading: z.boolean().optional(),
  calmMode: z.boolean().optional(),
});

export const ProfileSchema = z.object({
  displayName: z.string(),
  createdAt: TimestampLike,
  consent: z.object({ agreedAt: TimestampLike, version: z.string() }).nullable(),
  isAdult: z.boolean(),
  settings: SettingsSchema,
});

export class InvalidDocumentError extends Error {
  constructor(where: string, issues: z.ZodIssue[]) {
    const detail = issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    super(`Invalid document ${where}: ${detail}`);
    this.name = "InvalidDocumentError";
  }
}

function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, where: string, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new InvalidDocumentError(where, r.error.issues);
  return r.data;
}

export function parseKc(id: string, data: unknown): Kc {
  return { id, ...parse(KcSchema, `kcs/${id}`, data) };
}

export function parseItem(id: string, data: unknown): Item {
  return { id, ...parse(ItemSchema, `items/${id}`, data) };
}

export function parseLesson(id: string, data: unknown): Lesson {
  return { id, ...parse(LessonSchema, `lessons/${id}`, data) };
}

export function parseProfile(uid: string, data: unknown): UserProfile {
  return parse(ProfileSchema, `users/${uid}`, data);
}

export function parseMasteryDoc(data: unknown): MasteryDoc {
  return parse(MasteryDocSchema, "mastery", data);
}

export function masteryOf(snap: { exists(): boolean; data(): unknown }): MasteryDoc {
  return snap.exists() ? parseMasteryDoc(snap.data()) : { kcs: {}, history: [] };
}

/** Parse every document in a query snapshot with one of the parsers above. */
export function parseDocs<T>(
  snap: { docs: Array<{ id: string; data(): unknown }> },
  parser: (id: string, data: unknown) => T,
): T[] {
  return snap.docs.map((d) => parser(d.id, d.data()));
}
