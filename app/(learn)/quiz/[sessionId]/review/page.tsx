"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { Item } from "@/lib/content/types";
import type { LearnerAnswer } from "@/lib/quiz/grade";
import { useQuizSession } from "@/lib/quiz/session-store";
import { AnnotationChart } from "@/components/learn/questions/annotation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

/**
 * Answer review (full_feedback_detail): every answered item with the
 * learner's answer vs the key, the explanation, and — for chart-annotation
 * items — the chart re-rendered with the learner's marker AND the correct
 * zone overlaid. Rule-based feedback only; an AI tutor is documented future
 * work (docs/PARKED.md).
 */

function describeAnswer(item: Item, answer: LearnerAnswer): string {
  switch (answer.type) {
    case "mcq":
      return item.payload.type === "mcq"
        ? (item.payload.options[answer.selected] ?? `option ${answer.selected + 1}`)
        : String(answer.selected);
    case "multi":
      return item.payload.type === "multi"
        ? answer.selected.map((i) => (item.payload as { options: string[] }).options[i]).join(" · ")
        : answer.selected.join(", ");
    case "numeric":
      return String(answer.value);
    case "ordering":
      return item.payload.type === "ordering"
        ? answer.order.map((i) => (item.payload as { entries: string[] }).entries[i]).join(" → ")
        : answer.order.join(" → ");
    case "annotation":
      return `${answer.time} @ ${answer.price}`;
    case "tf-confidence":
      return `${answer.value ? "True" : "False"} (${answer.confidence}% confident)`;
  }
}

function describeKey(item: Item): string {
  const key = item.answerKey;
  switch (key.type) {
    case "mcq":
      return item.payload.type === "mcq" ? (item.payload.options[key.correct] ?? "") : "";
    case "multi":
      return item.payload.type === "multi"
        ? key.correct.map((i) => (item.payload as { options: string[] }).options[i]).join(" · ")
        : key.correct.join(", ");
    case "numeric":
      return `${key.value} (±${key.tolerance})`;
    case "ordering":
      return item.payload.type === "ordering"
        ? key.order.map((i) => (item.payload as { entries: string[] }).entries[i]).join(" → ")
        : key.order.join(" → ");
    case "annotation":
      return `${key.zone.from} — ${key.zone.to}, ${key.zone.priceLow}–${key.zone.priceHigh}`;
    case "tf-confidence":
      return key.value ? "True" : "False";
  }
}

export default function AnswerReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const s = useQuizSession();

  if (s.sessionId !== sessionId || Object.keys(s.answers).length === 0) {
    return (
      <div className="mx-auto max-w-md pt-20 text-center">
        <h1 className="text-headline-md text-fg-primary">Nothing to review</h1>
        <p className="mt-2 text-body-base text-fg-secondary">
          This session isn&apos;t available anymore — reviews cover your most
          recent session only.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const answered = s.items.filter((it) => s.answers[it.id]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md text-fg-primary">Answer review</h1>
          <p className="mt-1 text-sm text-fg-secondary">
            {answered.length} questions ·{" "}
            {answered.filter((it) => s.answers[it.id]!.correct).length} correct
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" size="sm">
            Done
          </Button>
        </Link>
      </header>

      {answered.map((item, i) => {
        const record = s.answers[item.id]!;
        return (
          <Card key={item.id} level="elevated" className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <span className="num text-sm text-fg-muted">{i + 1}</span>
              <p className="flex-1 font-medium text-fg-primary">
                {"question" in item.payload ? item.payload.question : item.payload.statement}
              </p>
              <Pill tone={record.correct ? "mastery" : "warning"} dot>
                {record.correct ? "correct" : "missed"}
              </Pill>
            </div>

            {item.payload.type === "annotation" && item.answerKey.type === "annotation" ? (
              <AnnotationChart
                candles={item.payload.candles}
                describe={item.payload.describe}
                value={
                  record.answer.type === "annotation"
                    ? { time: record.answer.time, price: record.answer.price }
                    : null
                }
                onChange={() => {}}
                disabled
                revealZone={item.answerKey.zone}
              />
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-fg-muted">Your answer</dt>
                  <dd className={cn("num", record.correct ? "text-mastery-bright" : "text-warning")}>
                    {describeAnswer(item, record.answer)}
                  </dd>
                </div>
                {!record.correct && (
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-fg-muted">Correct answer</dt>
                    <dd className="num text-mastery-bright">{describeKey(item)}</dd>
                  </div>
                )}
              </dl>
            )}

            <p
              data-testid="review-explanation"
              className="rounded-control bg-white/5 p-3 text-sm leading-6 text-fg-secondary"
            >
              {item.explanation}
            </p>
            {!record.correct && (
              <Link
                href={`/lesson/${item.kcId}`}
                className="inline-block text-sm text-accent-bright hover:underline"
              >
                Review the lesson →
              </Link>
            )}
          </Card>
        );
      })}
    </div>
  );
}
