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
