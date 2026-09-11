"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  type BusinessDay,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { Pill } from "@/components/ui/pill";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface AnnotationValue {
  time: string;
  price: number;
}

interface AnnotationProps {
  candles: Candle[];
  describe: string;
  value: AnnotationValue | null;
  onChange(v: AnnotationValue): void;
  disabled?: boolean;
  /** Once graded, the correct zone to reveal. */
  revealZone?: { from: string; to: string; priceLow: number; priceHigh: number } | null;
}

function timeToString(t: Time): string {
  if (typeof t === "string") return t;
  if (typeof t === "object") {
    const b = t as BusinessDay;
    return `${b.year}-${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;
  }
  return String(t);
}

/**
 * The chart-annotation question. Tap the chart to drop a marker, and once
 * you've answered the correct zone shows up as a translucent overlay.
 * Simulated data only. The chart reads --bull and --bear, so colour-blind
 * mode swaps the candles automatically. And every chart carries a "Describe
 * this chart" text alternative (guardrail 7.4).
 */
export function AnnotationChart({
  candles,
  describe,
  value,
  onChange,
  disabled,
  revealZone,
}: AnnotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [zoneRect, setZoneRect] = useState<{ left: number; width: number; top: number; height: number } | null>(null);
  const [showDescribe, setShowDescribe] = useState(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const styles = getComputedStyle(document.documentElement);
    const bull = styles.getPropertyValue("--bull").trim() || "#2DD4BF";
    const bear = styles.getPropertyValue("--bear").trim() || "#FFB4AB";

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 320,
      layout: { background: { color: "transparent" }, textColor: "#908F9E", fontSize: 11 },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      timeScale: { borderColor: "rgba(255,255,255,0.08)" },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: bull,
      downColor: bear,
      wickUpColor: bull,
      wickDownColor: bear,
      borderVisible: false,
    });
    series.setData(candles as { time: Time; open: number; high: number; low: number; close: number }[]);
    chart.timeScale().fitContent();

    chart.subscribeClick((param) => {
      if (disabledRef.current || !param.time || !param.point) return;
      const price = series.coordinateToPrice(param.point.y);
      if (price === null) return;
      onChangeRef.current({ time: timeToString(param.time), price: Math.round(price * 100) / 100 });
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const onResize = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  // The learner's marker
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    const markers = createSeriesMarkers(series, []);
    if (value) {
      markers.setMarkers([
        {
          time: value.time as Time,
          position: "inBar",
          color: "#BDC2FF",
          shape: "circle",
          text: "you",
        },
      ]);
    }
    return () => markers.detach();
  }, [value]);

  // The correct-zone overlay
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series || !revealZone) {
      setZoneRect(null);
      return;
    }
    const x1 = chart.timeScale().timeToCoordinate(revealZone.from as Time);
    const x2 = chart.timeScale().timeToCoordinate(revealZone.to as Time);
    const y1 = series.priceToCoordinate(revealZone.priceHigh);
    const y2 = series.priceToCoordinate(revealZone.priceLow);
    if (x1 === null || x2 === null || y1 === null || y2 === null) return;
    setZoneRect({ left: x1, width: x2 - x1, top: y1, height: y2 - y1 });
  }, [revealZone]);

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-card bg-bg-elevated p-2 shadow-edge-lit">
        <div ref={containerRef} aria-hidden="true" className={disabled ? "" : "cursor-crosshair"} />
        {zoneRect && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded border border-mastery bg-mastery/15"
            style={{
              left: zoneRect.left + 8,
              top: zoneRect.top + 8,
              width: zoneRect.width,
              height: zoneRect.height,
            }}
          />
        )}
        <button
          onClick={() => setShowDescribe((d) => !d)}
          aria-expanded={showDescribe}
          className="absolute right-3 top-3 rounded-pill bg-bg-deep/80 px-3 py-1.5 text-label-caps uppercase tracking-wider text-mastery-bright shadow-hairline backdrop-blur-sm"
        >
          Describe this chart
        </button>
      </div>
      {showDescribe && (
        <p className="rounded-control bg-white/5 p-4 text-sm leading-6 text-fg-secondary">{describe}</p>
      )}
      <div className="flex items-center justify-between">
        <Pill tone="warning" dot>
          Simulated data
        </Pill>
        <p aria-live="polite" className="num text-sm text-fg-secondary">
          {value ? `Marker: ${value.time} @ ${value.price}` : "Tap the chart to place your marker"}
        </p>
      </div>
    </div>
  );
}
