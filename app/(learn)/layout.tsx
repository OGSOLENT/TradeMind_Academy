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

  if (focusMode) {
    return (
      <div data-drawer-scale className="min-h-dvh">
        <AmbientBackground variant="calm" />
        {children}
        <Toaster />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
