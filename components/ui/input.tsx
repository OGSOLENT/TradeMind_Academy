"use client";

import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  hint?: string;
  error?: string;
}

/**
 * Text input with floating label (per auth_sign_in prototype). The label sits
 * as placeholder text and rises to a caps micro-label when focused or filled.
 * Inputs are darker than their card (bg-deep) with a hairline that becomes
 * the accent on focus; errors switch it to soft danger — never harsh red.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id: idProp, onFocus, onBlur, onChange, defaultValue, value, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const [focused, setFocused] = useState(false);
  const [filled, setFilled] = useState(Boolean(defaultValue ?? value));
  const floating = focused || filled || Boolean(value);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={ref}
        id={id}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          setFilled(e.target.value.length > 0);
          onBlur?.(e);
        }}
        onChange={(e) => {
          setFilled(e.target.value.length > 0);
          onChange?.(e);
        }}
        className={cn(
          "peer h-14 w-full rounded-control bg-bg-deep px-4 pt-5 pb-1 text-body-base text-fg-primary",
          "shadow-hairline transition-shadow duration-200 focus:outline-none",
          error
            ? "shadow-[inset_0_0_0_1px_var(--danger)]"
            : "focus:shadow-[inset_0_0_0_1px_var(--accent)]",
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 transition-all duration-200",
          floating
            ? "top-1.5 text-label-caps uppercase tracking-wider"
            : "top-1/2 -translate-y-1/2 text-body-base",
          error ? "text-danger" : focused ? "text-accent-bright" : "text-fg-secondary",
        )}
      >
        {label}
      </label>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 px-1 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        // fg-secondary, not fg-muted: muted fails WCAG contrast for small text on bg-deep
        <p id={`${id}-hint`} className="mt-1.5 px-1 text-sm text-fg-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id: idProp, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <div className={cn("relative", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-label-caps uppercase tracking-wider",
          error ? "text-danger" : "text-fg-secondary",
        )}
      >
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-28 w-full rounded-control bg-bg-deep p-4 text-body-base text-fg-primary",
          "shadow-hairline transition-shadow duration-200 focus:outline-none",
          error
            ? "shadow-[inset_0_0_0_1px_var(--danger)]"
            : "focus:shadow-[inset_0_0_0_1px_var(--accent)]",
        )}
        {...props}
      />
      {error && (
        <p role="alert" className="mt-1.5 px-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
