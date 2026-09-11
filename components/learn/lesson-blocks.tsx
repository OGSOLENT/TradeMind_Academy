"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { LessonBlock } from "@/lib/content/types";
import { getFirebase } from "@/lib/firebase/client";
import { getItem } from "@/lib/firebase/repos";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "./markdown";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

/** A figure with the "Describe this chart" text alternative. Every figure gets one, no exceptions. */
export function FigureBlock({ block }: { block: Extract<LessonBlock, { kind: "figure" }> }) {
  const [describe, setDescribe] = useState(false);
  return (
    <figure className="space-y-2">
      <div className="relative overflow-hidden rounded-card bg-bg-elevated shadow-edge-lit">
        <Image
          src={block.src}
          alt="" /* the visible caption and the describe toggle carry the description */
          width={1200}
          height={520}
          className="h-auto w-full"
          unoptimized
        />
        <button
          onClick={() => setDescribe((d) => !d)}
          aria-expanded={describe}
          className="absolute right-3 top-3 rounded-pill bg-bg-deep/80 px-3 py-1.5 text-label-caps uppercase tracking-wider text-mastery-bright shadow-hairline backdrop-blur-sm transition-[background-color,box-shadow] duration-200 hover:bg-bg-deep hover:shadow-[inset_0_0_0_1px_var(--mastery-glow)]"
        >
          {describe ? "Hide description" : "Describe this chart"}
        </button>
      </div>
      <AnimatePresence>
        {describe && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-control bg-white/5 p-4 text-sm leading-6 text-fg-secondary"
          >
            {block.describe}
          </motion.p>
        )}
      </AnimatePresence>
      <figcaption className="text-center text-xs text-fg-secondary">{block.caption}</figcaption>
    </figure>
  );
}

/** The video slot, with a poster fallback for when there's no video yet. */
export function VideoBlock({
  block,
  videoUrl,
}: {
  block: Extract<LessonBlock, { kind: "video" }>;
  videoUrl: string | null;
}) {
  if (videoUrl) {
    return (
      <video controls poster={block.poster} className="w-full rounded-card shadow-edge-lit">
        <source src={videoUrl} />
      </video>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-card bg-bg-elevated shadow-edge-lit">
      <Image src={block.poster} alt="Video lesson placeholder poster" width={1200} height={520} className="h-auto w-full" unoptimized />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-deep/60">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-pill bg-white/10 text-fg-primary backdrop-blur-sm"
        >
          ▶
        </span>
        <Pill tone="accent">Video coming soon</Pill>
      </div>
    </div>
  );
}

/** An inline knowledge check. Once you get it right it collapses down to a tick chip. */
export function CheckQuestionBlock({ itemId }: { itemId: string }) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const { data: item, isPending } = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => getItem(getFirebase().db, itemId),
  });

  if (isPending) return <Skeleton className="h-40 w-full rounded-card" />;
  if (!item || item.payload.type !== "mcq") return null;

  const { question, options } = item.payload;
  const correctIndex = item.answerKey.type === "mcq" ? item.answerKey.correct : -1;

  if (collapsed) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring.ui}
      >
        <Pill tone="mastery" dot className="px-4 py-2">
          ✓ Check complete — {question.slice(0, 48)}…
        </Pill>
      </motion.div>
    );
  }

  function onCheck() {
    if (selected === null) return;
    setResult(selected === correctIndex ? "correct" : "incorrect");
  }

  return (
    <Card level="glass" className="space-y-4" role="group" aria-label="Knowledge check">
      <Pill tone="mastery">Knowledge check</Pill>
      <p className="text-body-base font-medium text-fg-primary">{question}</p>
      <div className="space-y-2" role="radiogroup" aria-label="Answer options">
        {options.map((opt, i) => {
          const chosen = selected === i;
          const showState = result !== null && chosen;
          return (
            <button
              key={i}
              role="radio"
              aria-checked={chosen}
              disabled={result === "correct"}
              onClick={() => {
                setSelected(i);
                setResult(null);
              }}
              className={cn(
                "min-h-11 w-full rounded-control px-4 py-3 text-left text-sm transition-colors duration-200",
                chosen ? "text-fg-primary" : "text-fg-secondary hover:bg-white/5",
                showState && result === "correct" && "bg-mastery/10 shadow-[inset_0_0_0_1px_var(--mastery)]",
                showState && result === "incorrect" && "bg-warning/10 shadow-[inset_0_0_0_1px_var(--warning)]",
                chosen && result === null && "bg-accent/15 shadow-[inset_0_0_0_1px_var(--accent)]",
                !chosen && "shadow-hairline",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {result === "incorrect" && (
          <p className="text-sm text-warning">
            Not quite — have another look. {item.explanation}
          </p>
        )}
        {result === "correct" && (
          <p className="text-sm text-mastery-bright">Correct. {item.explanation}</p>
        )}
      </div>

      {result === "correct" ? (
        <Button variant="secondary" size="sm" onClick={() => setCollapsed(true)}>
          Continue reading
        </Button>
      ) : (
        <Button size="sm" onClick={onCheck} disabled={selected === null}>
          Check answer
        </Button>
      )}
    </Card>
  );
}
