"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

gsap.registerPlugin(ScrollTrigger);

/**
 * The pinned "visible mind" scroll section: the bento grid assembles while
 * the section holds. Reduced motion (or short viewports) skips the pin and
 * shows the grid statically.
 */
export function VisibleMind() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const cards = section.querySelectorAll("[data-bento]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            end: "top 20%",
            scrub: false,
          },
        },
      );
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="visible-mind" aria-label="The visible mind" className="mx-auto max-w-5xl px-6 py-24">
      <h2 className="text-display-lg-mobile md:text-display-lg text-fg-primary">The visible mind</h2>
      <p className="mt-3 max-w-xl text-body-base text-fg-secondary">
        The tutor keeps a live Bayesian estimate of what you know — and shows
        you all of it. No black box, no vibes. Every number below is the kind
        the model actually computes.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Card data-bento level="elevated" className="flex flex-col items-center py-8">
          <p className="mb-4 text-label-caps uppercase tracking-wider text-fg-secondary">
            Pattern recognition
          </p>
          <MasteryRing value={0.78} size="lg" label="mastery" />
        </Card>

        <Card data-bento level="elevated" className="md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-label-caps uppercase tracking-wider text-fg-secondary">
              Adaptive routing
            </p>
            <Pill tone="accent" dot>
              live model
            </Pill>
          </div>
          <div className="num mt-5 space-y-3 text-sm">
            <div className="flex justify-between border-b border-hair pb-2">
              <span className="text-fg-secondary">P(knows fair value gaps)</span>
              <span className="text-mastery-bright">0.62</span>
            </div>
            <div className="flex justify-between border-b border-hair pb-2">
              <span className="text-fg-secondary">P(correct next item)</span>
              <span className="text-fg-primary">0.71</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-secondary">next difficulty</span>
              <span className="text-warning">med → hard</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-fg-secondary">
            Questions target your weakest unlocked topic, at the difficulty
            your estimate earns. Ask &quot;why this question?&quot; any time —
            the model answers with its real numbers.
          </p>
        </Card>

        <Card data-bento level="elevated" className="md:col-span-2">
          <p className="text-label-caps uppercase tracking-wider text-fg-secondary">
            Session metrics
          </p>
          <div className="num mt-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl text-fg-primary">1,402</p>
              <p className="mt-1 text-xs text-fg-secondary">decisions logged</p>
            </div>
            <div>
              <p className="text-3xl text-mastery-bright">+4.2%</p>
              <p className="mt-1 text-xs text-fg-secondary">weekly accuracy</p>
            </div>
            <div>
              <p className="text-3xl text-warning">3</p>
              <p className="mt-1 text-xs text-fg-secondary">skills fading</p>
            </div>
          </div>
        </Card>

        <Card data-bento level="elevated">
          <p className="text-label-caps uppercase tracking-wider text-fg-secondary">
            Spaced repetition
          </p>
          <div className="mt-5 grid grid-cols-7 gap-1.5" aria-hidden="true">
            {[0.9, 0.2, 0.5, 0.05, 0.7, 1, 0.3, 0.6, 0.1, 0.8, 0.4, 0.9, 0.15, 0.55].map((v, i) => (
              <span
                key={i}
                className="aspect-square rounded"
                style={{ backgroundColor: `rgba(45,212,191,${0.08 + v * 0.6})` }}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-fg-secondary">
            Unpractised skills fade in the model — and surface in your review
            queue before they fade in your head.
          </p>
        </Card>
      </div>
    </section>
  );
}
