import type { AnswerKey } from "@/lib/content/types";

/**
 * Learner answers, one shape per question type. Grading is pure, so it's
 * unit-testable and has no UI or Firebase imports.
 */
export type LearnerAnswer =
  | { type: "mcq"; selected: number }
  | { type: "multi"; selected: number[] }
  | { type: "numeric"; value: number }
  | { type: "ordering"; order: number[] }
  | { type: "annotation"; time: string; price: number }
  | { type: "tf-confidence"; value: boolean; confidence: number };

export function grade(answer: LearnerAnswer, key: AnswerKey): boolean {
  switch (key.type) {
    case "mcq":
      return answer.type === "mcq" && answer.selected === key.correct;
    case "multi": {
      if (answer.type !== "multi") return false;
      const a = [...answer.selected].sort((x, y) => x - y);
      const k = [...key.correct].sort((x, y) => x - y);
      return a.length === k.length && a.every((v, i) => v === k[i]);
    }
    case "numeric":
      return answer.type === "numeric" && Math.abs(answer.value - key.value) <= key.tolerance;
    case "ordering":
      return (
        answer.type === "ordering" &&
        answer.order.length === key.order.length &&
        answer.order.every((v, i) => v === key.order[i])
      );
    case "annotation": {
      if (answer.type !== "annotation") return false;
      const inTime = answer.time >= key.zone.from && answer.time <= key.zone.to;
      const inPrice = answer.price >= key.zone.priceLow && answer.price <= key.zone.priceHigh;
      return inTime && inPrice;
    }
    case "tf-confidence":
      return answer.type === "tf-confidence" && answer.value === key.value;
  }
}
