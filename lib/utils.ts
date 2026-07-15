/**
 * Join class names, dropping falsy values. Deliberately tiny — the design
 * system avoids conflicting utility stacks, so no tailwind-merge dependency.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
