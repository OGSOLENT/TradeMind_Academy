"use client";

import { ParticleField } from "@/components/three/particle-field";
import { useA11yPrefs } from "@/lib/a11y-prefs";

export function HeroParticles({ mobile = false }: { mobile?: boolean }) {
  const { calmMode } = useA11yPrefs();
  if (calmMode) return null;
  return (
    <div aria-hidden="true" className="tm-fade-in pointer-events-none absolute inset-0">
      <ParticleField count={mobile ? 800 : 2500} interactive={!mobile} />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--bg-deep)]" />
    </div>
  );
}
