"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

/**
 * The particle field, shared by the landing hero and the signed-in surfaces.
 *
 * What's going on in here:
 * - Points spread through a wide, shallow slab in front of the camera.
 * - A custom shader does the work per particle: a slow wave rolls across the
 *   field (it's meant to feel like a price surface breathing), each point
 *   twinkles on its own phase, size and alpha fall off with depth, and the
 *   colour mixes from indigo to mastery teal.
 * - The pointer shifts the field with parallax when `interactive` is on.
 *   Near particles move more than far ones, so the slab has real depth.
 * - Additive blending, no depth write. Overlapping points brighten instead
 *   of occluding, which is what makes it glow.
 *
 * Under reduced motion the frameloop is on demand, so it renders one still
 * frame and then never touches the GPU again.
 */

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uWave;
  uniform vec2 uPointer;
  attribute float aPhase;
  attribute float aSize;
  attribute float aMix;
  varying float vMix;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float depth = (p.z + 4.0) / 6.0;

    float wave = sin(p.x * 0.75 + uTime * 0.32 + aPhase) * 0.32
               + cos(p.z * 1.1 - uTime * 0.21 + aPhase * 0.6) * 0.18;
    p.y += wave * uWave;

    p.x += uPointer.x * (0.25 + depth * 0.55);
    p.y += uPointer.y * (0.15 + depth * 0.35);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float twinkle = 0.62 + 0.38 * sin(uTime * 1.3 + aPhase * 6.2832);
    gl_PointSize = aSize * uPixelRatio * uScale * (13.0 / -mv.z) * twinkle;

    vMix = aMix;
    vAlpha = smoothstep(10.0, 3.5, -mv.z) * twinkle;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uIntensity;
  varying float vMix;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = 1.0 - smoothstep(0.0, 0.18, d);
    float halo = 1.0 - smoothstep(0.12, 0.5, d);
    vec3 indigo = vec3(0.369, 0.416, 0.824);
    vec3 teal = vec3(0.176, 0.831, 0.749);
    vec3 col = mix(indigo, teal, vMix);
    float a = (halo * 0.5 + core * 0.5) * vAlpha;
    gl_FragColor = vec4(col, a * 0.92 * uIntensity);
  }
`;

export interface ParticleFieldProps {
  /** How many points. 2,500 on the landing hero, a few hundred elsewhere. */
  count?: number;
  /** Pointer parallax. Off for decorative backdrops inside cards. */
  interactive?: boolean;
  /** 0 to 1. How much the wave displaces the field. */
  wave?: number;
  /** Multiplier on point size. */
  scale?: number;
  /** Multiplier on alpha. Lower it behind text. */
  intensity?: number;
  /** World-space extent of the slab: width, height, depth. */
  spread?: [number, number, number];
  className?: string;
}

function Field({
  count,
  interactive,
  wave,
  scale,
  intensity,
  spread,
}: Required<Omit<ParticleFieldProps, "className">>) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef(new THREE.Vector2(0, 0));
  const target = useRef(new THREE.Vector2(0, 0));

  // I read the pointer off the window rather than the canvas, because the
  // canvas sits behind the copy and never gets the events itself.
  // Normalised to -1..1 across the viewport, which is all the parallax needs.
  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: PointerEvent) => {
      target.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [interactive]);

  const { positions, phases, sizes, mixes } = useMemo(() => {
    const [sx, sy, sz] = spread;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    const mixes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * sx;
      const y = (Math.random() - 0.5) * sy;
      const z = (Math.random() - 0.5) * sz - 1;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      phases[i] = Math.random();
      // Mostly fine dust, with a few larger "stars" scattered through it.
      // These are scalars the vertex shader divides by depth, so a 1.0 here
      // is roughly a 2px point in the middle of the field.
      sizes[i] = Math.random() < 0.07 ? 2.6 + Math.random() * 1.6 : 0.8 + Math.random() * 1.0;
      // Teal bias grows to the right, so the field reads warm-to-cool the
      // same way the aurora behind it does.
      mixes[i] = THREE.MathUtils.clamp((x + sx / 2) / sx + (Math.random() - 0.5) * 0.35, 0, 1);
    }
    return { positions, phases, sizes, mixes };
  }, [count, spread]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uScale: { value: scale },
      uWave: { value: wave },
      uIntensity: { value: intensity },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    // These only change when the caller changes them, which is never at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, delta) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime!.value += delta;
    m.uniforms.uPixelRatio!.value = state.gl.getPixelRatio();
    if (interactive) {
      pointer.current.lerp(target.current, 0.035);
      (m.uniforms.uPointer!.value as THREE.Vector2).copy(pointer.current);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aMix" args={[mixes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function ParticleField({
  count = 600,
  interactive = false,
  wave = 1,
  scale = 1,
  intensity = 1,
  spread = [16, 7, 6],
  className,
}: ParticleFieldProps) {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden="true" className={className ?? "pointer-events-none absolute inset-0"}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        frameloop={reduced ? "demand" : "always"}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "low-power", alpha: true }}
      >
        <Field
          count={count}
          interactive={interactive && !reduced}
          wave={wave}
          scale={scale}
          intensity={intensity}
          spread={spread}
        />
      </Canvas>
    </div>
  );
}
