/**
 * Ambient background.
 *
 * Three parallax layers over the void:
 *   1. a drifting graph-paper grid — the surface every chart is drawn on
 *   2. aurora blobs in the brand's indigo / violet / mastery-teal
 *   3. a slow field of candlestick silhouettes at three depths
 *
 * The candles are the point. A gradient could belong to any product; a market
 * drifting past behind the glass belongs to this one. The three layers move at
 * different speeds so the field has depth rather than sliding as one sheet.
 *
 * Cost, measured rather than assumed. Each animated full-screen layer costs
 * roughly 18fps of compositor budget; the same layers held still are free
 * (120fps, identical to no background at all). So the field is STATIC except
 * one drifting blob. The motion budget goes where it is actually perceptible —
 * entrance choreography, hover, counters, scroll reveals — instead of into a
 * 40-second drift nobody can see. An earlier blurred rotating sweep measured
 * 120fps → 19fps and was cut outright (docs/DECISIONS.md).
 *
 * Variants
 * - `ambient` (default): the full field. Reading and navigation.
 * - `calm`: grid + one static blob, no candles, no motion. Quiz focus mode,
 *   where movement beside a question would confound the response latency we
 *   record as research data.
 *
 * Motion respects both `prefers-reduced-motion` and the in-app
 * `data-motion="reduced"` setting (globals.css) — everything simply holds still.
 */

/** Deterministic pseudo-random so the field is identical on every render. */
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * A tileable candlestick field, emitted as an SVG data URI and used as a CSS
 * background image.
 *
 * Live <svg> was the first attempt and it cost ~19fps: the browser re-rasterises
 * ~100 vector nodes on every animation frame. As a background image it is
 * rasterised once, after which the drift is pure compositing.
 */
function candleFieldUrl(count: number, seed: number, bull: string, bear: string) {
  const W = 1600;
  const H = 900;
  let body = "";
  for (let i = 0; i < count; i++) {
    const s = seed + i * 7.31;
    const w = 10 + rand(s) * 16;
    const bodyH = 26 + rand(s + 1) * 90;
    const wickH = bodyH + 24 + rand(s + 4) * 70;
    const x = rand(s + 2) * W;
    const y = rand(s + 3) * H;
    const up = rand(s + 5) > 0.45;
    const c = up ? bull : bear;
    const wickTop = y - (wickH - bodyH) / 2;
    body +=
      `<line x1="${(x + w / 2).toFixed(1)}" y1="${wickTop.toFixed(1)}" x2="${(x + w / 2).toFixed(1)}" y2="${(wickTop + wickH).toFixed(1)}" stroke="${c}" stroke-width="2"/>` +
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${bodyH.toFixed(1)}" rx="2" fill="${up ? c : "none"}" fill-opacity="0.5" stroke="${c}" stroke-width="2"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* Resolved hex rather than var() — a data URI has no access to the document's
   custom properties. Colour-blind mode swaps --bull/--bear for charts; this
   decorative field keeps the canonical pair. */
const BULL = "#2DD4BF";
const BEAR = "#FFB4AB";

function CandleLayer({
  count,
  seed,
  className,
  opacity,
  size,
}: {
  count: number;
  seed: number;
  className: string;
  opacity: number;
  size: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        opacity,
        backgroundImage: candleFieldUrl(count, seed, BULL, BEAR),
        backgroundSize: size,
        backgroundRepeat: "repeat",
      }}
    />
  );
}

export function AmbientBackground({ variant = "ambient" }: { variant?: "ambient" | "calm" }) {
  const calm = variant === "calm";

  return (
    <div
      aria-hidden="true"
      data-ambient={variant}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Graph paper, drifting diagonally so the field reads as moving even
          where nothing else is happening. */}
      <div
        className="tm-grid"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Indigo — the action colour, top-left. */}
      <div
        className="tm-blob"
        style={{
          top: "-20%",
          left: "-14%",
          width: "min(85vw, 1000px)",
          height: "min(85vw, 1000px)",
          background:
            "radial-gradient(circle, rgba(94,106,210,0.42) 0%, rgba(94,106,210,0.15) 40%, transparent 70%)",
          opacity: calm ? 0.4 : 1,
        }}
      />

      {!calm && (
        <>
          {/* Mastery teal — progress colour, bottom-right. */}
          <div
            className="tm-blob"
            style={{
              bottom: "-26%",
              right: "-16%",
              width: "min(78vw, 900px)",
              height: "min(78vw, 900px)",
              background:
                "radial-gradient(circle, rgba(45,212,191,0.30) 0%, rgba(45,212,191,0.10) 44%, transparent 72%)",
            }}
          />
          {/* Violet bridge between the two poles. */}
          <div
            className={calm ? "tm-blob tm-blob-centre" : "tm-blob tm-blob-centre tm-blob-drift-c"}
            style={{
              top: "34%",
              left: "48%",
              width: "min(70vw, 820px)",
              height: "min(70vw, 820px)",
              background:
                "radial-gradient(circle, rgba(139,124,246,0.26) 0%, rgba(139,124,246,0.08) 45%, transparent 70%)",
            }}
          />
          {/* A warm ember low-left so the palette isn't only cool. */}
          <div
            className="tm-blob"
            style={{
              bottom: "-18%",
              left: "6%",
              width: "min(52vw, 620px)",
              height: "min(52vw, 620px)",
              background: "radial-gradient(circle, rgba(255,185,85,0.13) 0%, transparent 66%)",
              animationDuration: "74s",
            }}
          />

          {/* The market drifting past, at three depths. */}
          <CandleLayer className="tm-candles" count={30} seed={3} opacity={0.05} size="900px 520px" />
          <CandleLayer className="tm-candles" count={20} seed={11} opacity={0.075} size="1400px 800px" />
          <CandleLayer className="tm-candles" count={12} seed={29} opacity={0.05} size="2100px 1200px" />
        </>
      )}

      {/* Horizon glow behind the fixed nav, so the glass bar refracts
          something instead of pure void. */}
      <div
        className="absolute inset-x-0 top-0 h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(94,106,210,0.22), rgba(94,106,210,0.06) 45%, transparent 100%)",
        }}
      />

      {/* Vignette: pulls attention back to the reading column. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 100% at 50% 35%, transparent 52%, rgba(5,5,7,0.5) 100%)",
        }}
      />
    </div>
  );
}
