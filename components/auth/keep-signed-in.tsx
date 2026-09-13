"use client";

/**
 * The "keep me signed in" row on the sign-in and sign-up forms. Ticked by
 * default because most people are on their own device. The helper line
 * says what unticking actually does, so nobody has to guess.
 */
export function KeepSignedIn({ checked, onChange }: { checked: boolean; onChange(v: boolean): void }) {
  return (
    <label className="-mx-2 flex min-h-11 cursor-pointer items-start gap-3 rounded-control p-2 hover:bg-white/5">
      <input
        type="checkbox"
        name="keep-signed-in"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#5e6ad2]"
      />
      <span className="text-sm text-fg-secondary">
        <span className="text-fg-primary">Keep me signed in</span> on this device
        <span className="mt-0.5 block text-xs text-fg-muted">
          Untick on a shared computer. You&apos;ll be signed out when the browser closes.
        </span>
      </span>
    </label>
  );
}
