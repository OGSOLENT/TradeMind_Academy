"use client";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

interface McqProps {
  options: string[];
  selected: number | null;
  onSelect(i: number): void;
  disabled?: boolean;
  /** Once graded, which index was correct. It drives the reveal styling. */
  reveal?: { correct: number; chosen: number } | null;
  /** multi mode uses checkbox semantics instead of radio. */
  multi?: boolean;
  selectedMulti?: number[];
  onToggle?(i: number): void;
}

/** The option list shared by MCQ and multi-select. */
export function McqOptions({
  options,
  selected,
  onSelect,
  disabled,
  reveal,
  multi = false,
  selectedMulti = [],
  onToggle,
}: McqProps) {
  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-label="Answer options"
      className="space-y-2"
    >
      {options.map((opt, i) => {
        const chosen = multi ? selectedMulti.includes(i) : selected === i;
        const isCorrect = reveal && reveal.correct === i;
        const isWrongChoice = reveal && chosen && reveal.correct !== i;
        return (
          <button
            key={i}
            role={multi ? "checkbox" : "radio"}
            aria-checked={chosen}
            disabled={disabled}
            onClick={() => (multi ? onToggle?.(i) : onSelect(i))}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-control px-4 py-3 text-left text-sm transition-[color,background-color,box-shadow,transform] duration-200",
              chosen ? "text-fg-primary" : "text-fg-secondary",
              !disabled && "hover:translate-x-0.5 hover:bg-white/5",
              !reveal && chosen && "bg-accent/15 shadow-[inset_0_0_0_1px_var(--accent)]",
              !reveal && !chosen && "shadow-hairline",
              isCorrect && "bg-mastery/10 text-fg-primary shadow-[inset_0_0_0_1px_var(--mastery)]",
              isWrongChoice && "bg-warning/10 shadow-[inset_0_0_0_1px_var(--warning)]",
              reveal && !isCorrect && !isWrongChoice && "opacity-60 shadow-hairline",
            )}
          >
            <Kbd>{i + 1}</Kbd>
            <span className="flex-1">{opt}</span>
            {multi && (
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border text-xs",
                  chosen ? "border-accent bg-accent text-white" : "border-white/20",
                )}
              >
                {chosen ? "✓" : ""}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
