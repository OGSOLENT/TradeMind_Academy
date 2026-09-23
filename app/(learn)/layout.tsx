"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/shell/app-shell";
import { AmbientBackground } from "@/components/shell/ambient-background";
import { Toaster, toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/firebase/auth-context";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";
import { reconcileMastery } from "@/lib/firebase/mastery";
import { COURSE_ID } from "@/lib/constants";

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

  // Once per visit, check that every finished session made it into the
  // learner model, and rebuild the model from the response log if one
  // didn't (lib/firebase/mastery.ts). Almost always a no-op.
  const queryClient = useQueryClient();
  const reconciled = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !profile?.consent || reconciled.current === user.uid) return;
    reconciled.current = user.uid;
    reconcileMastery(getFirebase().db, user.uid, COURSE_ID)
      .then((repaired) => {
        if (repaired === 0) return;
        void queryClient.invalidateQueries();
        toast({
          title: "Progress restored",
          description: `${repaired} session${repaired === 1 ? "" : "s"} that didn't save last time ${repaired === 1 ? "has" : "have"} been added back from your answers.`,
          variant: "success",
        });
      })
      .catch((err) => console.warn("[mastery] reconciliation skipped", err));
  }, [user, profile?.consent, queryClient]);

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
