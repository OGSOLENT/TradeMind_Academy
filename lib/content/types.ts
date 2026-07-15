/**
 * Content-domain types shared by the app, the seed script, and tests.
 * Mirrors the Firestore data model in docs/BUILD_PROMPT.md §4.
 */

export type Difficulty = "easy" | "med" | "hard";

export type ItemType = "mcq" | "multi" | "numeric" | "ordering" | "annotation" | "tf-confidence";

export interface Course {
  id: string;
  title: string;
  levels: number[];
}

export interface Kc {
  id: string;
  courseId: string;
  title: string;
  prereqIds: string[];
  level: number;
  description: string;
}

export type LessonBlock =
  | { kind: "markdown"; md: string }
  | {
      kind: "figure";
      src: string;
      caption: string;
      /** "Describe this chart" text alternative — required on every figure. */
      describe: string;
    }
  | { kind: "video"; poster: string }
  | { kind: "checkQuestion"; itemId: string };

export interface Lesson {
  id: string;
  kcId: string;
  title: string;
  blocks: LessonBlock[];
  videoUrl: string | null;
  videoFallbackUrl: string | null;
}

/** Payload shapes per item type. Placeholder copy — structure is canonical. */
export type ItemPayload =
  | { type: "mcq"; question: string; options: string[] }
  | { type: "multi"; question: string; options: string[] }
  | { type: "numeric"; question: string; unit: string; min: number; max: number; step: number }
  | { type: "ordering"; question: string; entries: string[] }
  | {
      type: "annotation";
      question: string;
      /** OHLC series rendered by lightweight-charts (simulated data only). */
      candles: Array<{ time: string; open: number; high: number; low: number; close: number }>;
      describe: string;
    }
  | { type: "tf-confidence"; statement: string };

export type AnswerKey =
  | { type: "mcq"; correct: number }
  | { type: "multi"; correct: number[] }
  | { type: "numeric"; value: number; tolerance: number }
  | { type: "ordering"; order: number[] }
  | { type: "annotation"; zone: { from: string; to: string; priceLow: number; priceHigh: number } }
  | { type: "tf-confidence"; value: boolean };

export interface Item {
  id: string;
  kcId: string;
  type: ItemType;
  difficulty: Difficulty;
  payload: ItemPayload;
  answerKey: AnswerKey;
  explanation: string;
  isPretestEligible: boolean;
}

export interface Level1Content {
  course: Course;
  kcs: Kc[];
  lessons: Lesson[];
  items: Item[];
}
