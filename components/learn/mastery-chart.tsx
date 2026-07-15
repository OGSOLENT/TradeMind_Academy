"use client";

import { useEffect, useRef } from "react";
import { AreaSeries, createChart, type Time } from "lightweight-charts";

export interface HistoryPoint {
  ts: number; // epoch ms
  pL: number;
}

/** Mastery-over-time area chart (lightweight-charts, teal on void). */
export function MasteryChart({ points, ariaLabel }: { points: HistoryPoint[]; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);

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

    // De-duplicate timestamps (lightweight-charts requires ascending unique).
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
    return (
      <p className="flex h-[200px] items-center justify-center text-sm text-fg-muted">
        Complete a practice session to see your mastery curve.
      </p>
    );
  }

  return <div ref={ref} role="img" aria-label={ariaLabel} />;
}
