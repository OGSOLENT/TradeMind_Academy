"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { getFirebase } from "@/lib/firebase/client";
import { signInWithGoogle } from "@/lib/firebase/google";
import { applyPersistence, readKeepSignedIn } from "@/lib/firebase/persistence";
import { getUserProfile } from "@/lib/firebase/repos";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { KeepSignedIn } from "@/components/auth/keep-signed-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The device remembers the last choice. Default is on.
  const [keep, setKeep] = useState(true);
  useEffect(() => setKeep(readKeepSignedIn()), []);

  async function afterAuth(uid: string) {
    const { db } = getFirebase();
    try {
      const profile = await getUserProfile(db, uid);
      router.push(profile?.consent ? "/dashboard" : "/consent");
    } catch (err) {
      // Auth succeeded and only the profile read failed, so send them on to
      // the consent screen, which can cope with a missing profile, and say why.
      console.error("[sign-in] profile read failed", err);
      toast({
        title: "Signed in, but your profile didn't load",
        description: describeFirebaseError(err),
        variant: "warning",
      });
      router.push("/consent");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { auth } = getFirebase();
      await applyPersistence(auth, keep);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await afterAuth(cred.user.uid);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(
        code === "auth/too-many-requests"
          ? "Too many attempts. Wait a minute, then try again."
          : code === "auth/network-request-failed"
            ? "Couldn't reach the sign-in service. Check your connection."
            : "That email and password combination didn't work.",
      );
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const { auth } = getFirebase();
    await applyPersistence(auth, keep);
    const result = await signInWithGoogle(auth);
    if (!result.ok) {
      toast({
        title:
          result.reason === "cancelled"
            ? "Google sign-in was cancelled"
            : "Google sign-in didn't work",
        description: result.reason === "cancelled" ? undefined : result.message,
        variant: result.reason === "cancelled" ? "warning" : "danger",
      });
      setBusy(false);
      return;
    }
    await afterAuth(result.user.uid);
  }

  async function onForgot() {
    if (!email) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    const { auth } = getFirebase();
    await sendPasswordResetEmail(auth, email);
    toast({ title: "Reset link sent", description: `Check ${email}.`, variant: "success" });
  }

  return (
    <Card level="elevated" className="p-8">
      <h1 className="text-headline-md text-fg-primary">Welcome back</h1>
      <p className="mt-1 text-sm text-fg-secondary">Enter your credentials to continue learning.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined}
          required
        />
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onForgot}
            className="rounded text-sm text-accent-bright hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <KeepSignedIn checked={keep} onChange={setKeep} />
        <Button type="submit" loading={busy} className="w-full">
          Sign in
        </Button>
      </form>

      <OrDivider />

      <GoogleButton onClick={onGoogle} disabled={busy} />

      <p className="mt-6 text-center text-sm text-fg-secondary">
        New here?{" "}
        <Link href="/sign-up" className="text-accent-bright hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
