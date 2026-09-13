import type { Anno, Tone, Walkthrough as Spec } from "@/lib/walkthroughs/types";

/**
 * The chart itself, as a pure function of (spec, step): no hooks, no
 * framer, so the same code draws the lesson figure in the browser and the
 * static PNGs the report and the review harness use. Steps are cumulative;
 * the current step's layer is bright and the earlier ones sit back. The
 * layers cross-fade with a CSS transition, which the reduced-motion rules
 * in globals.css shorten like every other transition.
 */

const W = 820;
const PLOT_H = 430;
const OVERLAY_H = 110;
const M = { l: 12, r: 60, t: 14, b: 26 };

const STROKE: Record<Tone, string> = {
  accent: "var(--accent-bright)",
  mastery: "var(--mastery-bright)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  neutral: "var(--fg-secondary)",
};
const FILL: Record<Tone, string> = {
  accent: "rgba(94,106,210,0.20)",
  mastery: "rgba(45,212,191,0.16)",
  warning: "rgba(255,185,85,0.16)",
  danger: "rgba(255,180,171,0.16)",
  neutral: "rgba(255,255,255,0.07)",
};

/** Every price an annotation touches, so the scale leaves room for it. */
function annoPrices(a: Anno): number[] {
  switch (a.kind) {
    case "hline":
    case "bracket":
    case "marker":
      return [a.price];
    case "note":
      return a.price !== undefined ? [a.price] : [];
    case "zone":
      return [a.low, a.high];
    case "arrow":
      return [a.from[1], a.to[1]];
    case "path":
      return a.points.map((p) => p[1]);
    default:
      return [];
  }
}

/**
 * A label on the chart: a rounded pill behind the text so it reads over
 * candles and other layers. Width is estimated from the character count,
 * which is close enough for the sans face at these sizes.
 */
function Label({ x, y, text, tone, anchor = "start", size = 12 }: { x: number; y: number; text: string; tone: Tone; anchor?: "start" | "middle" | "end"; size?: number }) {
  const w = text.length * size * 0.56 + 12;
  const h = size + 8;
  const left = anchor === "start" ? x - 6 : anchor === "end" ? x - w + 6 : x - w / 2;
  return (
    <g>
      <rect x={left} y={y - size - 1} width={w} height={h} rx={h / 2} fill="rgba(8,8,12,0.82)" stroke={STROKE[tone]} strokeOpacity={0.35} strokeWidth={1} />
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fontSize={size}
        fontWeight={500}
        fill={STROKE[tone]}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {text}
      </text>
    </g>
  );
}

export function WalkthroughChart({ spec, step, className }: { spec: Spec; step: number; className?: string }) {
  const bars = spec.candles.length;
  const plotW = W - M.l - M.r;
  const xStep = plotW / bars;
  const x = (bar: number) => M.l + (bar + 0.5) * xStep;

  // The price scale covers the candles and everything the steps will draw.
  const { lo, hi } = (() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of spec.candles) {
      lo = Math.min(lo, c.l);
      hi = Math.max(hi, c.h);
    }
    for (const s of spec.steps) for (const a of s.annos) for (const p of annoPrices(a)) {
      lo = Math.min(lo, p);
      hi = Math.max(hi, p);
    }
    const pad = (hi - lo) * 0.08;
    return { lo: lo - pad, hi: hi + pad };
  })();
  const y = (price: number) => M.t + ((hi - price) / (hi - lo)) * (PLOT_H - M.t - M.b);

  const H = PLOT_H + (spec.overlay ? OVERLAY_H : 0);
  const candleW = Math.max(2, xStep * 0.62);
  const decimals = hi - lo > 50 ? 0 : hi - lo > 5 ? 1 : 2;

  const gridPrices = (() => {
    const out: number[] = [];
    for (let i = 0; i <= 4; i++) out.push(lo + ((hi - lo) * (i + 0.5)) / 5);
    return out;
  })();

  const renderAnno = (a: Anno, key: string) => {
    const tone = a.tone ?? "accent";
    const stroke = STROKE[tone];
    switch (a.kind) {
      case "hline": {
        const x1 = a.from !== undefined ? x(a.from) - xStep / 2 : M.l;
        const x2 = a.to !== undefined ? x(a.to) + xStep / 2 : W - M.r;
        return (
          <g key={key}>
            <line x1={x1} x2={x2} y1={y(a.price)} y2={y(a.price)} stroke={stroke} strokeWidth={1.5} strokeDasharray={a.dashed ? "5 4" : undefined} />
            {a.label &&
              (a.labelAt === "start" ? (
                <Label x={x1 + 4} y={y(a.price) - 5} text={a.label} tone={tone} />
              ) : (
                <Label x={x2 - 4} y={y(a.price) - 5} text={a.label} tone={tone} anchor="end" />
              ))}
          </g>
        );
      }
      case "zone": {
        const x1 = x(a.from) - xStep / 2;
        const x2 = x(a.to) + xStep / 2;
        return (
          <g key={key}>
            <rect x={x1} y={y(a.high)} width={x2 - x1} height={Math.max(2, y(a.low) - y(a.high))} fill={FILL[tone]} stroke={stroke} strokeWidth={1} strokeOpacity={0.7} rx={2} />
            {a.label &&
              (a.labelAt === "bottom" ? (
                <Label x={x1 + 5} y={y(a.low) + 14} text={a.label} tone={tone} />
              ) : a.labelAt === "bottom-end" ? (
                <Label x={x2 - 5} y={y(a.low) + 14} text={a.label} tone={tone} anchor="end" />
              ) : a.labelAt === "top-end" ? (
                <Label x={x2 - 5} y={y(a.high) - 5} text={a.label} tone={tone} anchor="end" />
              ) : a.labelAt === "inside" ? (
                <Label x={x1 + 5} y={y(a.high) + 14} text={a.label} tone={tone} />
              ) : (
                <Label x={x1 + 5} y={y(a.high) - 5} text={a.label} tone={tone} />
              ))}
          </g>
        );
      }
      case "band": {
        const x1 = x(a.from) - xStep / 2;
        const x2 = x(a.to) + xStep / 2;
        return (
          <g key={key}>
            <rect x={x1} y={M.t} width={x2 - x1} height={PLOT_H - M.t - M.b} fill={FILL[tone]} />
            <line x1={x1} x2={x1} y1={M.t} y2={PLOT_H - M.b} stroke={stroke} strokeOpacity={0.5} strokeDasharray="3 3" />
            <line x1={x2} x2={x2} y1={M.t} y2={PLOT_H - M.b} stroke={stroke} strokeOpacity={0.5} strokeDasharray="3 3" />
            {a.label && (
              <Label x={(x1 + x2) / 2} y={a.labelAt === "bottom" ? PLOT_H - M.b - 6 : M.t + 14} text={a.label} tone={tone} anchor="middle" />
            )}
          </g>
        );
      }
      case "vline":
        return (
          <g key={key}>
            <line x1={x(a.bar)} x2={x(a.bar)} y1={M.t} y2={PLOT_H - M.b} stroke={stroke} strokeWidth={1.5} strokeDasharray="4 3" />
            {a.label && <Label x={x(a.bar) + 5} y={a.labelAt === "bottom" ? PLOT_H - M.b - 6 : M.t + 14} text={a.label} tone={tone} />}
          </g>
        );
      case "marker": {
        const above = a.place !== "below";
        return (
          <g key={key}>
            <circle cx={x(a.bar)} cy={y(a.price)} r={4} fill={stroke} stroke="rgba(5,5,7,0.9)" strokeWidth={1.5} />
            <Label x={x(a.bar)} y={y(a.price) + (above ? -10 : 18)} text={a.label} tone={tone} anchor="middle" />
          </g>
        );
      }
      case "arrow": {
        const [x1, y1] = [x(a.from[0]), y(a.from[1])];
        const [x2, y2] = [x(a.to[0]), y(a.to[1])];
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const hx = (t: number) => x2 - Math.cos(ang + t) * 10;
        const hy = (t: number) => y2 - Math.sin(ang + t) * 10;
        return (
          <g key={key}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={2} />
            <polygon points={`${x2},${y2} ${hx(0.45)},${hy(0.45)} ${hx(-0.45)},${hy(-0.45)}`} fill={stroke} />
            {a.label && <Label x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} text={a.label} tone={tone} anchor="middle" />}
          </g>
        );
      }
      case "path": {
        const d = a.points.map(([b, p], i) => `${i === 0 ? "M" : "L"}${x(b)},${y(p)}`).join(" ");
        const at = a.labelAt === "start" ? a.points[0]! : a.points[a.points.length - 1]!;
        return (
          <g key={key}>
            <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray={a.dashed ? "6 4" : undefined} strokeLinejoin="round" />
            {a.label && <Label x={x(at[0]) + 6} y={y(at[1]) + 4} text={a.label} tone={tone} />}
          </g>
        );
      }
      case "bracket": {
        const x1 = x(a.from) - xStep / 2;
        const x2 = x(a.to) + xStep / 2;
        const yy = y(a.price);
        return (
          <g key={key}>
            <line x1={x1} x2={x2} y1={yy} y2={yy} stroke={stroke} strokeWidth={1.5} />
            <line x1={x1} x2={x1} y1={yy - 6} y2={yy + 6} stroke={stroke} strokeWidth={1.5} />
            <line x1={x2} x2={x2} y1={yy - 6} y2={yy + 6} stroke={stroke} strokeWidth={1.5} />
            <Label x={(x1 + x2) / 2} y={yy - 8} text={a.label} tone={tone} anchor="middle" />
          </g>
        );
      }
      case "note": {
        const lines = a.text.split("\n");
        const w = Math.max(...lines.map((l) => l.length)) * 6.6 + 16;
        const h = lines.length * 15 + 10;
        // Corner-pinned by default, so notes sit in the empty part of the
        // plot the spec chose rather than on top of the candles.
        const corner = a.at ?? (a.bar === undefined ? "tr" : undefined);
        const nx = corner
          ? corner.endsWith("l")
            ? M.l + 6
            : W - M.r - w - 6
          : Math.min(W - M.r - w - 4, Math.max(M.l + 4, x(a.bar!) - w / 2));
        const ny = corner
          ? corner.startsWith("t")
            ? M.t + 4
            : PLOT_H - M.b - h - 4
          : Math.max(M.t + 2, y(a.price ?? hi) - h - 10);
        return (
          <g key={key}>
            <rect x={nx} y={ny} width={w} height={h} rx={6} fill="rgba(16,16,24,0.96)" stroke={stroke} strokeOpacity={0.6} />
            {lines.map((l, i) => (
              <text key={i} x={nx + 8} y={ny + 17 + i * 15} fontSize={11.5} fill="var(--fg-primary)" style={{ fontFamily: "var(--font-sans)" }}>
                {l}
              </text>
            ))}
          </g>
        );
      }
    }
  };

  const overlayPath = (() => {
    if (!spec.overlay) return null;
    const v = spec.overlay.values;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const top = PLOT_H + 14;
    const bottom = PLOT_H + OVERLAY_H - 18;
    const oy = (val: number) => (max === min ? (top + bottom) / 2 : bottom - ((val - min) / (max - min)) * (bottom - top));
    const d = v.map((val, i) => `${i === 0 ? "M" : "L"}${x(i)},${oy(val)}`).join(" ");
    return { d, top, bottom, min, max };
  })();

  return (
<svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-hidden="true">
      {/* Grid and price axis */}
      {gridPrices.map((p) => (
        <g key={p}>
          <line x1={M.l} x2={W - M.r} y1={y(p)} y2={y(p)} stroke="rgba(255,255,255,0.06)" />
          <text x={W - M.r + 8} y={y(p) + 4} fontSize={11} fill="var(--fg-muted)" className="num">
            {p.toFixed(decimals)}
          </text>
        </g>
      ))}
      {spec.xLabels
        ? Object.entries(spec.xLabels).map(([bar, label]) => (
            <text key={bar} x={x(Number(bar))} y={PLOT_H - 8} fontSize={10.5} textAnchor="middle" fill="var(--fg-muted)" className="num">
              {label}
            </text>
          ))
        : spec.candles.map((_, i) =>
            i % 10 === 0 && i > 0 ? (
              <text key={i} x={x(i)} y={PLOT_H - 8} fontSize={10.5} textAnchor="middle" fill="var(--fg-muted)" className="num">
                bar {i}
              </text>
            ) : null,
          )}

      {/* Candles */}
      {spec.candles.map((c, i) => {
        const bull = c.c >= c.o;
        const colour = bull ? "var(--bull)" : "var(--bear)";
        const top = y(Math.max(c.o, c.c));
        const bot = y(Math.min(c.o, c.c));
        return (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={colour} strokeWidth={1} strokeOpacity={0.8} />
            <rect x={x(i) - candleW / 2} y={top} width={candleW} height={Math.max(1, bot - top)} fill={colour} fillOpacity={bull ? 0.85 : 0.9} rx={0.5} />
          </g>
        );
      })}

      {/* Annotations, cumulative. Earlier steps stay but step back. */}
      {spec.steps.map((s, si) => (
        <g
          key={si}
          style={{ opacity: si > step ? 0 : si === step ? 1 : 0.45, transition: "opacity 350ms ease" }}
          pointerEvents={si > step ? "none" : undefined}
        >
          {s.annos.map((a, ai) => renderAnno(a, `${si}-${ai}`))}
        </g>
      ))}

      {/* The overlay panel */}
      {spec.overlay && overlayPath && (
        <g>
          <line x1={M.l} x2={W - M.r} y1={PLOT_H} y2={PLOT_H} stroke="rgba(255,255,255,0.1)" />
          <text x={M.l + 4} y={PLOT_H + 12} fontSize={10.5} fill="var(--fg-muted)" style={{ fontFamily: "var(--font-sans)" }}>
            {spec.overlay.label}
          </text>
          <text x={W - M.r + 8} y={overlayPath.top + 4} fontSize={10.5} fill="var(--fg-muted)" className="num">
            {overlayPath.max.toFixed(decimals)}
            {spec.overlay.unit ?? ""}
          </text>
          <text x={W - M.r + 8} y={overlayPath.bottom + 4} fontSize={10.5} fill="var(--fg-muted)" className="num">
            {overlayPath.min.toFixed(decimals)}
            {spec.overlay.unit ?? ""}
          </text>
          <path d={overlayPath.d} fill="none" stroke={STROKE[spec.overlay.tone ?? "accent"]} strokeWidth={2} strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
