"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function SplitHeadline({
  text,
  accent,
  className,
}: {
  text: string;
  accent?: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>("[data-word]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.15 });
      return;
    }
    const tween = gsap.fromTo(
      words,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.06,
        ease: "expo.out",
        delay: 0.15,
      },
    );
    return () => {
      tween.kill();
    };
  }, [text]);

  const words = text.split(" ");
  const accentWords = accent?.split(" ") ?? [];
  let accentStart = -1;
  if (accentWords.length > 0) {
    for (let i = 0; i + accentWords.length <= words.length; i++) {
      if (accentWords.every((w, j) => words[i + j] === w)) {
        accentStart = i;
        break;
      }
    }
  }
  const isAccent = (i: number) =>
    accentStart >= 0 && i >= accentStart && i < accentStart + accentWords.length;

  return (
    <h1 ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true">
          <span className="inline-block overflow-hidden pb-1 align-bottom">
            <span
              data-word
              className={isAccent(i) ? "text-gradient inline-block will-change-transform" : "inline-block will-change-transform"}
            >
              {word}
            </span>
          </span>{" "}
        </span>
      ))}
    </h1>
  );
}
