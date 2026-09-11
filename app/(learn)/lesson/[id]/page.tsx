"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { getKcs, getLesson, getLessonsByKc } from "@/lib/firebase/repos";
import { cn } from "@/lib/utils";
import { Reveal, Stagger } from "@/components/motion/stagger";
import { ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/learn/markdown";
import {
  CheckQuestionBlock,
  FigureBlock,
  VideoBlock,
} from "@/components/learn/lesson-blocks";

/**
 * The lesson view, per trademind_lesson_view. A fixed-width reading column,
 * a 2px reading-progress line right at the top, and figure, video and check
 * blocks inline with the prose.
 */
export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [progress, setProgress] = useState(0);

  // The id can be a lesson id or a knowledge-component id. A module link
  // resolves to the first lesson of that module.
  const { data: lesson, isPending } = useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const { db } = getFirebase();
      const direct = await getLesson(db, id);
      if (direct) return direct;
      const byKc = await getLessonsByKc(db, id);
      return byKc[0] ?? null;
    },
  });

  // The other lessons in the same module, for the footer navigation.
  const { data: siblings } = useQuery({
    queryKey: ["lessons-by-kc", lesson?.kcId],
    enabled: !!lesson?.kcId,
    queryFn: () => getLessonsByKc(getFirebase().db, lesson!.kcId),
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
      {/* The floating 2px reading-progress line (DESIGN.md "Learning Progress") */}
      <div className="fixed inset-x-0 top-0 z-40">
        <ProgressBar value={progress} variant="thin" aria-label="Reading progress" />
      </div>

      <article className="mx-auto max-w-[720px] space-y-8 pb-24">
        <Stagger className="space-y-4 pt-4">
          <Pill tone="mastery">Level {kc?.level ?? 1} · {kc?.title ?? "Lesson"}</Pill>
          <h1 className="text-display-lg-mobile md:text-display-lg text-fg-primary">
            {lesson.title}
          </h1>
          <p className="text-body-base text-fg-secondary">{kc?.description}</p>
          <Pill tone="warning" dot>
            Simulated data · education only
          </Pill>
        </Stagger>

        {lesson.blocks.map((block, i) => {
          const body = (() => {
            switch (block.kind) {
              case "markdown":
                return <Markdown md={block.md} />;
              case "figure":
                return <FigureBlock block={block} />;
              case "video":
                return <VideoBlock block={block} videoUrl={lesson.videoUrl} />;
              case "checkQuestion":
                return <CheckQuestionBlock itemId={block.itemId} />;
            }
          })();
          return <Reveal key={i}>{body}</Reveal>;
        })}

        <footer className="space-y-6 border-t border-hair pt-8">
          <p className="text-center text-label-caps uppercase tracking-widest text-fg-secondary">
            Lesson complete
          </p>

          {siblings && siblings.length > 1 && (
            <nav aria-label="Lessons in this module" className="space-y-2">
              <p className="text-label-caps uppercase tracking-wider text-fg-secondary">
                {kc?.title} · {siblings.length} lessons
              </p>
              <ol className="space-y-1.5">
                {siblings.map((s, i) => {
                  const current = s.id === lesson.id;
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/lesson/${s.id}`}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-control px-4 py-2.5 text-sm transition-[color,background-color,box-shadow,transform] duration-200 hover:translate-x-0.5",
                          current
                            ? "bg-accent/15 text-fg-primary shadow-[inset_0_0_0_1px_var(--accent)]"
                            : "text-fg-secondary shadow-hairline hover:bg-white/5 hover:text-fg-primary",
                        )}
                      >
                        <span className="num text-fg-muted">{String(i + 1).padStart(2, "0")}</span>
                        <span className="flex-1">{s.title}</span>
                        {current && (
                          <span className="text-label-caps uppercase tracking-wider text-accent-bright">
                            Reading
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/practice">
              <Button>Practise this module</Button>
            </Link>
            <Link href="/skill-tree">
              <Button variant="secondary">Back to the map</Button>
            </Link>
          </div>
        </footer>
      </article>
    </>
  );
}
