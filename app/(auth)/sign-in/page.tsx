"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";
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

  async function afterAuth(uid: string) {
    const { db } = getFirebase();
    const profile = await getUserProfile(db, uid);
    router.push(profile?.consent ? "/lesson/kc-candlestick-anatomy-lesson" : "/consent");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { auth } = getFirebase();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await afterAuth(cred.user.uid);
    } catch {
      setError("That email and password combination didn't work.");
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    try {
      const { auth } = getFirebase();
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await afterAuth(cred.user.uid);
    } catch {
      toast({ title: "Google sign-in was cancelled", variant: "warning" });
      setBusy(false);
    }
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
      <p className="mt-1 text-sm text-fg-secondary">
        Enter your credentials to continue learning.
      </p>

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
        <Button type="submit" loading={busy} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-hair" />
        <span className="text-label-caps uppercase tracking-wider text-fg-muted">or</span>
        <span className="h-px flex-1 bg-hair" />
      </div>

      <Button variant="secondary" className="w-full" onClick={onGoogle} disabled={busy}>
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-fg-secondary">
        New here?{" "}
        <Link href="/sign-up" className="text-accent-bright hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
