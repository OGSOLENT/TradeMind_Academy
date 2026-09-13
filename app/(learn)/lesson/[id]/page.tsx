"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { getKcs, getLesson, getLessonsByKc } from "@/lib/firebase/repos";
import { cn, slugify } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/stagger";
import { ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/learn/markdown";
import { LessonCheck } from "@/components/learn/lesson-check";
import { Walkthrough } from "@/components/learn/walkthrough";
import { getWalkthrough } from "@/lib/walkthroughs";
import {
  CheckQuestionBlock,
  FigureBlock,
  VideoBlock,
} from "@/components/learn/lesson-blocks";

/**
 * The lesson view.
 *
 * A reading column with a rail beside it on desktop. The rail carries an
 * outline of the sections (built from the markdown's h2s), which tracks the
 * one you're reading, plus your place in the module and a practise button.
 * The page opens on the module, the title, the reading time and the
 * lesson's own "what you'll learn" list pulled out into a card, then the
 * lecture video in a proper frame, then the prose. It ends on a check ring
 * and a card for the next lesson, so there's always a next step.
 */

interface Section {
  id: string;
  title: string;
}

/** Pull "## What you'll learn" and its list out of the markdown, if it's there. */
function splitObjectives(md: string): { objectives: string[]; rest: string } {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => /^## what you.?ll learn/i.test(l.trim()));
  if (start === -1) return { objectives: [], rest: md };
  let end = start + 1;
  const objectives: string[] = [];
  while (end < lines.length) {
    const t = lines[end]!.trim();
    if (t.startsWith("## ") || t === "---") break;
    if (t.startsWith("- ")) objectives.push(t.slice(2));
    end++;
  }
  const rest = [...lines.slice(0, start), ...lines.slice(end)].join("\n").replace(/^\s*---\s*\n/, "");
  return { objectives, rest };
}

function sectionsOf(md: string): Section[] {
  return md
    .split("\n")
    .filter((l) => l.trim().startsWith("## "))
    .map((l) => l.trim().slice(3))
    .map((title) => ({ id: slugify(title), title }));
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [pastTitle, setPastTitle] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  // The other lessons in the same module, for the rail and the footer.
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
      // The floating mini-header shows once the real title has scrolled away.
      setPastTitle(el.scrollTop > 360);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The prose, with the objectives lifted out of the first markdown block.
  const { blocks, objectives, sections } = useMemo(() => {
    if (!lesson) return { blocks: [], objectives: [] as string[], sections: [] as Section[] };
    let objectives: string[] = [];
    let lifted = false;
    const blocks = lesson.blocks.map((b) => {
      if (b.kind !== "markdown" || lifted) return b;
      lifted = true;
      const split = splitObjectives(b.md);
      objectives = split.objectives;
      return { ...b, md: split.rest };
    });
    const sections = blocks.flatMap((b) => (b.kind === "markdown" ? sectionsOf(b.md) : []));
    return { blocks, objectives, sections };
  }, [lesson]);

  // A rough reading time. 200 words a minute, counting only the prose blocks.
  const readingMinutes = useMemo(() => {
    if (!lesson) return 0;
    const words = lesson.blocks
      .filter((b): b is Extract<typeof b, { kind: "markdown" }> => b.kind === "markdown")
      .reduce((n, b) => n + b.md.split(/\s+/).length, 0);
    return Math.max(1, Math.round(words / 200));
  }, [lesson]);

  // Which section is on screen. Whichever h2 last crossed the top third
  // of the viewport wins, which matches how people read.
  useEffect(() => {
    if (sections.length === 0) return;
    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (headings.length === 0) return;
    const pick = () => {
      const line = window.innerHeight * 0.33;
      let current: string | null = null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= line) current = h.id;
      }
      setActiveSection(current ?? headings[0]!.id);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    return () => window.removeEventListener("scroll", pick);
  }, [sections, lesson?.id]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-[720px] space-y-4 pt-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="aspect-video w-full rounded-card" />
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
  const index = siblings?.findIndex((s) => s.id === lesson.id) ?? -1;
  const next = index >= 0 ? siblings?.[index + 1] : undefined;
  const moduleProgress = siblings && siblings.length > 0 && index >= 0 ? (index + 1) / siblings.length : 0;
  // The inline check's item stays out of the end-of-lesson check, so it
  // never asks the same question twice.
  const inlineCheckId = lesson.blocks.find((b) => b.kind === "checkQuestion")?.itemId ?? null;

  return (
    <>
      {/* The floating 2px reading-progress line (DESIGN.md "Learning Progress") */}
      <div className="fixed inset-x-0 top-0 z-40">
        <ProgressBar value={progress} variant="thin" aria-label="Reading progress" />
      </div>

      {/* A small floating header that appears once the title has scrolled
          out of view, so you always know where you are and how far in. */}
      <AnimatePresence>
        {pastTitle && (
          <motion.div
            key="mini"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-x-0 top-[84px] z-30 hidden justify-center md:flex"
            aria-hidden="true"
          >
            <div className="glass-nav flex max-w-[720px] items-center gap-3 rounded-pill border border-white/10 px-4 py-2 shadow-lift">
              <span className="text-label-caps uppercase tracking-wider text-mastery-bright">
                {kc?.title ?? "Lesson"}
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="truncate text-sm text-fg-primary">{lesson.title}</span>
              <span className="h-3 w-px bg-white/10" />
              <span className="num text-xs text-fg-secondary">{Math.round(progress * 100)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto flex max-w-[1040px] gap-10">
        <article className="min-w-0 max-w-[720px] flex-1 space-y-8 pb-24">
          <Stagger autoWrap={false} className="space-y-5 pt-4">
            <StaggerItem className="flex flex-wrap items-center gap-2">
              <Pill tone="mastery">Level {kc?.level ?? 1} · {kc?.title ?? "Lesson"}</Pill>
              {siblings && index >= 0 && (
                <Pill>
                  Lesson <span className="num">{index + 1}</span>&nbsp;of&nbsp;<span className="num">{siblings.length}</span>
                </Pill>
              )}
              <Pill>
                <span className="num">{readingMinutes}</span>&nbsp;min read
              </Pill>
            </StaggerItem>
            <StaggerItem>
              <h1 className="text-display-lg-mobile md:text-display-lg text-fg-primary">{lesson.title}</h1>
            </StaggerItem>
            <StaggerItem>
              <p className="text-body-base text-fg-secondary">{kc?.description}</p>
            </StaggerItem>

            {objectives.length > 0 && (
              <StaggerItem>
                <Card level="elevated" spotlight className="p-5">
                  <p className="text-label-caps uppercase tracking-wider text-fg-secondary">
                    What you&apos;ll learn
                  </p>
                  <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                    {objectives.map((o, i) => (
                      <motion.li
                        key={i}
                        initial={reduced ? false : { opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-start gap-2.5 text-sm text-fg-primary"
                      >
                        <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-mastery/10 text-[10px] text-mastery-bright shadow-[inset_0_0_0_1px_var(--mastery-glow)]">
                          {i + 1}
                        </span>
                        <span>{o}</span>
                      </motion.li>
                    ))}
                  </ol>
                </Card>
              </StaggerItem>
            )}
            <StaggerItem>
              <Pill tone="warning" dot>
                Simulated data · education only
              </Pill>
            </StaggerItem>
          </Stagger>

          {blocks.map((block, i) => {
            const body = (() => {
              switch (block.kind) {
                case "markdown":
                  return <Markdown md={block.md} />;
                case "figure":
                  return <FigureBlock block={block} />;
                case "video":
                  return <VideoBlock block={block} videoUrl={lesson.videoUrl} title={lesson.title} />;
                case "walkthrough": {
                  const spec = getWalkthrough(block.id);
                  if (!spec) return null;
                  const nth = blocks.slice(0, i).filter((b) => b.kind === "walkthrough").length;
                  return <Walkthrough spec={spec} anchor={nth === 0 ? "walkthrough" : `walkthrough-${nth + 1}`} />;
                }
                case "checkQuestion":
                  return <CheckQuestionBlock itemId={block.itemId} />;
              }
            })();
            return <Reveal key={i}>{body}</Reveal>;
          })}

          {/* The check at the end of the lesson. It only asks once you press
              start, so the reading isn't interrupted by a question you didn't
              ask for. */}
          <Reveal>
            <LessonCheck
              kcId={lesson.kcId}
              kcTitle={kc?.title ?? "this module"}
              lessonId={lesson.id}
              excludeItemId={inlineCheckId}
              nextHref={next ? `/lesson/${next.id}` : "/practice"}
              nextLabel={next ? `Next lesson: ${next.title}` : "Practise this module"}
            />
          </Reveal>

          <footer className="space-y-8 border-t border-hair pt-8">
            {/* The end-of-lesson mark. The ring and the tick draw themselves in
                as you reach the bottom, once. */}
            <Reveal className="flex flex-col items-center gap-3">
              <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="var(--mastery)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform="rotate(-90 28 28)"
                  initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  style={{ filter: "drop-shadow(0 0 6px var(--mastery-glow))" }}
                />
                <motion.path
                  d="M18 28.5l7 7 13-14"
                  fill="none"
                  stroke="var(--mastery-bright)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: reduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <p className="text-center text-label-caps uppercase tracking-widest text-fg-secondary">
                Lesson complete
              </p>
            </Reveal>

            {/* What's next. The next lesson if there is one, otherwise practice. */}
            <Reveal>
              {next ? (
                <Link href={`/lesson/${next.id}`} className="block">
                  <Card level="elevated" interactive spotlight className="flex items-center gap-5 p-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-label-caps uppercase tracking-wider text-accent-bright">Next lesson</p>
                      <p className="mt-1 truncate text-headline-md text-fg-primary">{next.title}</p>
                      <p className="mt-1 text-sm text-fg-secondary">
                        Lesson {index + 2} of {siblings?.length} in {kc?.title}
                      </p>
                    </div>
                    <span aria-hidden="true" className="text-2xl text-accent-bright transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Card>
                </Link>
              ) : (
                <Card level="elevated" spotlight className="flex flex-wrap items-center gap-5 p-6">
                  <MasteryRing value={1} size="sm" tone="mastery" />
                  <div className="min-w-0 flex-1">
                    <p className="text-label-caps uppercase tracking-wider text-mastery-bright">Module read</p>
                    <p className="mt-1 text-headline-md text-fg-primary">That&apos;s every lesson in {kc?.title}</p>
                    <p className="mt-1 text-sm text-fg-secondary">Now prove it. Practice is where the model updates.</p>
                  </div>
                </Card>
              )}
            </Reveal>

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

        {/* The rail. Desktop only, sticky under the nav. */}
        <aside className="hidden w-[250px] shrink-0 lg:block" aria-label="Lesson outline">
          <div className="sticky top-[104px] space-y-5">
            <div className="rounded-card bg-bg-base-veil p-5 shadow-hairline">
              <div className="flex items-center gap-4">
                <MasteryRing value={moduleProgress} size="sm" tone="accent" />
                <div className="min-w-0">
                  <p className="text-label-caps uppercase tracking-wider text-fg-secondary">In this module</p>
                  <p className="num mt-0.5 text-sm text-fg-primary">
                    {index + 1}/{siblings?.length ?? 1} lessons
                  </p>
                </div>
              </div>
            </div>

            {sections.length > 0 && (
              <div className="rounded-card bg-bg-base-veil p-5 shadow-hairline">
                <p className="text-label-caps uppercase tracking-wider text-fg-secondary">On this page</p>
                <ol className="mt-3 space-y-0.5 border-l border-hair">
                  {lesson.videoUrl && (
                    <li>
                      <a
                        href="#lecture"
                        className="-ml-px block border-l border-transparent py-1.5 pl-3 text-sm text-fg-secondary transition-colors hover:text-fg-primary"
                      >
                        Lecture
                      </a>
                    </li>
                  )}
                  {blocks.some((b) => b.kind === "walkthrough") && (
                    <li>
                      <a
                        href="#walkthrough"
                        className="-ml-px block border-l border-transparent py-1.5 pl-3 text-sm text-fg-secondary transition-colors hover:text-fg-primary"
                      >
                        Walkthrough
                      </a>
                    </li>
                  )}
                  {sections.map((s) => {
                    const active = activeSection === s.id;
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          aria-current={active ? "location" : undefined}
                          className={cn(
                            "-ml-px block border-l py-1.5 pl-3 text-sm transition-[color,border-color] duration-200",
                            active
                              ? "border-mastery text-fg-primary"
                              : "border-transparent text-fg-secondary hover:text-fg-primary",
                          )}
                        >
                          {s.title}
                        </a>
                      </li>
                    );
                  })}
                  <li>
                    <a
                      href="#check"
                      className="-ml-px block border-l border-transparent py-1.5 pl-3 text-sm text-accent-bright transition-colors hover:text-fg-primary"
                    >
                      Check yourself
                    </a>
                  </li>
                </ol>
              </div>
            )}

            <Link href="/practice" className="block">
              <Button className="w-full">Practise this module</Button>
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
