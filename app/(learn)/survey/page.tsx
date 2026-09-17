"use client";

import { useTitle } from "@/lib/use-title";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { SUS_ITEMS, susScore } from "@/lib/assessment";
import { getFirebase } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Stagger } from "@/components/motion/stagger";
import { cn } from "@/lib/utils";

const SCALE = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

const OPEN = [
  { id: "helped", label: "What helped you learn most?" },
  { id: "confused", label: "What was confusing, or got in the way?" },
  { id: "trust", label: "Did the mastery percentages feel right to you? Why, or why not?" },
] as const;

/**
 * The System Usability Scale plus three open questions. Saved once per
 * learner at users/{uid}/surveys/sus; resubmitting overwrites, and the
 * analysis script reads the final answer.
 */
export default function SurveyPage() {
  useTitle("Survey");
  const { user } = useAuth();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(SUS_ITEMS.length).fill(null));
  const [open, setOpen] = useState<Record<string, string>>({ helped: "", confused: "", trust: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["survey", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const snap = await getDoc(doc(getFirebase().db, "users", user!.uid, "surveys", "sus"));
      return snap.exists() ? (snap.data() as { submittedAt?: unknown }) : null;
    },
  });

  const missing = answers.findIndex((a) => a === null);
  const complete = missing === -1;

  async function submit() {
    if (!user || !complete) return;
    setBusy(true);
    setError(null);
    try {
      const nums = answers as number[];
      await setDoc(doc(getFirebase().db, "users", user.uid, "surveys", "sus"), {
        answers: nums,
        score: susScore(nums),
        comments: open,
        submittedAt: serverTimestamp(),
      });
      await qc.invalidateQueries({ queryKey: ["survey", user.uid] });
      setDone(true);
    } catch {
      setError("That didn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Stagger className="mx-auto max-w-xl pt-12">
        <Card level="elevated" className="p-8 text-center">
          <Pill tone="mastery" dot>
            Saved
          </Pill>
          <h1 className="mt-4 text-display-lg-mobile text-fg-primary">Thank you</h1>
          <p className="mx-auto mt-3 max-w-md text-body-base text-fg-secondary">
            Your answers are stored with your pseudonymous learner record and only
            ever reported in aggregate. You can change them any time from this page.
          </p>
          <Link href="/dashboard" className="mt-8 inline-block">
            <Button>Back to dashboard</Button>
          </Link>
        </Card>
      </Stagger>
    );
  }

  return (
    <Stagger className="mx-auto max-w-2xl pb-16 pt-8">
      <header>
        <Pill tone="accent" dot>
          Two minutes
        </Pill>
        <h1 className="mt-4 text-display-lg-mobile text-fg-primary">How was it?</h1>
        <p className="mt-3 max-w-lg text-body-base text-fg-secondary">
          Ten statements about using TMAcademy, then three questions in your own
          words. There are no right answers; the honest ones are the useful ones.
        </p>
        {existing?.submittedAt != null && (
          <p className="mt-3 text-sm text-fg-secondary">
            You&apos;ve answered this before. Submitting again replaces your earlier answers.
          </p>
        )}
      </header>

      <Card level="elevated" className="mt-8 p-6 sm:p-8">
        <ol className="space-y-8">
          {SUS_ITEMS.map((text, i) => (
            <li key={i}>
              <fieldset>
                <legend className="text-body-base text-fg-primary">
                  <span className="num mr-2 text-fg-muted">{i + 1}.</span>
                  {text}
                </legend>
                <div
                  className="mt-3 grid grid-cols-5 gap-1.5"
                  role="radiogroup"
                  aria-label={`Statement ${i + 1}`}
                >
                  {SCALE.map((label, v) => {
                    const value = v + 1;
                    const selected = answers[i] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${value}: ${label}`}
                        onClick={() =>
                          setAnswers((a) => a.map((x, j) => (j === i ? value : x)))
                        }
                        className={cn(
                          "flex min-h-11 flex-col items-center justify-center rounded-control px-1 py-2 text-sm transition-[box-shadow,color,background-color] duration-150",
                          selected
                            ? "bg-accent/15 text-accent-bright shadow-[inset_0_0_0_1px_var(--accent),0_0_14px_var(--accent-glow)]"
                            : "bg-bg-deep text-fg-secondary shadow-hairline hover:text-fg-primary hover:shadow-[inset_0_0_0_1px_var(--border-edge)]",
                        )}
                      >
                        <span className="num">{value}</span>
                        <span className="mt-0.5 hidden text-[10px] leading-tight text-fg-muted sm:block">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-fg-muted sm:hidden">
                  <span>Strongly disagree</span>
                  <span>Strongly agree</span>
                </div>
              </fieldset>
            </li>
          ))}
        </ol>
      </Card>

      <Card level="elevated" className="mt-6 p-6 sm:p-8">
        <div className="space-y-6">
          {OPEN.map((q) => (
            <label key={q.id} className="block">
              <span className="text-body-base text-fg-primary">{q.label}</span>
              <textarea
                value={open[q.id]}
                onChange={(e) => setOpen((o) => ({ ...o, [q.id]: e.target.value.slice(0, 1000) }))}
                rows={3}
                className="mt-2 w-full rounded-control bg-bg-deep px-4 py-3 text-body-base text-fg-primary shadow-hairline transition-shadow duration-200 placeholder:text-fg-muted focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_4px_rgba(94,106,210,0.14)]"
                placeholder="Optional"
              />
            </label>
          ))}
        </div>
      </Card>

      <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button onClick={submit} loading={busy} disabled={!complete || busy}>
          Submit
        </Button>
        {!complete && (
          <p className="text-sm text-fg-secondary" aria-live="polite">
            Statement {missing + 1} still needs an answer.
          </p>
        )}
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </Stagger>
  );
}
