"use client";

import { useEffect, useState } from "react";

/**
 * True once the page has scrolled past `threshold` pixels. I use it to let
 * the glass navs firm up a little (darker, with a shadow) once content is
 * sliding underneath them. Passive listener, and it checks on mount so a
 * refreshed page mid-scroll doesn't start in the wrong state.
 */
export function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const check = () => setScrolled(window.scrollY > threshold);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [threshold]);
  return scrolled;
}
