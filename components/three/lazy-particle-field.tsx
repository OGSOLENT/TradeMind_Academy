"use client";

import dynamic from "next/dynamic";
import { LazyMount } from "./lazy-mount";
import type { ParticleFieldProps } from "./particle-field";

const ParticleField = dynamic(
  () => import("./particle-field").then((m) => m.ParticleField),
  { ssr: false },
);

export function LazyParticleField(props: ParticleFieldProps) {
  return (
    <LazyMount className="pointer-events-none -z-10">
      <ParticleField {...props} />
    </LazyMount>
  );
}
