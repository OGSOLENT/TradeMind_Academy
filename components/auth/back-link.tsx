"use client";

import Link from "next/link";

/** The way back from the auth pages. Always to the front page, so it's predictable. */
export function BackLink({ label = "Back to home" }: { label?: string }) {
  return (
    <Link
      href="/"
      className="group inline-flex min-h-11 items-center gap-2 rounded-control pr-3 text-sm text-fg-secondary transition-colors hover:text-fg-primary"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-pill bg-white/5 shadow-hairline transition-[transform,background-color] duration-200 group-hover:-translate-x-0.5 group-hover:bg-white/10"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      </span>
      {label}
    </Link>
  );
}
