"use client";

import { Reorder, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrderingProps {
  entries: string[];
  /** The current order, as indices into entries. */
  order: number[];
  onChange(order: number[]): void;
  disabled?: boolean;
}

/**
 * Drag to reorder, with spring layout from framer-motion's Reorder. Each row
 * also has move up and move down buttons for the keyboard, because dragging
 * is never allowed to be the only way.
 */
export function OrderingList({ entries, order, onChange, disabled }: OrderingProps) {
  const reduced = useReducedMotion();

  const move = (from: number, delta: number) => {
    const to = from + delta;
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const tmp = next[from]!;
    next[from] = next[to]!;
    next[to] = tmp;
    onChange(next);
  };

  return (
    <Reorder.Group
      axis="y"
      values={order}
      onReorder={(next) => !disabled && onChange(next as number[])}
      className="space-y-2"
    >
      {order.map((entryIndex, position) => (
        <Reorder.Item
          key={entryIndex}
          value={entryIndex}
          drag={disabled || reduced ? false : "y"}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-control bg-bg-elevated px-4 py-3 text-sm text-fg-primary shadow-edge-lit",
            !disabled && "cursor-grab active:cursor-grabbing",
          )}
        >
          <span className="num w-5 text-fg-muted" aria-hidden="true">
            {position + 1}
          </span>
          <span className="flex-1">{entries[entryIndex]}</span>
          <span className="flex gap-1">
            <button
              aria-label={`Move "${entries[entryIndex]}" up`}
              disabled={disabled || position === 0}
              onClick={() => move(position, -1)}
              className="flex h-8 w-8 items-center justify-center rounded text-fg-secondary hover:bg-white/10 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              aria-label={`Move "${entries[entryIndex]}" down`}
              disabled={disabled || position === order.length - 1}
              onClick={() => move(position, 1)}
              className="flex h-8 w-8 items-center justify-center rounded text-fg-secondary hover:bg-white/10 disabled:opacity-30"
            >
              ↓
            </button>
          </span>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
