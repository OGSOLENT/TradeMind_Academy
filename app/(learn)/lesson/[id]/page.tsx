"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { getKcs, getLesson } from "@/lib/firebase/repos";
import { ProgressBar } from "@/components/ui/progress";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/learn/markdown";
import {
  CheckQuestionBlock,
  FigureBlock,
  VideoBlock,
} from "@/components/learn/lesson-blocks";

/**
 * Lesson view per trademind_lesson_view: fixed-width reading column, 2px
 * reading-progress line at the very top, figure/video/check blocks inline.
 */
export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [progress, setProgress] = useState(0);

  const { data: lesson, isPending } = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => getLesson(getFirebase().db, id),
  });

  const { data: kcs } = useQuery({
    queryKey: ["kcs", "trading-foundations"],
    queryFn: () => getKcs(getFirebase().db, "trading-foundations"),
  });

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? el.scrollTop / total : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isPending) {
    return (
      <div className="mx-auto max-w-[720px] space-y-4 pt-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-auto max-w-[720px] pt-16 text-center">
        <h1 className="text-headline-md text-fg-primary">Lesson not found</h1>
        <p className="mt-2 text-body-base text-fg-secondary">
          It may not be seeded yet — run <code className="num">npm run seed</code> with the
          emulators up.
        </p>
      </div>
    );
  }

  const kc = kcs?.find((k) => k.id === lesson.kcId);

  return (
    <>
      {/* Floating 2px reading-progress line (DESIGN.md "Learning Progress") */}
      <div className="fixed inset-x-0 top-0 z-40">
        <ProgressBar value={progress} variant="thin" aria-label="Reading progress" />
      </div>

      <article className="mx-auto max-w-[720px] space-y-8 pb-24">
        <header className="space-y-4 pt-4">
          <Pill tone="mastery">Level {kc?.level ?? 1} · {kc?.title ?? "Lesson"}</Pill>
          <h1 className="text-display-lg-mobile md:text-display-lg text-fg-primary">
            {lesson.title}
          </h1>
          <p className="text-body-base text-fg-secondary">{kc?.description}</p>
          <Pill tone="warning" dot>
            Simulated data · education only
          </Pill>
        </header>

        {lesson.blocks.map((block, i) => {
          switch (block.kind) {
            case "markdown":
              return <Markdown key={i} md={block.md} />;
            case "figure":
              return <FigureBlock key={i} block={block} />;
            case "video":
              return <VideoBlock key={i} block={block} videoUrl={lesson.videoUrl} />;
            case "checkQuestion":
              return <CheckQuestionBlock key={i} itemId={block.itemId} />;
          }
        })}

        <footer className="pt-8 text-center">
          <p className="text-label-caps uppercase tracking-widest text-fg-secondary">
            Lesson complete
          </p>
        </footer>
      </article>
    </>
  );
}
