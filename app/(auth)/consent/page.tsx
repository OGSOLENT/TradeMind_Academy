"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { createUserProfile, getUserProfile, recordConsent } from "@/lib/firebase/repos";
import { CONSENT_VERSION } from "@/lib/firebase/types";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

const FIRST_LESSON = "/lesson/kc-candlestick-anatomy-lesson";

export default function ConsentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [isAdult, setIsAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);

  const { data: profile, isPending } = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: !!user,
    queryFn: () => getUserProfile(getFirebase().db, user!.uid),
  });

  if (!loading && !user && !declining) {
    router.replace("/sign-in");
    return null;
  }

  const needsAdultCheck = !isPending && !profile?.isAdult;
  const canAccept = !isPending && (profile?.isAdult || isAdult);

  async function onAccept() {
    if (!user) return;
    setBusy(true);
    const { db } = getFirebase();
    try {
      if (!profile) {
        const name = user.displayName ?? user.email?.split("@")[0] ?? "Learner";
        await createUserProfile(db, user.uid, name, true);
      }
      await recordConsent(db, user.uid);
      // The learn-area guard reads this query. Write the consent into the
      // cache SYNCHRONOUSLY — an invalidate-refetch races the navigation and
      // the stale consent:null profile bounces the user straight back here.
      queryClient.setQueryData(["profile", user.uid], (old: unknown) => ({
        ...(typeof old === "object" && old !== null ? old : {}),
        isAdult: true,
        consent: { agreedAt: new Date(), version: CONSENT_VERSION },
      }));
      router.push(FIRST_LESSON);
    } catch {
      toast({ title: "Could not save your consent", description: "Please try again.", variant: "danger" });
      setBusy(false);
    }
  }

  async function onDecline() {
    setDeclining(true);
    const { auth } = getFirebase();
    await signOut(auth);
    queryClient.clear();
    toast({
      title: "No problem",
      description: "Nothing was stored beyond your account. You can return anytime.",
    });
    router.push("/");
  }

  return (
    <Card level="elevated" className="p-8">
      <h1 className="text-headline-md text-fg-primary">Research participation & data</h1>

      <div className="mt-4 space-y-4 text-sm leading-6 text-fg-secondary">
        <p>
          TradeMind Academy is a university research artefact (BSc dissertation, Solent
          University). To evaluate how well the adaptive tutor works, the app records your
          learning interactions:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>your answers to questions, response times, and estimated skill mastery;</li>
          <li>your display name and email, used only to operate your account;</li>
          <li>no financial data — every chart and price in the app is simulated.</li>
        </ul>
        <p>
          Under UK GDPR the lawful basis is your <span className="text-fg-primary">consent</span>.
          Interaction data is analysed in anonymised form for the dissertation evaluation. You can
          download your data or delete your account (and all associated data) at any time from
          Settings, and you may withdraw consent without giving a reason.
        </p>
        <p>
          This platform teaches concepts using simulated markets. It provides{" "}
          <span className="text-fg-primary">no financial advice, no signals, and no live trading</span>.
          It is available only to adults (18+).
        </p>
      </div>

      {needsAdultCheck && (
        <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3 rounded-control p-2 -mx-2 hover:bg-white/5">
          <input
            type="checkbox"
            checked={isAdult}
            onChange={(e) => setIsAdult(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#5e6ad2]"
          />
          <span className="text-sm text-fg-secondary">
            I confirm I am <span className="text-fg-primary">18 or older</span>.
          </span>
        </label>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
        <Button onClick={onAccept} loading={busy} disabled={!canAccept} className="flex-1">
          I consent — start learning
        </Button>
        <Button variant="secondary" onClick={onDecline} disabled={busy} className="flex-1">
          Decline
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-fg-secondary">
        Declining signs you out; no learning data is collected.
      </p>
    </Card>
  );
}
