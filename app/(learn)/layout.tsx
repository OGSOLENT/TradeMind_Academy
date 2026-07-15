"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/shell/app-shell";
import { Toaster } from "@/components/ui/toast";
import { useAuth } from "@/lib/firebase/auth-context";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";
import { Skeleton } from "@/components/ui/skeleton";

/** Learn-area guard: must be signed in AND consented (research ethics gate). */
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Quiz sessions run in focus mode: no nav chrome, nothing but the question.
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

  if (loading || !user || isPending || !profile?.consent) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-4 pt-8">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      </AppShell>
    );
  }

  if (focusMode) {
    return (
      <div data-drawer-scale className="min-h-dvh">
        {children}
        <Toaster />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
