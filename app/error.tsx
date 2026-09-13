"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AmbientBackground } from "@/components/shell/ambient-background";

/**
 * The error boundary for every route. Without this, a thrown render error
 * shows Next's own grey screen, which isn't what a participant should ever
 * see. This one says what happened in plain words, offers a retry (Next
 * re-renders the segment) and a way home, and logs the real error to the
 * console so I can see it. Nothing the learner did is lost: the response
 * log is append-only and already saved by the time anything can render.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset(): void }) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <AmbientBackground variant="calm" />
      <Card level="elevated" className="max-w-md p-8 text-center">
        <p className="num text-label-caps uppercase tracking-[0.25em] text-fg-muted">
          something broke
        </p>
        <h1 className="mt-3 text-headline-md text-fg-primary">This page hit an error</h1>
        <p className="mt-2 text-body-base text-fg-secondary">
          Your answers are already saved, so nothing is lost. Try the page again, and if it
          keeps happening head back to the dashboard.
        </p>
        {error.digest && (
          <p className="num mt-3 text-xs text-fg-muted">reference {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/dashboard">
            <Button variant="secondary">Go to dashboard</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
