"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AreaSeries, createChart, type Time } from "lightweight-charts";

export interface HistoryPoint {
  ts: number; // epoch milliseconds
  pL: number;
}

/** The mastery-over-time area chart. lightweight-charts, teal on the void. */
export function MasteryChart({ points, ariaLabel }: { points: HistoryPoint[]; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || points.length === 0) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 200,
      layout: { background: { color: "transparent" }, textColor: "#908F9E", fontSize: 11 },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#2DD4BF",
      topColor: "rgba(45,212,191,0.25)",
      bottomColor: "rgba(45,212,191,0.0)",
      lineWidth: 2,
      priceFormat: { type: "percent" },
    });

    // De-duplicate the timestamps. lightweight-charts insists they're ascending and unique.
    const seen = new Set<number>();
    const data = points
      .slice()
      .sort((a, b) => a.ts - b.ts)
      .filter((p) => {
        const t = Math.floor(p.ts / 1000);
        if (seen.has(t)) return false;
        seen.add(t);
        return true;
      })
      .map((p) => ({ time: Math.floor(p.ts / 1000) as Time, value: p.pL * 100 }));

    series.setData(data);
    chart.timeScale().fitContent();

    const onResize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [points]);

  if (points.length === 0) {
    // The empty state. A dashed curve draws itself in so the card still
    // feels alive before there's any data, and the copy sits on top of it.
    return (
      <div className="relative flex h-[200px] items-center justify-center overflow-hidden rounded-control">
        <svg
          aria-hidden="true"
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="tm-empty-curve" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--mastery)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <clipPath id="tm-empty-clip">
            <motion.rect
              x="0"
              y="0"
              height="200"
              initial={reduced ? { width: 600 } : { width: 0 }}
              animate={{ width: 600 }}
              transition={{ duration: 1.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </clipPath>
          {[50, 100, 150].map((y) => (
            <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />
          ))}
          <path
            clipPath="url(#tm-empty-clip)"
            d="M 0 168 C 60 160, 90 130, 140 138 S 220 150, 260 118 S 340 80, 390 92 S 470 60, 520 44 S 580 30, 600 26"
            fill="none"
            stroke="url(#tm-empty-curve)"
            strokeWidth="2"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
        </svg>
        <p className="relative rounded-pill bg-[rgba(16,16,24,0.85)] px-4 py-2 text-sm text-fg-secondary shadow-hairline backdrop-blur-sm">
          Complete a practice session to see your mastery curve.
        </p>
      </div>
    );
  }

  return <div ref={ref} role="img" aria-label={ariaLabel} />;
}
