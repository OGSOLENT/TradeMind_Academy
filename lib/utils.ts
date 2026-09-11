/**
 * Join class names and drop the falsy ones. Deliberately tiny. The design
 * system avoids conflicting utility stacks, so I never needed tailwind-merge.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Clamp a number to the range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Turn a heading into an id: "OHLC — the foundation" becomes "ohlc-the-foundation". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
