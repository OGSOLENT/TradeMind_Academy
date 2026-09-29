/** Deterministic pseudo-random, so the field looks identical on every render. */
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

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
      <div
        className="tm-grid"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Indigo, the action colour, top-left. */}
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
          {/* Mastery teal, the progress colour, bottom-right. */}
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

          <CandleLayer className="tm-candles" count={30} seed={3} opacity={0.075} size="900px 520px" />
          <CandleLayer className="tm-candles" count={20} seed={11} opacity={0.10} size="1400px 800px" />
          <CandleLayer className="tm-candles" count={12} seed={29} opacity={0.07} size="2100px 1200px" />
        </>
      )}

      {!calm && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(102deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 2px, transparent 2px, transparent 190px), repeating-linear-gradient(102deg, rgba(139,124,246,0.03) 0px, rgba(139,124,246,0.03) 60px, transparent 60px, transparent 340px)",
            maskImage:
              "radial-gradient(90% 70% at 18% 0%, #000 0%, rgba(0,0,0,0.5) 45%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(90% 70% at 18% 0%, #000 0%, rgba(0,0,0,0.5) 45%, transparent 78%)",
          }}
        />
      )}

      <div
        className="absolute inset-x-0 top-0 h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(94,106,210,0.22), rgba(94,106,210,0.06) 45%, transparent 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="180" height="180" filter="url(#n)" opacity="0.5"/></svg>',
          )}")`,
          backgroundSize: "180px 180px",
        }}
      />

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
