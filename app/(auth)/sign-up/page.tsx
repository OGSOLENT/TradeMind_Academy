"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { signInWithGoogle } from "@/lib/firebase/google";
import { createUserProfile, getUserProfile } from "@/lib/firebase/repos";
import { defaultSettings } from "@/lib/firebase/types";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { PasswordStrength, scorePassword } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export default function SignUpPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; adult?: string }>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (scorePassword(password) < 2)
      next.password = "Choose a stronger password (12+ characters help).";
    if (!isAdult) next.adult = "TradeMind Academy is for adults (18+) only.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const { auth, db } = getFirebase();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const name = displayName.trim() || email.split("@")[0] || "Learner";
      await updateProfile(cred.user, { displayName: name });
      await createUserProfile(db, cred.user.uid, name, true);
      // I prime the shared profile cache here on purpose. The root
      // SettingsApplier races this write on real network latency, and without
      // this it would cache null for 60 seconds and the consent page would
      // ask for the 18+ attestation all over again.
      queryClient.setQueryData(["profile", cred.user.uid], {
        displayName: name,
        createdAt: new Date(),
        consent: null,
        isAdult: true,
        settings: defaultSettings,
      });
      router.push("/consent");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setErrors({
        email:
          code === "auth/email-already-in-use"
            ? "An account with this email already exists."
            : "Sign-up failed — check the email address and try again.",
      });
      setBusy(false);
    }
  }

  // Google goes through the same 18+ gate as the form. The Firestore rule
  // refuses any profile without isAdult=true, so the checkbox has to be
  // ticked before the popup opens. A returning Google user already has a
  // profile and skips creation entirely.
  async function onGoogle() {
    if (!isAdult) {
      setErrors({ adult: "Please confirm you are 18 or older before continuing with Google." });
      return;
    }
    setErrors({});
    setBusy(true);
    const { auth, db } = getFirebase();
    const result = await signInWithGoogle(auth);
    if (!result.ok) {
      toast({
        title:
          result.reason === "cancelled"
            ? "Google sign-up was cancelled"
            : "Google sign-up didn't work",
        description: result.reason === "cancelled" ? undefined : result.message,
        variant: result.reason === "cancelled" ? "warning" : "danger",
      });
      setBusy(false);
      return;
    }
    const { user } = result;
    try {
      const existing = await getUserProfile(db, user.uid);
      if (existing) {
        router.push(existing.consent ? "/dashboard" : "/consent");
        return;
      }
      const name = user.displayName?.trim() || user.email?.split("@")[0] || "Learner";
      await createUserProfile(db, user.uid, name, true);
      queryClient.setQueryData(["profile", user.uid], {
        displayName: name,
        createdAt: new Date(),
        consent: null,
        isAdult: true,
        settings: defaultSettings,
      });
      router.push("/consent");
    } catch {
      toast({
        title: "Could not create your profile",
        description: "Please try again.",
        variant: "danger",
      });
      setBusy(false);
    }
  }

  return (
    <Card level="elevated" className="p-8">
      <h1 className="text-headline-md text-fg-primary">Create your account</h1>
      <p className="mt-1 text-sm text-fg-secondary">
        Education only, on simulated data. No live trading, ever.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Display name"
          autoComplete="nickname"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <div className="space-y-2">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />
          <PasswordStrength password={password} />
        </div>

        <label className="-mx-2 flex min-h-11 cursor-pointer items-start gap-3 rounded-control p-2 hover:bg-white/5">
          <input
            type="checkbox"
            checked={isAdult}
            onChange={(e) => setIsAdult(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#5e6ad2]"
            aria-describedby={errors.adult ? "adult-error" : undefined}
          />
          <span className="text-sm text-fg-secondary">
            I confirm I am <span className="text-fg-primary">18 or older</span> and understand this
            platform is for education only.
          </span>
        </label>
        {errors.adult && (
          <p id="adult-error" role="alert" className="text-sm text-danger">
            {errors.adult}
          </p>
        )}

        <Button type="submit" loading={busy} className="w-full">
          Create account
        </Button>
      </form>

      <OrDivider />

      <GoogleButton onClick={onGoogle} disabled={busy}>
        Sign up with Google
      </GoogleButton>

      <p className="mt-6 text-center text-sm text-fg-secondary">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent-bright hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
