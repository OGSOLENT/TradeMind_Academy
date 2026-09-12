"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import type { NodeState } from "@/lib/routing";

/**
 * The knowledge orb, drawn as a brain.
 *
 * The silhouette is a real brain shape, not a balloon: a cerebrum built from
 * a few overlapping ellipsoids (frontal bulge, temporal lobes, the long
 * body), a cerebellum tucked under the back and a stem running down from
 * the middle. I sample stars on the skin of that shape, wrinkle it for the
 * gyri, darken the stars that fall into the folds so the sulci draw
 * themselves, and carve the fissure along the top. It opens on the side
 * view so the first thing you see is unmistakably a brain, then it sways
 * gently around that view instead of spinning to the back. The modules sit
 * inside it as neurons, placed along a path that winds up through the
 * volume in teaching order, so it's still the climb the 2D skill map draws. The prerequisite chain is the main axon: a
 * dim tube for the whole route, a bright one built from the stretch the
 * learner has covered (mean mastery, same as the map), and signal pulses
 * travelling along it, bright where it's lit and faint beyond. Thin
 * dendrites join each neuron to its nearest neighbours. Each neuron's glow
 * scales with its own mastery.
 *
 * It turns slowly, leans toward the pointer, pauses while you hover a
 * neuron, and shows that neuron's title and estimate in a label that's
 * clamped to the canvas so it never runs off the edge. Clicking a neuron
 * hands its id back so the dashboard can open the lesson. The list beside
 * the orb is the accessible version; the canvas is decoration.
 *
 * Reduced motion: no rotation, no pulses, no entrance, one frame on demand.
 */

export interface OrbNode {
  id: string;
  title: string;
  pL: number;
  state: NodeState;
}

export interface MindOrbProps {
  nodes: OrbNode[];
  /** Mean mastery across the route, 0 to 1. Drives the lit stretch of the axon. */
  progress: number;
  frontierId: string | null;
  hoveredId?: string | null;
  onHover?(id: string | null): void;
  onSelect?(id: string): void;
}

const TONE: Record<NodeState, string> = {
  mastered: "#2dd4bf",
  available: "#8b95ff",
  remediation: "#ffb955",
  locked: "#3b3b4a",
};

/** Neuron positions: a squashed helix that stays inside the cerebrum. */
function neuronPositions(count: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const a = -Math.PI * 0.45 + t * Math.PI * 2.3;
    out.push(new THREE.Vector3(Math.cos(a) * 0.62, -0.32 + t * 1.05, Math.sin(a) * 0.95));
  }
  return out;
}

/* ---- The brain shape, as a signed distance field ------------------------
   x runs left to right across the hemispheres, y is up, and -z is the
   front. Everything below is in those units. */

const _p = new THREE.Vector3();

function sdEllipsoid(p: THREE.Vector3, c: [number, number, number], r: [number, number, number]) {
  const px = (p.x - c[0]) / r[0];
  const py = (p.y - c[1]) / r[1];
  const pz = (p.z - c[2]) / r[2];
  const k0 = Math.sqrt(px * px + py * py + pz * pz);
  const qx = px / r[0];
  const qy = py / r[1];
  const qz = pz / r[2];
  const k1 = Math.sqrt(qx * qx + qy * qy + qz * qz);
  return k1 === 0 ? -Math.min(r[0], r[1], r[2]) : (k0 * (k0 - 1)) / k1;
}

function sdCapsule(p: THREE.Vector3, a: [number, number, number], b: [number, number, number], r: number) {
  const pax = p.x - a[0];
  const pay = p.y - a[1];
  const paz = p.z - a[2];
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  const dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}

/** Distance to the brain surface. Negative inside. */
function brainSdf(p: THREE.Vector3): number {
  const body = sdEllipsoid(p, [0, 0.22, 0.1], [1.02, 0.86, 1.32]);
  const frontal = sdEllipsoid(p, [0, 0.12, -0.78], [0.86, 0.72, 0.78]);
  const temporal = sdEllipsoid(p, [0, -0.36, -0.3], [0.98, 0.42, 0.92]);
  const parietal = sdEllipsoid(p, [0, 0.62, 0.35], [0.82, 0.5, 0.95]);
  const cerebellum = sdEllipsoid(p, [0, -0.6, 0.98], [0.6, 0.4, 0.52]);
  const stem = sdCapsule(p, [0, -0.35, 0.42], [0, -1.32, 0.72], 0.19);
  return Math.min(body, frontal, temporal, parietal, cerebellum, stem);
}

/** The gyri. A field of overlapping waves that wrinkles the surface. */
function gyri(p: THREE.Vector3): number {
  return (
    Math.sin(p.y * 7.5 + p.z * 4.2) * Math.cos(p.z * 6.3 - p.x * 3.1) * 0.55 +
    Math.sin(p.x * 9.1 + p.y * 5.7) * 0.3 +
    Math.cos(p.z * 11.2 + p.y * 2.9 + p.x * 4.4) * 0.15
  );
}

/**
 * Stars on the skin of the brain. Rejection sampling: throw random points
 * at the bounding box and keep the ones that land in a thin shell around
 * the wrinkled surface. Each star also gets a brightness from the same
 * wrinkle field, so the folds come out darker and the ridges brighter,
 * which is what makes it read as cortex instead of a smooth egg.
 */
function brainStars(count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const base = new THREE.Color("#8b95ff");
  const bright = new THREE.Color("#c9d0ff");
  const tmp = new THREE.Color();
  let i = 0;
  let guard = 0;
  while (i < count && guard < count * 60) {
    guard++;
    _p.set((Math.random() - 0.5) * 2.3, -1.45 + Math.random() * 2.75, (Math.random() - 0.5) * 3.1);
    const g = gyri(_p);
    const d = brainSdf(_p) + g * 0.04;
    if (d < -0.035 || d > 0.02) continue;
    // The longitudinal fissure: a groove along the top of the midline.
    if (Math.abs(_p.x) < 0.05 && _p.y > -0.05 && _p.z < 0.75) continue;
    positions[i * 3] = _p.x;
    positions[i * 3 + 1] = _p.y;
    positions[i * 3 + 2] = _p.z;
    // Ridges bright, folds dim.
    const k = 0.35 + 0.65 * Math.max(0, Math.min(1, (g + 1) / 2));
    tmp.copy(base).lerp(bright, k * 0.6).multiplyScalar(0.3 + k * 0.9);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
    i++;
  }
  return { positions: positions.subarray(0, i * 3), colors: colors.subarray(0, i * 3) };
}

/** A faint field of distant stars around the brain, for the constellation feel. */
function farStars(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.6 + Math.random() * 2.2;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
    arr[i * 3 + 1] = r * Math.cos(ph) * 0.7;
    arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  return arr;
}

/** A soft radial sprite, drawn once on a 2D canvas and reused for every glow. */
function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.55)");
    g.addColorStop(0.6, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function easeOutBack(x: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** Keep a label inside the canvas. Labels are centred, so the margin is half a label. */
function clampedPosition(el: THREE.Object3D, camera: THREE.Camera, size: { width: number; height: number }): [number, number] {
  const v = new THREE.Vector3().setFromMatrixPosition(el.matrixWorld).project(camera);
  const x = ((v.x + 1) / 2) * size.width;
  const y = ((1 - v.y) / 2) * size.height;
  const mx = Math.min(110, size.width / 2);
  const my = 18;
  return [Math.min(size.width - mx, Math.max(mx, x)), Math.min(size.height - my, Math.max(my, y))];
}

const PULSES = 7;

function Scene({ nodes, progress, frontierId, hoveredId, onHover, onSelect, reduced }: MindOrbProps & { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Group | null)[]>([]);
  const pulseRefs = useRef<(THREE.Sprite | null)[]>([]);
  const traveller = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const glow = useGlowTexture();
  const { invalidate } = useThree();
  const start = useRef<number | null>(null);
  const sway = useRef(0);
  const [localHover, setLocalHover] = useState<string | null>(null);
  const hovered = hoveredId ?? localHover;

  const positions = useMemo(() => neuronPositions(nodes.length), [nodes.length]);
  const stars = useMemo(() => brainStars(7000), []);
  const far = useMemo(() => farStars(320), []);

  // The axon. A dim tube for the whole route, a bright one for the covered
  // stretch, both built from the same Catmull-Rom curve through the neurons.
  const { track, lit, curve } = useMemo(() => {
    if (positions.length < 2) return { track: null, lit: null, curve: null };
    const curve = new THREE.CatmullRomCurve3(positions, false, "catmullrom", 0.6);
    const track = new THREE.TubeGeometry(curve, 160, 0.01, 6, false);
    const p = Math.max(0, Math.min(1, progress));
    let lit: THREE.TubeGeometry | null = null;
    if (p > 0.02) {
      const pts = curve.getSpacedPoints(240).slice(0, Math.max(2, Math.round(p * 240)));
      lit = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.018, 8, false);
    }
    return { track, lit, curve };
  }, [positions, progress]);

  // Dendrites: each neuron to its two nearest that aren't already its chain
  // neighbours. Faint, so the axon stays the story.
  const dendrites = useMemo(() => {
    const pairs = new Set<string>();
    const pts: number[] = [];
    positions.forEach((p, i) => {
      const near = positions
        .map((q, j) => ({ j, d: p.distanceTo(q) }))
        .filter(({ j }) => j !== i && Math.abs(j - i) > 1)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const { j } of near) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (pairs.has(key)) continue;
        pairs.add(key);
        const q = positions[j]!;
        pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
      }
    });
    return new Float32Array(pts);
  }, [positions]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;

    // Open on the side view (the brain faces left, like a textbook), then
    // sway gently around it so it never turns its back on you. Hovering
    // holds it still, and the pointer adds a small lean.
    const side = Math.PI / 2;
    if (!reduced) {
      const target = hovered ? sway.current : Math.sin(t * 0.22) * 0.55;
      sway.current += (target - sway.current) * 0.04;
      g.rotation.y = side + sway.current + state.pointer.x * 0.12;
      g.rotation.x += (state.pointer.y * -0.14 - g.rotation.x) * 0.05;
    } else {
      g.rotation.y = side;
    }

    // Entrance: each neuron pops in on its own beat.
    nodeRefs.current.forEach((n, i) => {
      if (!n) return;
      const s = reduced ? 1 : easeOutBack(Math.max(0, Math.min(1, (t - 0.15 - i * 0.07) / 0.6)));
      const hov = hovered === nodes[i]?.id ? 1.3 : 1;
      n.scale.setScalar(s * hov);
    });

    // Signals along the axon. Bright on the lit stretch, faint past it.
    if (curve && !reduced) {
      pulseRefs.current.forEach((sp, i) => {
        if (!sp) return;
        const u = (t * 0.07 + i / PULSES) % 1;
        sp.position.copy(curve.getPointAt(u));
        const litPart = u <= progress;
        const mat = sp.material as THREE.SpriteMaterial;
        mat.opacity = litPart ? 0.9 : 0.28;
        mat.color.set(litPart ? "#bffaf1" : "#8b95ff");
        const k = litPart ? 0.26 : 0.16;
        sp.scale.set(k, k, 1);
      });
    }

    // The traveller breathes at the head of the lit stretch, and the
    // frontier's halo pulses with it.
    if (!reduced) {
      const k = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.12;
      traveller.current?.scale.setScalar(k);
      if (halo.current) halo.current.scale.setScalar(1.1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.18);
    }
    if (reduced && t < 0.2) invalidate();
  });

  const travellerPos = useMemo(() => {
    if (!curve || progress < 0.02) return null;
    return curve.getPointAt(Math.min(1, progress));
  }, [curve, progress]);

  return (
    <group ref={group}>
      {/* The cortex, as stars on the skin of the brain. */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[stars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.028} vertexColors transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      {/* Distant stars, so the brain hangs in a sky rather than a box. */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[far, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.02} color="#9aa3ff" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>

      {/* Dendrites */}
      {dendrites.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[dendrites, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#9aa3ff" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
        </lineSegments>
      )}

      {/* The axon */}
      {track && (
        <mesh geometry={track}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.14} depthWrite={false} />
        </mesh>
      )}
      {lit && (
        <>
          <mesh geometry={lit}>
            <meshBasicMaterial color="#5ee0d0" transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh geometry={lit}>
            <meshBasicMaterial color="#2dd4bf" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      )}

      {/* Signal pulses */}
      {curve &&
        !reduced &&
        Array.from({ length: PULSES }, (_, i) => (
          <sprite
            key={i}
            ref={(el) => {
              pulseRefs.current[i] = el;
            }}
            scale={[0.2, 0.2, 1]}
          >
            <spriteMaterial map={glow} color="#bffaf1" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}

      {travellerPos && (
        <group ref={traveller} position={travellerPos}>
          <sprite scale={[0.75, 0.75, 1]}>
            <spriteMaterial map={glow} color="#bdc2ff" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <mesh>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}

      {/* The neurons */}
      {nodes.map((node, i) => {
        const pos = positions[i]!;
        const tone = TONE[node.state];
        const isFrontier = node.id === frontierId;
        const isHovered = hovered === node.id;
        const locked = node.state === "locked";
        const glowScale = locked ? 0.3 : 0.5 + node.pL * 1.0;
        const glowOpacity = locked ? 0.25 : 0.5 + node.pL * 0.45;
        return (
          <group
            key={node.id}
            position={pos}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
          >
            {isFrontier && (
              <sprite ref={halo} scale={[1.1, 1.1, 1]}>
                <spriteMaterial map={glow} color={tone} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
              </sprite>
            )}
            <sprite scale={[glowScale, glowScale, 1]}>
              <spriteMaterial map={glow} color={tone} transparent opacity={glowOpacity} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setLocalHover(node.id);
                onHover?.(node.id);
              }}
              onPointerOut={() => {
                setLocalHover(null);
                onHover?.(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(node.id);
              }}
            >
              <sphereGeometry args={[locked ? 0.06 : 0.085, 20, 20]} />
              <meshBasicMaterial color={locked ? "#262630" : "#ffffff"} />
            </mesh>
            {!locked && (
              <mesh>
                <sphereGeometry args={[0.11, 20, 20]} />
                <meshBasicMaterial color={tone} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
              </mesh>
            )}
            {(isHovered || isFrontier) && (
              <Html
                center
                position={[0, 0.3, 0]}
                zIndexRange={[20, 0]}
                calculatePosition={clampedPosition}
                style={{ pointerEvents: "none" }}
              >
                <div className="num flex items-center gap-2 whitespace-nowrap rounded-pill bg-[rgba(16,16,24,0.96)] px-2.5 py-1 text-[11px] text-fg-primary shadow-lift backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-pill" style={{ background: tone }} />
                  {node.title}
                  <span style={{ color: tone }}>{Math.round(node.pL * 100)}%</span>
                  {isFrontier && !isHovered && (
                    <span className="uppercase tracking-wider text-fg-muted">up next</span>
                  )}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function MindOrb(props: MindOrbProps) {
  const reduced = !!useReducedMotion();
  return (
    <Canvas
      camera={{ position: [0, 0.05, 5.35], fov: 40 }}
      frameloop={reduced ? "demand" : "always"}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene {...props} reduced={reduced} />
    </Canvas>
  );
}
