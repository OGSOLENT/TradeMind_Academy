"use client";

import { useEffect } from "react";

/**
 * Sets the browser tab title from a client page. The signed-in pages are
 * all client components, so they can't export Next's metadata; without
 * this every tab read "TradeMind Academy" and a learner with three lessons
 * open couldn't tell them apart.
 */
export function useTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} · TradeMind Academy`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
