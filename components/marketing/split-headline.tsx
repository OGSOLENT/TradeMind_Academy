"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * SplitText-style headline using GSAP core only (the paid plugin is off
 * limits — §7.7). A tiny splitter wraps each word in an overflow-hidden
 * span; words rise in with the choreo ease. Reduced motion: simple fade.
 */
export function SplitHeadline({ text, className }: { text: string; className?: string }) {
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

  return (
    <h1 ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        // The joining space must live OUTSIDE the overflow-hidden span or it
        // collapses and the words run together.
        <span key={i} aria-hidden="true">
          <span className="inline-block overflow-hidden pb-1 align-bottom">
            <span data-word className="inline-block will-change-transform">
              {word}
            </span>
          </span>{" "}
        </span>
      ))}
    </h1>
  );
}
