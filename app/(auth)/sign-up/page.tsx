"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getFirebase } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firebase/repos";
import { defaultSettings } from "@/lib/firebase/types";
import { PasswordStrength, scorePassword } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    if (scorePassword(password) < 2) next.password = "Choose a stronger password (12+ characters help).";
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
      // Prime the shared profile cache: the root SettingsApplier races this
      // write on real-network latency and would otherwise cache null for 60s,
      // making the consent page demand a redundant 18+ re-attestation.
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

        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control p-2 -mx-2 hover:bg-white/5">
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

      <p className="mt-6 text-center text-sm text-fg-secondary">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent-bright hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
