"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * A SplitText-style headline built on GSAP core only, because the paid plugin
 * is off limits (guardrail 7.7). My little splitter wraps each word in an
 * overflow-hidden span, and the words rise in on the choreo ease. Under
 * reduced motion it's a plain fade.
 *
 * `accent` is an optional phrase from the text that gets the gradient. I
 * match it by word position so the split stays intact.
 */
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
  // Find where the accent phrase starts so I can flag those word indices.
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
        // The joining space has to live OUTSIDE the overflow-hidden span, or
        // it collapses and the words run into each other.
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
