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

/** Polynomial smooth minimum. Blends two shapes instead of creasing them. */
function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/**
 * The two halves of the shape, kept separate because they wrinkle
 * differently: the cerebrum has winding gyri, the cerebellum has tight
 * horizontal folia. Negative means inside.
 */
function brainParts(p: THREE.Vector3): { cerebrum: number; cerebellum: number; stem: number } {
  // The cerebrum is five overlapping ellipsoids blended together: the long
  // body, a frontal bulge, the temporal lobes hanging under the front half,
  // a parietal dome and the occipital pole. Smooth unions so the outline
  // rolls from lobe to lobe the way a real one does, rather than showing
  // the seams between spheres.
  const body = sdEllipsoid(p, [0, 0.22, 0.06], [1.0, 0.82, 1.32]);
  const frontal = sdEllipsoid(p, [0, 0.12, -0.86], [0.84, 0.68, 0.72]);
  const temporal = sdEllipsoid(p, [0, -0.36, -0.3], [0.96, 0.38, 0.9]);
  const parietal = sdEllipsoid(p, [0, 0.62, 0.28], [0.82, 0.52, 1.0]);
  const occipital = sdEllipsoid(p, [0, 0.1, 1.04], [0.78, 0.6, 0.5]);
  let cerebrum = smin(body, frontal, 0.22);
  cerebrum = smin(cerebrum, temporal, 0.18);
  cerebrum = smin(cerebrum, parietal, 0.24);
  cerebrum = smin(cerebrum, occipital, 0.2);
  // The cerebellum tucks under the occipital lobe, a little back and down.
  const cerebellum = sdEllipsoid(p, [0, -0.6, 0.9], [0.58, 0.36, 0.5]);
  // The stem drops from the middle, angling back slightly.
  const stem = sdCapsule(p, [0, -0.3, 0.42], [0, -1.32, 0.68], 0.19);
  return { cerebrum, cerebellum, stem };
}

/** Distance to the brain surface. Negative inside. */
function brainSdf(p: THREE.Vector3): number {
  const { cerebrum, cerebellum, stem } = brainParts(p);
  // A small blend radius against the cerebellum keeps the crease between it
  // and the occipital lobe, which is the detail that says "brain" in profile.
  return smin(smin(cerebrum, cerebellum, 0.07), stem, 0.1);
}

/**
 * The wrinkles. Winding gyri over the cerebrum, tight horizontal folia over
 * the cerebellum, and the stem stays smooth.
 */
function gyri(p: THREE.Vector3): number {
  const { cerebrum, cerebellum, stem } = brainParts(p);
  if (stem < cerebrum && stem < cerebellum) return 0;
  if (cerebellum < cerebrum) {
    return Math.sin(p.y * 26 + p.z * 4) * 0.6 + Math.cos(p.x * 9 + p.z * 5) * 0.15;
  }
  return (
    Math.sin(p.y * 7.5 + p.z * 4.2) * Math.cos(p.z * 6.3 - p.x * 3.1) * 0.55 +
    Math.sin(p.x * 9.1 + p.y * 5.7) * 0.3 +
    Math.cos(p.z * 11.2 + p.y * 2.9 + p.x * 4.4) * 0.15
  );
}

/** The surface normal, from the SDF's gradient. Used for the lighting. */
function normalAt(p: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
  const e = 0.01;
  const d = brainSdf(p);
  _p.set(p.x + e, p.y, p.z);
  const dx = brainSdf(_p) - d;
  _p.set(p.x, p.y + e, p.z);
  const dy = brainSdf(_p) - d;
  _p.set(p.x, p.y, p.z + e);
  const dz = brainSdf(_p) - d;
  return out.set(dx, dy, dz).normalize();
}

/**
 * The brain as a dot matrix. Instead of throwing random points at the
 * shape, I walk a regular lattice through its bounding box and keep every
 * lattice point that sits in a thin shell around the wrinkled surface. That
 * regularity is what makes it read as a rendered object rather than dust.
 * Each dot carries a brightness from three things: the fold it's in, how
 * much it faces a light up and to the front, and a slow-pulsing highlight
 * patch or two so the surface feels alive.
 */
function brainLattice(step: number): {
  positions: Float32Array;
  brightness: Float32Array;
  phase: Float32Array;
  count: number;
} {
  const pos: number[] = [];
  const bri: number[] = [];
  const pha: number[] = [];
  const n = new THREE.Vector3();
  const light = new THREE.Vector3(-0.4, 0.8, -0.45).normalize();
  const patches = [
    new THREE.Vector3(-0.85, 0.35, -0.55),
    new THREE.Vector3(0.75, 0.55, 0.45),
    new THREE.Vector3(-0.6, -0.15, 0.85),
  ];
  for (let x = -1.15; x <= 1.15; x += step) {
    for (let y = -1.45; y <= 1.3; y += step) {
      for (let z = -1.62; z <= 1.6; z += step) {
        _p.set(x, y, z);
        const g = gyri(_p);
        const d = brainSdf(_p) + g * 0.035;
        if (d < -0.045 || d > 0.02) continue;
        // The longitudinal fissure along the top of the midline.
        if (Math.abs(x) < 0.05 && y > -0.05 && z < 0.8) continue;
        normalAt(_p, n);
        const lit = 0.55 + 0.45 * Math.max(0, n.dot(light));
        const fold = 0.45 + 0.55 * Math.max(0, Math.min(1, (g + 1) / 2));
        let patch = 0;
        for (const c of patches) patch = Math.max(patch, 1 - Math.min(1, _p.distanceTo(c) / 0.55));
        pos.push(x, y, z);
        bri.push(Math.min(1.4, lit * fold + patch * 0.9));
        pha.push(Math.random());
      }
    }
  }
  return {
    positions: new Float32Array(pos),
    brightness: new Float32Array(bri),
    phase: new Float32Array(pha),
    count: pos.length / 3,
  };
}

/* The dot shader. Size and alpha fall off with view depth, so the far side
   of the brain recedes instead of drawing over the near side, and the
   highlight patches pulse on their own phase. */
const BRAIN_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aBright;
  attribute float aPhase;
  varying float vBright;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = smoothstep(7.5, 3.6, -mv.z);
    float pulse = 1.0 + 0.18 * sin(uTime * 1.1 + aPhase * 6.2832) * step(1.0, aBright);
    gl_PointSize = (2.4 + aBright * 1.1) * uPixelRatio * (5.2 / -mv.z) * pulse;
    vBright = aBright * pulse;
    vDepth = depth;
  }
`;
const BRAIN_FRAGMENT = /* glsl */ `
  varying float vBright;
  varying float vDepth;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float disc = 1.0 - smoothstep(0.32, 0.5, d);
    vec3 dim = vec3(0.30, 0.36, 0.78);
    vec3 bright = vec3(0.62, 0.80, 1.0);
    vec3 col = mix(dim, bright, clamp(vBright - 0.4, 0.0, 1.0));
    float a = disc * (0.28 + 0.62 * vDepth) * clamp(vBright, 0.35, 1.0);
    gl_FragColor = vec4(col, a);
  }
`;

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
  const { invalidate, camera, size } = useThree();

  // Fit the brain to the width it's been given. The side view is about
  // 3.3 units long, so the camera backs off until half of that fits in
  // half the view, whatever the column's aspect ratio is.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const halfFov = (cam.fov * Math.PI) / 360;
    const forWidth = 1.95 / (Math.tan(halfFov) * aspect);
    const forHeight = 1.55 / Math.tan(halfFov);
    cam.position.z = Math.min(9.5, Math.max(forWidth, forHeight, 4.6));
    cam.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);
  const start = useRef<number | null>(null);
  const sway = useRef(0);
  const [localHover, setLocalHover] = useState<string | null>(null);
  const hovered = hoveredId ?? localHover;

  const positions = useMemo(() => neuronPositions(nodes.length), [nodes.length]);
  const lattice = useMemo(() => brainLattice(0.058), []);
  const far = useMemo(() => farStars(320), []);
  const brainMat = useRef<THREE.ShaderMaterial>(null);
  const brainUniforms = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }), []);

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
    if (brainMat.current) {
      brainMat.current.uniforms.uTime!.value = state.clock.elapsedTime;
      brainMat.current.uniforms.uPixelRatio!.value = state.gl.getPixelRatio();
    }

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
      {/* The cortex, as a dot matrix on the skin of the brain. */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lattice.positions, 3]} />
          <bufferAttribute attach="attributes-aBright" args={[lattice.brightness, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[lattice.phase, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={brainMat}
          vertexShader={BRAIN_VERTEX}
          fragmentShader={BRAIN_FRAGMENT}
          uniforms={brainUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* A soft halo behind the whole brain, like the reference's blue glow. */}
      <sprite scale={[4.6, 3.4, 1]} position={[0, -0.05, -0.2]}>
        <spriteMaterial map={glow} color="#3d4fd6" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
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
