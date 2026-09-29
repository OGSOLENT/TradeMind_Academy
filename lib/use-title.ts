"use client";

import { useEffect } from "react";

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
