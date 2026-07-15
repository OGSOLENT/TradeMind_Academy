"use client";

import { cn } from "@/lib/utils";

/**
 * Heuristic strength score 0–4 (length, case mix, digits, symbols).
 * Deliberately dependency-free; this is UI guidance, not the validator —
 * Firebase Auth enforces the minimum server-side.
 */
export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];
const tones = [
  "bg-danger",
  "bg-danger",
  "bg-warning",
  "bg-accent",
  "bg-mastery",
];

export function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);
  return (
    <div aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-pill transition-colors duration-300",
              i < score ? tones[score] : "bg-white/10",
            )}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="mt-1.5 text-xs text-fg-secondary">
          Password strength: <span className="text-fg-primary">{labels[score]}</span>
        </p>
      )}
    </div>
  );
}
