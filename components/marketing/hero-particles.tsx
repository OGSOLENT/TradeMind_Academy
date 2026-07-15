"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import type { Points as ThreePoints } from "three";

/**
 * Landing hero particle field (adapted from design/prototype/three.js +
 * shader_1/2 into r3f). 2.5k particles desktop / 800 mobile; reduced motion
 * renders a single static frame (frameloop="demand").
 */

function Field({ count }: { count: number }) {
  const ref = useRef<ThreePoints>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.02;
    ref.current.rotation.x = Math.sin(t * 0.05) * 0.06;
    const targetX = state.pointer.x * 0.15;
    ref.current.position.x += (targetX - ref.current.position.x) * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#5E6AD2" transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

export function HeroParticles({ mobile = false }: { mobile?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        frameloop={reduced ? "demand" : "always"}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "low-power" }}
      >
        <Field count={mobile ? 800 : 2500} />
      </Canvas>
    </div>
  );
}
