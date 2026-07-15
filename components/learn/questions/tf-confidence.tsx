"use client";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

interface TfProps {
  value: boolean | null;
  confidence: number; // 50–100
  onChange(value: boolean | null, confidence: number): void;
  disabled?: boolean;
}

const DETENTS = [50, 60, 70, 80, 90, 100];

/** True/False with a detented confidence slider (logged, not graded). */
export function TfConfidence({ value, confidence, onChange, disabled }: TfProps) {
  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label="True or false" className="grid grid-cols-2 gap-3">
        {([true, false] as const).map((v, i) => (
          <button
            key={String(v)}
            role="radio"
            aria-checked={value === v}
            disabled={disabled}
            onClick={() => onChange(v, confidence)}
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors duration-200",
              value === v
                ? "bg-accent/15 text-fg-primary shadow-[inset_0_0_0_1px_var(--accent)]"
                : "text-fg-secondary shadow-hairline hover:bg-white/5",
            )}
          >
            <Kbd>{i + 1}</Kbd>
            {v ? "True" : "False"}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="confidence" className="text-label-caps uppercase tracking-wider text-fg-secondary">
            How confident are you?
          </label>
          <span className="num text-sm text-accent-bright">{confidence}%</span>
        </div>
        <input
          id="confidence"
          type="range"
          min={50}
          max={100}
          step={10}
          list="confidence-detents"
          value={confidence}
          disabled={disabled}
          onChange={(e) => onChange(value, Number(e.target.value))}
          className="mt-3 h-11 w-full accent-[#5e6ad2]"
        />
        <datalist id="confidence-detents">
          {DETENTS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
        <div className="flex justify-between text-xs text-fg-muted" aria-hidden="true">
          <span>Coin flip</span>
          <span>Certain</span>
        </div>
      </div>
    </div>
  );
}
