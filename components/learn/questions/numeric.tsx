"use client";

import { Button } from "@/components/ui/button";
import { clamp } from "@/lib/utils";

interface NumericProps {
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number | null;
  onChange(v: number): void;
  disabled?: boolean;
}

/** Numeric answer with stepper buttons (44px targets). */
export function NumericInput({ unit, min, max, step, value, onChange, disabled }: NumericProps) {
  const v = value ?? min;
  const set = (next: number) => onChange(clamp(Math.round(next / step) * step, min, max));

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        size="md"
        aria-label={`Decrease by ${step}`}
        disabled={disabled || v <= min}
        onClick={() => set(v - step)}
      >
        −
      </Button>
      <label className="flex-1">
        <span className="sr-only">Numeric answer in {unit}</span>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          placeholder={`${min}–${max} ${unit}`}
          disabled={disabled}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            if (!Number.isNaN(parsed)) onChange(clamp(parsed, min, max));
          }}
          className="num h-12 w-full rounded-control bg-bg-deep px-4 text-center text-xl text-fg-primary shadow-hairline focus:shadow-[inset_0_0_0_1px_var(--accent)] focus:outline-none"
        />
      </label>
      <Button
        variant="secondary"
        size="md"
        aria-label={`Increase by ${step}`}
        disabled={disabled || v >= max}
        onClick={() => set(v + step)}
      >
        +
      </Button>
      <span className="num w-12 text-sm text-fg-secondary">{unit}</span>
    </div>
  );
}
