"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/shell/app-shell";
import { Toaster } from "@/components/ui/toast";
import { useAuth } from "@/lib/firebase/auth-context";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";

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

  // Render children immediately — pages show their own skeletons while auth
  // resolves, so the profile check and page data load in PARALLEL instead of
  // chaining (this halved dashboard LCP in the Phase 6 audit). The redirect
  // effect above still enforces the auth + consent gate; data queries are
  // all keyed on `user` and fetch nothing while signed out.
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
