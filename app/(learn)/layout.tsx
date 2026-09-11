"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/shell/app-shell";
import { AmbientBackground } from "@/components/shell/ambient-background";
import { Toaster } from "@/components/ui/toast";
import { useAuth } from "@/lib/firebase/auth-context";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";

/**
 * The learn-area guard. You have to be signed in AND have given consent to
 * get past this, because that's the research ethics gate.
 */
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Quiz sessions run in focus mode. No nav chrome, nothing but the question.
  const focusMode = pathname.startsWith("/quiz");
  const { user, loading } = useAuth();

  const { data: profile, isPending } = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: !!user,
    queryFn: () => getUserProfile(getFirebase().db, user!.uid),
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
    if (user && !isPending && !profile?.consent) router.replace("/consent");
  }, [loading, user, isPending, profile, router]);

  // I render the children straight away. Every page shows its own skeleton
  // while auth resolves, so the profile check and the page data load in
  // PARALLEL instead of one after the other. That change alone halved the
  // dashboard LCP in the Phase 6 audit. The redirect effect above still
  // enforces the auth and consent gate, and every data query is keyed on
  // `user`, so nothing fetches while you're signed out.
  if (focusMode) {
    return (
      <div data-drawer-scale className="min-h-dvh">
        {/* Focus mode gets a still, half-strength field. Anything drifting
            next to a question would contaminate the response latency I log. */}
        <AmbientBackground variant="calm" />
        {children}
        <Toaster />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
