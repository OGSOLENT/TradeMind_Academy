/**
 * Ambient background — the "Aurora Blobs" the design system calls for:
 * slow-moving, low-opacity organic shapes over a faint graph-paper grid,
 * giving the void a sense of life without competing with data.
 *
 * Deliberately CSS-only. The dashboard and quiz already run charts, springs
 * and a BKT update on every answer; a canvas loop here would fight them for
 * the main thread. These layers animate `transform` only, so the compositor
 * handles them and the main thread never sees a frame.
 *
 * Variants
 * - `ambient` (default): grid + three drifting blobs. Reading and navigation.
 * - `calm`: grid + one static blob at half strength. Used in quiz focus mode,
 *   where anything moving beside a question is a confound in the response
 *   latency we record as research data.
 *
 * Motion respects both `prefers-reduced-motion` and the in-app
 * `data-motion="reduced"` setting (see globals.css) — the blobs simply stop
 * drifting and the composition stands still.
 */
export function AmbientBackground({ variant = "ambient" }: { variant?: "ambient" | "calm" }) {
  const calm = variant === "calm";

  return (
    <div
      aria-hidden="true"
      data-ambient={variant}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Graph-paper grid: the subject's own texture, faded out toward the
          edges so it never frames the content like a box. */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(120% 80% at 50% 0%, #000 30%, rgba(0,0,0,0.35) 65%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(120% 80% at 50% 0%, #000 30%, rgba(0,0,0,0.35) 65%, transparent 100%)",
        }}
      />

      {/* Indigo aurora — the action colour, anchored top-left. */}
      <div
        className={calm ? "tm-blob" : "tm-blob tm-blob-drift-a"}
        style={{
          top: "-18%",
          left: "-12%",
          width: "min(78vw, 900px)",
          height: "min(78vw, 900px)",
          background:
            "radial-gradient(circle, rgba(94,106,210,0.30) 0%, rgba(94,106,210,0.11) 42%, transparent 70%)",
          opacity: calm ? 0.45 : 1,
        }}
      />

      {/* Mastery teal — progress colour, bottom-right, the quieter counterweight. */}
      {!calm && (
        <div
          className="tm-blob tm-blob-drift-b"
          style={{
            bottom: "-24%",
            right: "-14%",
            width: "min(70vw, 820px)",
            height: "min(70vw, 820px)",
            background:
              "radial-gradient(circle, rgba(45,212,191,0.20) 0%, rgba(45,212,191,0.07) 45%, transparent 72%)",
          }}
        />
      )}

      {/* Deep centre wash — keeps the middle of long reading columns from
          reading as flat black on large displays. */}
      {!calm && (
        <div
          className="tm-blob tm-blob-drift-c"
          style={{
            top: "38%",
            left: "45%",
            width: "min(60vw, 700px)",
            height: "min(60vw, 700px)",
            background:
              "radial-gradient(circle, rgba(139,124,246,0.16) 0%, transparent 66%)",
          }}
        />
      )}

      {/* Violet bridge between the indigo and teal poles — pure gradient,
          no filter, so it costs a translate and nothing else. */}
      {!calm && (
        <div
          className="tm-blob tm-blob-drift-b"
          style={{
            top: "-10%",
            right: "8%",
            width: "min(66vw, 760px)",
            height: "min(66vw, 760px)",
            background:
              "radial-gradient(circle, rgba(139,124,246,0.16) 0%, rgba(139,124,246,0.05) 45%, transparent 70%)",
            animationDuration: "61s",
          }}
        />
      )}

      {/* Horizon glow behind the fixed nav, so the glass bar has something to
          refract instead of pure void. */}
      <div
        className="absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "linear-gradient(to bottom, rgba(94,106,210,0.16), rgba(94,106,210,0.05) 45%, transparent 100%)",
        }}
      />

      {/* Vignette: pulls attention back to the reading column. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 38%, transparent 55%, rgba(5,5,7,0.38) 100%)",
        }}
      />
    </div>
  );
}
