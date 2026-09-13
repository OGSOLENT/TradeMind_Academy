"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { SplitHeadline } from "@/components/marketing/split-headline";
import { VisibleMind } from "@/components/marketing/visible-mind";
import { Faq } from "@/components/marketing/faq";
import { Curriculum, CURRICULUM } from "@/components/marketing/curriculum";
import { Reveal } from "@/components/motion/stagger";

gsap.registerPlugin(ScrollTrigger);

// The r3f canvas only makes sense in a browser.
const HeroParticles = dynamic(
  () => import("@/components/marketing/hero-particles").then((m) => m.HeroParticles),
  { ssr: false },
);

/** The module titles, in teaching order. Drives the ticker. */
const MODULES = CURRICULUM.map((m) => m.title);

const STEPS = [
  ["01", "Placement", "One question per module calibrates a Bayesian estimate of what you already know."],
  ["02", "Adaptive practice", "Routing rules serve your weakest unlocked topic at the difficulty you've earned — and always explain themselves."],
  ["03", "Visible mastery", "Cross 80% and the constellation unlocks the next topic. Skip practice and skills fade back into review."],
] as const;

export default function LandingPage() {
  const [mobile, setMobile] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobile(window.innerWidth < 768);
  }, []);

  // As you scroll out of the hero, the copy drifts up a touch faster than
  // the page and fades, so the section feels like it's receding rather than
  // just being pushed off the top. Scrubbed to scroll, and skipped entirely
  // under reduced motion.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const copy = hero.querySelector("[data-hero-copy]");
    if (!copy) return;
    const ctx = gsap.context(() => {
      gsap.to(copy, {
        y: -90,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.5 },
      });
    }, hero);
    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Hero */}
      <section ref={heroRef} aria-label="Introduction" className="relative overflow-hidden">
        <HeroParticles mobile={mobile} />
        <div
          data-hero-copy
          className="relative mx-auto flex min-h-[82dvh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center"
        >
          <Pill tone="mastery" dot className="num">
            system online
          </Pill>
          <SplitHeadline
            text="Learn trading like your brain actually learns."
            accent="actually learns."
            className="mt-6 text-display-lg-mobile md:text-display-lg text-fg-primary md:text-[64px] md:leading-[1.1]"
          />
          <p className="mt-6 max-w-xl text-body-base text-fg-secondary">
            An adaptive tutor that models what you know — and teaches exactly
            what you don&apos;t. Bayesian cognitive science, visible on every
            question.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg">Start the placement test →</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="glass" size="lg">
                I have an account
              </Button>
            </Link>
          </div>
          <p className="num mt-10 text-label-caps uppercase tracking-[0.2em] text-fg-muted">
            simulation only · no signals · no live money
          </p>
        </div>

        {/* The scroll cue. A short line that keeps dripping down. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-6 hidden flex-col items-center gap-2 md:flex"
        >
          <span className="num text-[10px] uppercase tracking-[0.3em] text-fg-muted">scroll</span>
          <span className="h-10 w-px overflow-hidden rounded-pill bg-white/5">
            <span className="tm-scroll-cue block h-full w-full bg-gradient-to-b from-mastery-bright to-accent-bright" />
          </span>
        </div>
      </section>

      {/* The module ticker. A quiet strip of what's inside, on a loop. */}
      <section aria-label="Curriculum modules" className="relative border-y border-hair py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--bg-deep)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--bg-deep)] to-transparent"
        />
        <div className="overflow-hidden">
          <ul className="tm-marquee gap-10 whitespace-nowrap">
            {[...MODULES, ...MODULES].map((m, i) => (
              <li
                key={`${m}-${i}`}
                aria-hidden={i >= MODULES.length || undefined}
                className="flex items-center gap-10 text-label-caps uppercase tracking-[0.18em] text-fg-secondary"
              >
                <span>{m}</span>
                <span className="h-1 w-1 rounded-pill bg-mastery/60" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-label="How it works" className="mx-auto max-w-5xl scroll-mt-24 px-6 pb-8 pt-24">
        <Reveal>
          <p className="num text-label-caps uppercase tracking-[0.2em] text-mastery-bright">How it works</p>
          <h2 className="mt-3 max-w-xl text-display-lg-mobile md:text-display-lg text-fg-primary">
            Three moves, <span className="text-gradient">every session</span>.
          </h2>
        </Reveal>
        <div className="relative mt-10 grid gap-4 md:grid-cols-3">
          {/* The connecting line behind the three steps on desktop. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-9 hidden h-px bg-gradient-to-r from-mastery/40 via-accent/40 to-accent-bright/40 md:block"
          />
          {STEPS.map(([n, title, copy], i) => (
            <Reveal key={n} className="h-full" rise={20}>
              <Card
                level="base"
                spotlight
                className="h-full p-6 transition-transform duration-300 hover:-translate-y-0.5"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="num flex h-7 w-7 items-center justify-center rounded-pill bg-accent/15 text-[11px] font-semibold tracking-widest text-accent-bright shadow-[inset_0_0_0_1px_var(--accent-glow)]">
                    {n}
                  </span>
                  <h3 className="text-body-base font-medium text-fg-primary">{title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-fg-secondary">{copy}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <VisibleMind />

      <Curriculum />

      <Faq />

      {/* Final CTA */}
      <section aria-label="Get started" className="px-6 pb-24 text-center">
        <Reveal>
          <Card
            level="elevated"
            spotlight
            className="relative mx-auto max-w-2xl overflow-hidden p-10 shadow-lift"
          >
            {/* A faint teal-to-indigo wash behind the copy. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_50%_0%,rgba(45,212,191,0.10),transparent_70%)]"
            />
            <h2 className="text-headline-md text-fg-primary">See your own starting map</h2>
            <p className="mt-2 text-body-base text-fg-secondary">
              Free, simulated, 18+. Your data stays yours — download or delete it anytime.
            </p>
            <Link href="/sign-up" className="mt-6 inline-block">
              <Button size="lg">Create an account</Button>
            </Link>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
