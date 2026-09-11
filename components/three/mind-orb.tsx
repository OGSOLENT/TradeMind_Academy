"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import type { NodeState } from "@/lib/routing";

/**
 * The knowledge orb. A three.js view of the learner model itself.
 *
 * The modules sit on a helix that climbs from the bottom of the orb to the
 * top in teaching order, which is the same "climb" the 2D skill map draws,
 * just wound into three dimensions. A dim tube follows the whole route and
 * a bright one is built from only the stretch the learner has covered (mean
 * mastery, the same number the skill map uses), with a travelling light at
 * its head. Each node's glow scales with its own mastery, so the orb reads
 * at a glance: dim at the bottom means work to do, bright means done.
 *
 * It rotates slowly, tilts toward the pointer, pauses while you hover a
 * node, and shows the node's title and estimate. Clicking a node hands its
 * id back so the dashboard can open the lesson. The list beside the orb is
 * the accessible version of all this. The canvas itself is decoration.
 *
 * Reduced motion: no rotation, no entrance, one frame on demand.
 */

export interface OrbNode {
  id: string;
  title: string;
  pL: number;
  state: NodeState;
}

export interface MindOrbProps {
  nodes: OrbNode[];
  /** Mean mastery across the route, 0 to 1. Drives the lit stretch of the tube. */
  progress: number;
  frontierId: string | null;
  hoveredId?: string | null;
  onHover?(id: string | null): void;
  onSelect?(id: string): void;
}

const TONE: Record<NodeState, string> = {
  mastered: "#2dd4bf",
  available: "#7f8cf0",
  remediation: "#ffb955",
  locked: "#4a4a5c",
};

/** Node positions on the climbing helix. */
function helixPositions(count: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const angle = -Math.PI * 0.4 + t * Math.PI * 2.35;
    const r = 1.5;
    out.push(new THREE.Vector3(Math.cos(angle) * r, -1.35 + t * 2.7, Math.sin(angle) * r));
  }
  return out;
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

function Scene({ nodes, progress, frontierId, hoveredId, onHover, onSelect, reduced }: MindOrbProps & { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Group | null)[]>([]);
  const traveller = useRef<THREE.Group>(null);
  const glow = useGlowTexture();
  const { invalidate } = useThree();
  const start = useRef<number | null>(null);
  const [localHover, setLocalHover] = useState<string | null>(null);
  const hovered = hoveredId ?? localHover;

  const positions = useMemo(() => helixPositions(nodes.length), [nodes.length]);

  // The route. A dim tube for the whole climb, a bright one for the covered
  // stretch, both built from the same Catmull-Rom curve through the nodes.
  const { track, lit, curve } = useMemo(() => {
    if (positions.length < 2) return { track: null, lit: null, curve: null };
    const curve = new THREE.CatmullRomCurve3(positions, false, "catmullrom", 0.6);
    const track = new THREE.TubeGeometry(curve, 160, 0.012, 6, false);
    const p = Math.max(0, Math.min(1, progress));
    let lit: THREE.TubeGeometry | null = null;
    if (p > 0.02) {
      const pts = curve.getSpacedPoints(240).slice(0, Math.max(2, Math.round(p * 240)));
      lit = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.02, 8, false);
    }
    return { track, lit, curve };
  }, [positions, progress]);

  // Fine dust inside the orb so the nodes have something to float in.
  const dust = useMemo(() => {
    const n = 220;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 1.2 + Math.random() * 1.9;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = r * Math.cos(ph) * 0.8;
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    return arr;
  }, []);

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

    // Slow turn, paused while hovering, and a lean toward the pointer.
    if (!reduced) {
      if (!hovered) g.rotation.y += delta * 0.14;
      g.rotation.x += (state.pointer.y * -0.18 - g.rotation.x) * 0.05;
      g.rotation.z += (state.pointer.x * 0.06 - g.rotation.z) * 0.05;
    }

    // Entrance: each node pops in on its own beat.
    nodeRefs.current.forEach((n, i) => {
      if (!n) return;
      const s = reduced ? 1 : easeOutBack(Math.max(0, Math.min(1, (t - 0.15 - i * 0.07) / 0.6)));
      const hov = hovered === nodes[i]?.id ? 1.25 : 1;
      n.scale.setScalar(s * hov);
    });

    // The traveller breathes at the head of the lit stretch.
    if (traveller.current && !reduced) {
      const k = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.12;
      traveller.current.scale.setScalar(k);
    }
    if (reduced && t < 0.2) invalidate();
  });

  const travellerPos = useMemo(() => {
    if (!curve || progress < 0.02) return null;
    return curve.getPointAt(Math.min(1, progress));
  }, [curve, progress]);

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#8b95ff" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>

      {track && (
        <mesh geometry={track}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      )}
      {lit && (
        <>
          <mesh geometry={lit}>
            <meshBasicMaterial color="#5ee0d0" transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh geometry={lit} scale={[1, 1, 1]}>
            <meshBasicMaterial color="#2dd4bf" transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      )}

      {travellerPos && (
        <group ref={traveller} position={travellerPos}>
          <sprite scale={[0.7, 0.7, 1]}>
            <spriteMaterial map={glow} color="#bdc2ff" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <mesh>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}

      {nodes.map((node, i) => {
        const pos = positions[i]!;
        const tone = TONE[node.state];
        const isFrontier = node.id === frontierId;
        const isHovered = hovered === node.id;
        const glowScale = node.state === "locked" ? 0.35 : 0.55 + node.pL * 1.1;
        const glowOpacity = node.state === "locked" ? 0.25 : 0.45 + node.pL * 0.5;
        return (
          <group
            key={node.id}
            position={pos}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
          >
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
              <sphereGeometry args={[node.state === "locked" ? 0.075 : 0.105, 20, 20]} />
              <meshBasicMaterial color={node.state === "locked" ? "#2b2b36" : tone} />
            </mesh>
            {node.state !== "locked" && (
              <mesh>
                <ringGeometry args={[0.15, 0.165, 40]} />
                <meshBasicMaterial color={tone} transparent opacity={isFrontier ? 0.9 : 0.35} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            )}
            {(isHovered || isFrontier) && (
              <Html center position={[0, 0.34, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
                <div className="num flex items-center gap-2 whitespace-nowrap rounded-pill bg-bg-elevated/90 px-2.5 py-1 text-[11px] text-fg-primary shadow-lift backdrop-blur-sm">
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
      camera={{ position: [0, 0.2, 6.4], fov: 40 }}
      frameloop={reduced ? "demand" : "always"}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Scene {...props} reduced={reduced} />
    </Canvas>
  );
}
