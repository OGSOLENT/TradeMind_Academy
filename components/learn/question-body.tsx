"use client";

import type { Item } from "@/lib/content/types";
import type { LearnerAnswer } from "@/lib/quiz/grade";
import { McqOptions } from "@/components/learn/questions/mcq";
import { NumericInput } from "@/components/learn/questions/numeric";
import { OrderingList } from "@/components/learn/questions/ordering";
import { TfConfidence } from "@/components/learn/questions/tf-confidence";
import { AnnotationChart, type AnnotationValue } from "@/components/learn/questions/annotation";

/**
 * The bit of a question that's the same wherever it's asked: the in-progress
 * answer, how it turns into something the grader understands, and the
 * renderer for each of the six item types. The quiz session and the
 * end-of-lesson check both use this, so a question looks and behaves the
 * same in both places.
 */

export interface Working {
  mcq: number | null;
  multi: number[];
  numeric: number | null;
  ordering: number[];
  annotation: AnnotationValue | null;
  tf: boolean | null;
  confidence: number;
}

export function freshWorking(item: Item | undefined): Working {
  const orderingLength = item?.payload.type === "ordering" ? item.payload.entries.length : 0;
  return {
    mcq: null,
    multi: [],
    numeric: null,
    ordering: Array.from({ length: orderingLength }, (_, i) => i),
    annotation: null,
    tf: null,
    confidence: 70,
  };
}

/** The answer to grade, or null if there isn't one yet. */
export function answerFromWorking(item: Item, working: Working): LearnerAnswer | null {
  switch (item.payload.type) {
    case "mcq":
      return working.mcq === null ? null : { type: "mcq", selected: working.mcq };
    case "multi":
      return working.multi.length === 0 ? null : { type: "multi", selected: working.multi };
    case "numeric":
      return working.numeric === null ? null : { type: "numeric", value: working.numeric };
    case "ordering":
      return { type: "ordering", order: working.ordering };
    case "annotation":
      return working.annotation === null
        ? null
        : { type: "annotation", time: working.annotation.time, price: working.annotation.price };
    case "tf-confidence":
      return working.tf === null
        ? null
        : { type: "tf-confidence", value: working.tf, confidence: working.confidence };
  }
}

/** The question text, whichever field the item type keeps it in. */
export function promptOf(item: Item): string {
  return "question" in item.payload ? item.payload.question : item.payload.statement;
}

export function QuestionBody({
  item,
  working,
  setWorking,
  disabled,
  graded,
}: {
  item: Item;
  working: Working;
  setWorking: (update: (w: Working) => Working) => void;
  disabled: boolean;
  /** Once graded, the correct answer is revealed where the type supports it. */
  graded: boolean;
}) {
  switch (item.payload.type) {
    case "mcq":
      return (
        <McqOptions
          options={item.payload.options}
          selected={working.mcq}
          onSelect={(i) => setWorking((w) => ({ ...w, mcq: i }))}
          disabled={disabled}
          reveal={
            graded && item.answerKey.type === "mcq"
              ? { correct: item.answerKey.correct, chosen: working.mcq ?? -1 }
              : null
          }
        />
      );
    case "multi":
      return (
        <McqOptions
          multi
          options={item.payload.options}
          selected={null}
          onSelect={() => {}}
          selectedMulti={working.multi}
          onToggle={(i) =>
            setWorking((w) => ({
              ...w,
              multi: w.multi.includes(i) ? w.multi.filter((x) => x !== i) : [...w.multi, i],
            }))
          }
          disabled={disabled}
          revealSet={graded && item.answerKey.type === "multi" ? item.answerKey.correct : null}
        />
      );
    case "numeric":
      return (
        <NumericInput
          unit={item.payload.unit}
          min={item.payload.min}
          max={item.payload.max}
          step={item.payload.step}
          value={working.numeric}
          onChange={(v) => setWorking((w) => ({ ...w, numeric: v }))}
          disabled={disabled}
        />
      );
    case "ordering":
      return (
        <OrderingList
          entries={item.payload.entries}
          order={working.ordering}
          onChange={(order) => setWorking((w) => ({ ...w, ordering: order }))}
          disabled={disabled}
        />
      );
    case "annotation":
      return (
        <AnnotationChart
          candles={item.payload.candles}
          describe={item.payload.describe}
          value={working.annotation}
          onChange={(v) => setWorking((w) => ({ ...w, annotation: v }))}
          disabled={disabled}
          revealZone={graded && item.answerKey.type === "annotation" ? item.answerKey.zone : null}
        />
      );
    case "tf-confidence":
      return (
        <TfConfidence
          value={working.tf}
          confidence={working.confidence}
          onChange={(value, confidence) => setWorking((w) => ({ ...w, tf: value, confidence }))}
          disabled={disabled}
        />
      );
  }
}
