"use client";

import { useTitle } from "@/lib/use-title";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUser, sendEmailVerification } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";
import { useAuth } from "@/lib/firebase/auth-context";
import { applyPersistence, readKeepSignedIn } from "@/lib/firebase/persistence";
import type { UserSettings } from "@/lib/firebase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Kbd } from "@/components/ui/kbd";
import { ShortcutsSheet } from "@/components/shell/shortcuts-sheet";

/** A mini candle pair drawn from the live CSS vars. This is the colour-blind preview. */
function CandlePreview() {
  return (
    <svg width="72" height="44" viewBox="0 0 72 44" aria-hidden="true" className="shrink-0">
      <line x1="16" y1="2" x2="16" y2="42" stroke="var(--bull)" strokeWidth="2" />
      <rect x="8" y="12" width="16" height="20" rx="2" fill="var(--bull)" />
      <line x1="52" y1="2" x2="52" y2="42" stroke="var(--bear)" strokeWidth="2" />
      <rect x="44" y="10" width="16" height="22" rx="2" fill="var(--bear)" />
    </svg>
  );
}

/** A two-word sample in the readable typeface, so the choice is visible before it's made. */
function FontPreview() {
  return (
    <span
      aria-hidden="true"
      className="hidden shrink-0 rounded-control bg-white/[0.04] px-3 py-1.5 text-sm text-fg-primary shadow-hairline sm:inline-block"
      style={{ fontFamily: "var(--font-atkinson), system-ui, sans-serif" }}
    >
      Il1 O0 rn
    </span>
  );
}

/** A small heading inside the accessibility card. */
function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="pb-1 pt-4 text-label-caps uppercase tracking-[0.18em] text-fg-muted">{children}</p>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  preview,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange(v: boolean): void;
  preview?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="font-medium text-fg-primary">{label}</p>
        <p className="mt-0.5 text-sm text-fg-secondary">{description}</p>
      </div>
      <div className="flex items-center gap-4">
        {preview}
        <button
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative flex h-7 w-12 shrink-0 items-center rounded-pill px-1 transition-[background-color,box-shadow] duration-200",
            checked ? "bg-accent shadow-[0_0_14px_var(--accent-glow)]" : "bg-white/10",
          )}
        >
          {/* The knob springs across instead of sliding on a linear tween. */}
          <motion.span
            layout
            transition={spring.ui}
            className={cn("h-5 w-5 rounded-pill bg-white shadow-sm", checked && "ml-auto")}
          />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  useTitle("Settings");
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  // Device-level, not on the profile: whether the session outlives the browser.
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  useEffect(() => setKeepSignedIn(readKeepSignedIn()), []);

  const { data: profile, isPending } = useQuery({
    queryKey: ["profile", user?.uid],
    enabled: !!user,
    queryFn: () => getUserProfile(getFirebase().db, user!.uid),
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<UserSettings>) => {
      const { db } = getFirebase();
      const next = { ...profile!.settings, ...patch };
      await updateDoc(doc(db, "users", user!.uid), { settings: next });
      return next;
    },
    onMutate: async (patch) => {
      // Optimistic update, because the SettingsApplier reads this cache.
      queryClient.setQueryData(["profile", user?.uid], (old: unknown) =>
        old && typeof old === "object"
          ? { ...old, settings: { ...(old as { settings: UserSettings }).settings, ...patch } }
          : old,
      );
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", user?.uid] });
      toast({ title: "Could not save settings", variant: "danger" });
    },
  });

  async function downloadMyData() {
    if (!user) return;
    const { db } = getFirebase();
    const sessions = await getDocs(collection(db, "users", user.uid, "sessions"));
    const rows: string[] = [
      "sessionId,sessionType,responseId,itemId,kcId,questionType,correct,selected,latencyMs,pLBefore,pLAfter,ts",
    ];
    for (const session of sessions.docs) {
      const responses = await getDocs(
        collection(db, "users", user.uid, "sessions", session.id, "responses"),
      );
      for (const r of responses.docs) {
        const d = r.data();
        const selected = JSON.stringify(d.selected).replaceAll('"', '""');
        rows.push(
          `${session.id},${session.data().type},${r.id},${d.itemId},${d.kcId},${d.questionType},${d.correct},"${selected}",${d.latencyMs},${d.pLBefore},${d.pLAfter},${d.ts}`,
        );
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trademind-my-data.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported", description: `${rows.length - 1} responses downloaded.`, variant: "success" });
  }

  function armDelete() {
    setDeleteOpen(false);
    setDeleteText("");
    setCountdown(5);
  }

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      void (async () => {
        try {
          const { db, auth } = getFirebase();
          await deleteDoc(doc(db, "users", user!.uid));
          if (auth.currentUser) await deleteUser(auth.currentUser);
          queryClient.clear();
          router.push("/");
        } catch {
          toast({
            title: "Deletion failed",
            description: "Sign in again and retry — recent login is required.",
            variant: "danger",
          });
          setCountdown(null);
        }
      })();
      return;
    }
    deleteTimer.current = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
    };
  }, [countdown, user, router, queryClient]);

  if (isPending || !profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  const s = profile.settings;

  return (
    <Stagger className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-headline-md text-fg-primary">Settings</h1>
        <p className="mt-1 text-sm text-fg-secondary">
          Accessibility, your data, and your account. Every change saves as you make it.
        </p>
      </div>

      <Card id="accessibility" level="elevated" className="scroll-mt-28 px-6 py-2">
        <GroupHeading>Seeing</GroupHeading>
        <div className="divide-y divide-white/5">
          <Toggle
            label="Colour-blind candles"
            description="Swap teal/red candles for blue/orange across every chart."
            checked={s.colorBlindCandles}
            onChange={(v) => update.mutate({ colorBlindCandles: v })}
            preview={<CandlePreview />}
          />
          <Toggle
            label="High contrast"
            description="White text on true black, solid panels, visible borders, underlined links."
            checked={!!s.highContrast}
            onChange={(v) => update.mutate({ highContrast: v })}
          />
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-medium text-fg-primary">Font scale</p>
              <p className="mt-0.5 text-sm text-fg-secondary">Applies across the whole app.</p>
            </div>
            <div role="radiogroup" aria-label="Font scale" className="flex gap-1.5">
              {([1, 1.15, 1.3] as const).map((scale) => (
                <button
                  key={scale}
                  role="radio"
                  aria-checked={s.fontScale === scale}
                  onClick={() => update.mutate({ fontScale: scale })}
                  className={cn(
                    "num min-h-11 rounded-control px-3 text-sm transition-[color,background-color,box-shadow] duration-200",
                    s.fontScale === scale
                      ? "bg-accent/15 text-accent-bright shadow-[inset_0_0_0_1px_var(--accent),0_0_14px_var(--accent-glow)]"
                      : "text-fg-secondary shadow-hairline hover:bg-white/5",
                  )}
                >
                  {scale === 1 ? "100%" : scale === 1.15 ? "115%" : "130%"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <GroupHeading>Reading</GroupHeading>
        <div className="divide-y divide-white/5">
          <Toggle
            label="Readable typeface"
            description="Atkinson Hyperlegible, designed so similar letters can't be confused."
            checked={!!s.readableFont}
            onChange={(v) => update.mutate({ readableFont: v })}
            preview={<FontPreview />}
          />
          <Toggle
            label="Comfortable reading"
            description="Looser line spacing and a shorter line length in lessons."
            checked={!!s.comfortableReading}
            onChange={(v) => update.mutate({ comfortableReading: v })}
          />
        </div>

        <GroupHeading>Motion and noise</GroupHeading>
        <div className="divide-y divide-white/5">
          <Toggle
            label="Reduce motion"
            description="Collapse animations to quick fades, independent of your OS setting."
            checked={s.reducedMotion}
            onChange={(v) => update.mutate({ reducedMotion: v })}
          />
          <Toggle
            label="Calm mode"
            description="Switch off the background field, the particles and the 3D scenes. The numbers stay."
            checked={!!s.calmMode}
            onChange={(v) => update.mutate({ calmMode: v })}
          />
        </div>

        <GroupHeading>Keyboard</GroupHeading>
        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="font-medium text-fg-primary">Shortcuts</p>
            <p className="mt-0.5 text-sm text-fg-secondary">
              Everything works without a mouse. Press <Kbd>?</Kbd> anywhere for the list.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setShortcutsOpen(true)}>
            Show shortcuts
          </Button>
        </div>
      </Card>

      <Card id="data" level="elevated" className="scroll-mt-28 space-y-4 p-6">
        <h2 className="text-body-base font-medium text-fg-primary">Your data</h2>
        <p className="text-sm text-fg-secondary">
          Everything the tutor has recorded about your learning, as CSV — the
          same rows the research analysis uses.
        </p>
        <Button variant="secondary" onClick={downloadMyData}>
          Download my data
        </Button>
      </Card>

      <Card id="account" level="elevated" className="scroll-mt-28 divide-y divide-white/5 px-6 py-2">
        {user && !user.emailVerified && user.providerData.some((p) => p.providerId === "password") && (
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-medium text-fg-primary">Email not verified</p>
              <p className="mt-0.5 text-sm text-fg-secondary">
                We sent a link to {user.email}. Verifying lets you reset your password later.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await sendEmailVerification(user);
                  toast({ title: "Verification email sent", description: `Check ${user.email}.`, variant: "success" });
                } catch {
                  toast({ title: "Couldn't send it just now", description: "Try again in a minute.", variant: "warning" });
                }
              }}
            >
              Resend
            </Button>
          </div>
        )}
        <Toggle
          label="Stay signed in on this device"
          description="Off means you're signed out when the browser closes. Use that on a shared computer."
          checked={keepSignedIn}
          onChange={async (v) => {
            setKeepSignedIn(v);
            await applyPersistence(getFirebase().auth, v);
            toast({
              title: v ? "You'll stay signed in here" : "You'll be signed out when the browser closes",
              variant: "success",
            });
          }}
        />
      </Card>

      <Card level="elevated" className="space-y-4 p-6">
        <h2 className="text-body-base font-medium text-danger">Delete account</h2>
        <p className="text-sm text-fg-secondary">
          Removes your account and profile immediately; your anonymised
          response log is purged from the research set on request.
        </p>
        {countdown !== null ? (
          <div className="flex items-center gap-4">
            <p className="num text-sm text-warning">Deleting in {countdown}s…</p>
            <Button
              variant="secondary"
              onClick={() => {
                if (deleteTimer.current) clearTimeout(deleteTimer.current);
                setCountdown(null);
                toast({ title: "Deletion cancelled", variant: "success" });
              }}
            >
              Undo
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete my account
          </Button>
        )}
      </Card>

      <ShortcutsSheet open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account?">
        <p className="text-sm text-fg-secondary">
          Type <span className="num text-danger">DELETE</span> to confirm. You&apos;ll have five
          seconds to undo.
        </p>
        <div className="mt-4">
          <Input label="Type DELETE" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={deleteText !== "DELETE"} onClick={armDelete}>
            Delete account
          </Button>
        </div>
      </Modal>
    </Stagger>
  );
}
