"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { SplitHeadline } from "@/components/marketing/split-headline";
import { VisibleMind } from "@/components/marketing/visible-mind";
import { Faq } from "@/components/marketing/faq";

// r3f canvas is browser-only.
const HeroParticles = dynamic(
  () => import("@/components/marketing/hero-particles").then((m) => m.HeroParticles),
  { ssr: false },
);

export default function LandingPage() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(window.innerWidth < 768);
  }, []);

  return (
    <>
      {/* Hero */}
      <section aria-label="Introduction" className="relative overflow-hidden">
        <HeroParticles mobile={mobile} />
        <div className="relative mx-auto flex min-h-[78dvh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
          <Pill tone="mastery" dot className="num">
            system online
          </Pill>
          <SplitHeadline
            text="Learn trading like your brain actually learns."
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
      </section>

      <VisibleMind />

      {/* How it works strip */}
      <section aria-label="How it works" className="mx-auto max-w-5xl px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["01", "Placement", "Eight questions calibrate a per-topic Bayesian estimate of what you already know."],
            ["02", "Adaptive practice", "Routing rules serve your weakest unlocked topic at the difficulty you've earned — and always explain themselves."],
            ["03", "Visible mastery", "Cross 80% and the constellation unlocks the next topic. Skip practice and skills fade back into review."],
          ].map(([n, title, copy]) => (
            <div key={n} className="rounded-card bg-bg-base p-6 shadow-hairline">
              <p className="num text-label-caps uppercase tracking-widest text-accent-bright">{n}</p>
              <h3 className="mt-2 text-body-base font-medium text-fg-primary">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-secondary">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <Faq />

      {/* Final CTA */}
      <section aria-label="Get started" className="px-6 pb-24 text-center">
        <div className="mx-auto max-w-2xl rounded-card bg-bg-elevated p-10 shadow-edge-lit">
          <h2 className="text-headline-md text-fg-primary">See your own starting map</h2>
          <p className="mt-2 text-body-base text-fg-secondary">
            Free, simulated, 18+. Your data stays yours — download or delete it anytime.
          </p>
          <Link href="/sign-up" className="mt-6 inline-block">
            <Button size="lg">Create an account</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
