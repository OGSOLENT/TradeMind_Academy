"use client";

import { useRef, useState } from "react";
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
          className="absolute right-3 top-3 rounded-pill bg-[rgba(5,5,7,0.8)] px-3 py-1.5 text-label-caps uppercase tracking-wider text-mastery-bright shadow-hairline backdrop-blur-sm transition-[background-color,box-shadow] duration-200 hover:bg-bg-deep hover:shadow-[inset_0_0_0_1px_var(--mastery-glow)]"
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

/**
 * The lecture video. A framed player with the poster showing first and a
 * single play control over it, so the block reads as a piece of the lesson
 * rather than a bare <video> dropped into the column. Press play and the
 * native controls take over. With no video yet, the poster stands in.
 *
 * The recordings live outside the repo (public/videos is a symlink) and
 * aren't part of the Vercel deployment, so a lesson can have a videoUrl the
 * server can't serve. If the file fails to load the block falls back to the
 * poster and says so, instead of a dead player. NEXT_PUBLIC_VIDEO_BASE, when
 * set, points /videos/... at wherever the recordings are hosted.
 */
const VIDEO_BASE = process.env.NEXT_PUBLIC_VIDEO_BASE?.replace(/\/$/, "");

function resolveVideo(url: string | null): string | null {
  if (!url) return null;
  if (VIDEO_BASE && url.startsWith("/videos/")) return `${VIDEO_BASE}/${url.slice("/videos/".length)}`;
  return url;
}

export function VideoBlock({
  block,
  videoUrl,
  title,
}: {
  block: Extract<LessonBlock, { kind: "video" }>;
  videoUrl: string | null;
  title?: string;
}) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const src = unavailable ? null : resolveVideo(videoUrl);

  const play = () => {
    setPlaying(true);
    // The element is already mounted underneath the poster, so this is
    // immediate and counts as a user gesture for autoplay policies.
    void videoRef.current?.play();
  };

  return (
    <figure id="lecture" className="scroll-mt-32">
      <div className="relative isolate overflow-hidden rounded-card bg-bg-elevated shadow-lift">
        {/* A soft wash behind the frame so it sits in light. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px -z-10 rounded-card bg-[radial-gradient(80%_60%_at_50%_0%,rgba(94,106,210,0.22),transparent_70%)]"
        />
        {src ? (
          <video
            ref={videoRef}
            src={src}
            controls={playing}
            preload="metadata"
            className="aspect-video w-full bg-bg-deep object-contain"
            onPlay={() => setPlaying(true)}
            onError={() => {
              setUnavailable(true);
              setPlaying(false);
            }}
          />
        ) : (
          <div className="aspect-video w-full bg-bg-deep" />
        )}

        {/* The poster sits on its own layer so it can fill the frame while
            the video underneath keeps its true aspect once it plays. */}
        <AnimatePresence>
          {!playing && (
            <motion.div
              key="overlay"
              initial={false}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            >
              <Image src={block.poster} alt="" fill sizes="720px" className="object-cover" unoptimized />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg-deep/85 via-bg-deep/30 to-transparent" />
              {src ? (
                <button
                  onClick={play}
                  aria-label={`Play the lecture${title ? `: ${title}` : ""}`}
                  className="group relative flex h-20 w-20 items-center justify-center rounded-pill bg-white/10 text-fg-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_0_40px_var(--accent-glow)] backdrop-blur-md transition-[transform,background-color,box-shadow] duration-300 hover:scale-105 hover:bg-white/15 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3),0_0_60px_var(--accent-glow)]"
                >
                  <span
                    aria-hidden="true"
                    className={cn("absolute inset-0 rounded-pill border border-accent/40", !reduced && "tm-node-pulse")}
                  />
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-1">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </button>
              ) : (
                <span
                  aria-hidden="true"
                  className="relative flex h-16 w-16 items-center justify-center rounded-pill bg-white/10 text-fg-secondary backdrop-blur-sm"
                >
                  ▶
                </span>
              )}
              <div className="relative flex items-center gap-2">
                <Pill tone={src ? "accent" : "neutral"} dot>
                  {src ? "Lecture" : unavailable ? "Recording not available here yet" : "Video coming soon"}
                </Pill>
                {title && src && (
                  <span className="text-sm text-fg-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{title}</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </figure>
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
