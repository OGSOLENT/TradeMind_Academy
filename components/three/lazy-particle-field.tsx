"use client";

import dynamic from "next/dynamic";
import { LazyMount } from "./lazy-mount";
import type { ParticleFieldProps } from "./particle-field";

const ParticleField = dynamic(
  () => import("./particle-field").then((m) => m.ParticleField),
  { ssr: false },
);

/**
 * The particle field behind a LazyMount gate: on screen, idle, desktop, and
 * not reduced motion. On a phone or under reduced motion nothing loads at
 * all, and the CSS ambient field underneath does the job on its own.
 */
export function LazyParticleField(props: ParticleFieldProps) {
  return (
    <LazyMount className="pointer-events-none -z-10">
      <ParticleField {...props} />
    </LazyMount>
  );
}
