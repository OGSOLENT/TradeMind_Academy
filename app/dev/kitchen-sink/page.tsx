"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input, Textarea } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { MasteryRing } from "@/components/ui/mastery-ring";
import { Modal } from "@/components/ui/modal";
import { Pill } from "@/components/ui/pill";
import { ProgressBar, SegmentedProgress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-4">
      <h2 className="text-headline-md text-fg-primary">{title}</h2>
      {children}
    </section>
  );
}

const buttonVariants = ["primary", "secondary", "ghost", "danger", "glass"] as const;

export default function KitchenSink() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ring, setRing] = useState(0.62);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-12">
        <header>
          <h1 className="text-display-lg-mobile md:text-display-lg text-fg-primary">
            Kitchen sink
          </h1>
          <p className="mt-2 text-body-base text-fg-secondary">
            Every design-system primitive in every state. Visual-regression and
            report-screenshot page.
          </p>
        </header>

        <Section title="Buttons — 5 variants × states">
          <div className="space-y-3">
            {buttonVariants.map((v) => (
              <div key={v} className="flex flex-wrap items-center gap-3">
                <Button variant={v}>{v}</Button>
                <Button variant={v} disabled>
                  disabled
                </Button>
                <Button variant={v} loading>
                  loading
                </Button>
                <Button variant={v} success>
                  success
                </Button>
                <Button variant={v} size="sm">
                  sm
                </Button>
                <Button variant={v} size="lg">
                  lg
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Inputs — floating labels">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Email address" type="email" autoComplete="email" />
            <Input label="Display name" defaultValue="Ekene" hint="Shown on your profile." />
            <Input label="Password" type="password" error="Must be at least 12 characters." />
            <Input label="Disabled field" disabled />
            <Textarea label="Notes" className="md:col-span-2" />
          </div>
        </Section>

        <Section title="Cards — internal illumination levels">
          <div className="grid gap-4 md:grid-cols-3">
            <Card level="base">
              <p className="text-sm text-fg-secondary">Level 1 · base</p>
              <p className="num mt-2 text-2xl text-fg-primary">0.42</p>
            </Card>
            <Card level="elevated">
              <p className="text-sm text-fg-secondary">Level 2 · elevated</p>
              <p className="num mt-2 text-2xl text-mastery-bright">+12.4%</p>
            </Card>
            <Card level="glass" interactive>
              <p className="text-sm text-fg-secondary">Level 3 · glass · interactive</p>
              <p className="mt-2 text-body-base text-fg-primary">Hover me</p>
            </Card>
          </div>
        </Section>

        <Section title="MasteryRing — flagship (3 sizes, band colours)">
          <div className="flex flex-wrap items-end gap-8">
            <MasteryRing value={ring} size="sm" />
            <MasteryRing value={ring} size="md" label="candles" />
            <MasteryRing value={ring} size="lg" label="market structure" />
            <MasteryRing value={0.31} size="md" label="remediation" />
            <MasteryRing value={0.86} size="md" label="mastered" />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setRing((r) => Math.min(1, r + 0.09))}>
              Gain +9%
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRing((r) => Math.max(0, r - 0.07))}>
              Loss −7%
            </Button>
          </div>
        </Section>

        <Section title="Pills">
          <div className="flex flex-wrap gap-2">
            <Pill>neutral</Pill>
            <Pill tone="accent" dot>
              in progress
            </Pill>
            <Pill tone="mastery" dot>
              mastered
            </Pill>
            <Pill tone="warning" dot>
              fading
            </Pill>
            <Pill tone="danger">simulated</Pill>
          </div>
        </Section>

        <Section title="Progress">
          <div className="space-y-5">
            <ProgressBar value={0.71} aria-label="Mastery progress" />
            <ProgressBar value={0.44} tone="accent" aria-label="Lesson progress" />
            <ProgressBar value={0.58} variant="thin" aria-label="Reading progress" />
            <SegmentedProgress total={10} completed={4} current={4} />
          </div>
        </Section>

        <Section title="Toasts — 4 variants, swipe to dismiss">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => toast({ title: "Synced", description: "Your progress is saved." })}>
              default
            </Button>
            <Button variant="secondary" size="sm" onClick={() => toast({ title: "Mastery increased to 71 percent", variant: "success" })}>
              success
            </Button>
            <Button variant="secondary" size="sm" onClick={() => toast({ title: "Connection lost", description: "Events queued — nothing is dropped.", variant: "warning" })}>
              warning
            </Button>
            <Button variant="secondary" size="sm" onClick={() => toast({ title: "Log write failed", description: "Re-queued for retry.", variant: "danger" })}>
              danger
            </Button>
          </div>
        </Section>

        <Section title="Overlays">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Open drawer
            </Button>
          </div>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Delete account?">
            <p className="text-body-base text-fg-secondary">
              This action cannot be undone. Your response log will be exported first.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>
                Delete
              </Button>
            </div>
          </Modal>
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Fair value gaps">
            <p className="text-body-base text-fg-secondary">
              Drag the handle: snaps at 40% and 90% of the viewport. The shell
              behind scales to 0.97. Flick down to dismiss.
            </p>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 12 }, (_, i) => (
                <Card key={i} level="base" className="p-4">
                  <p className="text-sm text-fg-secondary">Scrollable content row {i + 1}</p>
                </Card>
              ))}
            </div>
          </Drawer>
        </Section>

        <Section title="Tabs — spring underline">
          <Tabs
            items={[
              { id: "overview", label: "Overview", content: <p className="text-body-base text-fg-secondary">Overview panel.</p> },
              { id: "mistakes", label: "Mistakes", content: <p className="text-body-base text-fg-secondary">Mistake bank panel.</p> },
              { id: "history", label: "History", content: <p className="text-body-base text-fg-secondary">History panel.</p> },
            ]}
          />
        </Section>

        <Section title="Skeletons">
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-24 w-full rounded-card" />
          </div>
        </Section>

        <Section title="Kbd">
          <p className="flex items-center gap-2 text-sm text-fg-secondary">
            Answer with <Kbd>1</Kbd>
            <Kbd>2</Kbd>
            <Kbd>3</Kbd>
            <Kbd>4</Kbd> then <Kbd>↵ Enter</Kbd>
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
