"use client";

import { useTitle } from "@/lib/use-title";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MASTERY_THRESHOLD } from "@/lib/bkt";
import { getFirebase } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/repos";
import { useAuth } from "@/lib/firebase/auth-context";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Counter } from "@/components/ui/counter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { RhythmTrace } from "@/components/learn/rhythm-trace";
import { DownloadIcon, EyeIcon, GearIcon, ShieldIcon } from "@/components/learn/stat-icons";

const COURSE_ID = "trading-foundations";
const DAY_MS = 24 * 60 * 60 * 1000;

interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
}

export default function ProfilePage() {
  useTitle("Profile");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const reduced = useReducedMotion();

  const { data, isPending } = useQuery({
    queryKey: ["profile-page", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const { db } = getFirebase();
      const [profile, masterySnap, sessionsSnap] = await Promise.all([
        getUserProfile(db, user!.uid),
        getDoc(doc(db, "users", user!.uid, "mastery", COURSE_ID)),
        getDocs(collection(db, "users", user!.uid, "sessions")),
      ]);
      const kcStates = (masterySnap.data()?.kcs ?? {}) as Record<
        string,
        { pL: number; attempts: number }
      >;
      const sessions = sessionsSnap.docs.map((d) => ({
        type: d.data().type as string,
        startedAt: (d.data().startedAt?.toMillis?.() as number | undefined) ?? 0,
        ended: d.data().endedAt !== null,
      }));
      return { profile, kcStates, sessions };
    },
  });

  if (isPending || !data?.profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 pt-4">
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  const { profile, kcStates, sessions } = data;
  const mastered = Object.values(kcStates).filter((s) => s.pL >= MASTERY_THRESHOLD).length;
  const totalKcs = Object.keys(kcStates).length;
  const halfway = Math.max(4, Math.ceil(totalKcs / 2));
  const attempts = Object.values(kcStates).reduce((n, s) => n + s.attempts, 0);
  const activeDays = new Set(
    sessions.filter((s) => Date.now() - s.startedAt < 7 * DAY_MS).map((s) => Math.floor(s.startedAt / DAY_MS)),
  ).size;

  const badges: Badge[] = [
    {
      id: "calibrated",
      icon: "◉",
      title: "Calibrated",
      description: "Completed the placement test",
      earned: sessions.some((s) => s.type === "placement" && s.ended),
    },
    {
      id: "first-session",
      icon: "▶",
      title: "First steps",
      description: "Finished a practice session",
      earned: sessions.some((s) => s.type === "topic-test" && s.ended),
    },
    {
      id: "first-mastery",
      icon: "✦",
      title: "First mastery",
      description: "Took a topic past 80%",
      earned: mastered >= 1,
    },
    {
      id: "half-way",
      icon: "◈",
      title: "Halfway there",
      description: `Mastered ${halfway} Level-1 modules`,
      earned: mastered >= halfway,
    },
    {
      id: "hundred",
      icon: "Σ",
      title: "Century",
      description: "100 questions answered",
      earned: attempts >= 100,
    },
    {
      id: "streak",
      icon: "⚡",
      title: "In rhythm",
      description: "Active 3 days this week",
      earned: activeDays >= 3,
    },
  ];

  async function onSignOut() {
    const { auth } = getFirebase();
    await signOut(auth);
    queryClient.clear();
    router.push("/");
  }

  return (
    <Stagger className="mx-auto max-w-2xl space-y-6">
      <Card level="elevated" spotlight className="flex items-center gap-5 p-6">
        {/* The avatar. A slow conic ring turns behind the initial, which is
            the one bit of colour the profile card gets. */}
        <div aria-hidden="true" className="relative h-16 w-16 shrink-0">
          <span
            className="tm-spin-slow absolute -inset-[3px] rounded-pill"
            style={{
              background:
                "conic-gradient(from 0deg, var(--mastery) 0%, var(--accent) 40%, transparent 70%, var(--mastery) 100%)",
              WebkitMask: "radial-gradient(circle, transparent 60%, #000 62%)",
              mask: "radial-gradient(circle, transparent 60%, #000 62%)",
              opacity: 0.85,
            }}
          />
          <span className="flex h-full w-full items-center justify-center rounded-pill bg-bg-elevated text-2xl font-semibold text-accent-bright shadow-edge-lit">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-headline-md text-fg-primary">{profile.displayName}</h1>
          <p className="mt-0.5 text-sm text-fg-secondary">
            Learning since{" "}
            {profile.createdAt?.toDate?.().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }) ?? "recently"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="glass" size="sm" className="gap-1.5">
              <GearIcon width={16} height={16} />
              Settings
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Sessions", value: sessions.filter((s) => s.ended).length },
          { label: "Answers", value: attempts },
          { label: "Mastered", value: mastered },
        ].map(({ label, value }) => (
          <Card key={label} level="base" spotlight className="p-5 text-center">
            <p className="text-3xl text-fg-primary">
              <Counter value={value} />
            </p>
            <p className="mt-1 text-label-caps uppercase tracking-wider text-fg-secondary">{label}</p>
          </Card>
        ))}
      </div>

      <Card level="elevated" spotlight className="p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-body-base font-medium text-fg-primary">Your rhythm</h2>
          <span className="text-xs text-fg-secondary">sessions per week</span>
        </div>
        <div className="mt-4">
          <RhythmTrace sessionStarts={sessions.filter((s) => s.ended).map((s) => s.startedAt)} />
        </div>
      </Card>

      <Card level="elevated" className="p-6">
        <h2 className="text-body-base font-medium text-fg-primary">Badges</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((badge, i) => (
            <motion.li
              key={badge.id}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: badge.earned ? 1 : 0.4, y: 0 }}
              transition={{ ...spring.ui, delay: 0.25 + i * 0.05 }}
              whileHover={badge.earned && !reduced ? { y: -3, scale: 1.02 } : undefined}
              className={cn(
                "rounded-control p-4 text-center shadow-hairline transition-shadow duration-300",
                badge.earned && "bg-mastery/5 hover:shadow-[inset_0_0_0_1px_var(--mastery-glow),0_0_24px_-6px_var(--mastery-glow)]",
              )}
            >
              <p
                aria-hidden="true"
                className={cn(
                  "text-2xl",
                  badge.earned ? "text-mastery-bright drop-shadow-[0_0_10px_var(--mastery-glow)]" : "text-fg-muted",
                )}
              >
                {badge.icon}
              </p>
              <p className="mt-2 text-sm font-medium text-fg-primary">{badge.title}</p>
              <p className="mt-0.5 text-xs text-fg-secondary">{badge.description}</p>
              <span className="sr-only">{badge.earned ? "Earned" : "Not yet earned"}</span>
            </motion.li>
          ))}
        </ul>
      </Card>

      {/* The three doors into settings, each straight to its own section. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/settings#accessibility",
            title: "Accessibility",
            copy: "Colour-blind candles, reduced motion, font size.",
            Icon: EyeIcon,
            tone: "text-mastery-bright",
          },
          {
            href: "/settings#data",
            title: "Your data",
            copy: "Download everything the tutor has recorded.",
            Icon: DownloadIcon,
            tone: "text-accent-bright",
          },
          {
            href: "/settings#account",
            title: "Account",
            copy: "Delete your account, with five seconds to undo.",
            Icon: ShieldIcon,
            tone: "text-warning",
          },
        ].map(({ href, title, copy, Icon, tone }) => (
          <Link key={href} href={href} className="block">
            <Card level="base" interactive spotlight className="h-full p-5">
              <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-control bg-white/5 shadow-hairline", tone)}>
                <Icon />
              </span>
              <p className="mt-3 text-body-base font-medium text-fg-primary">{title}</p>
              <p className="mt-1 text-sm text-fg-secondary">{copy}</p>
              <p className={cn("mt-3 text-sm", tone)}>Open →</p>
            </Card>
          </Link>
        ))}
      </div>
    </Stagger>
  );
}
