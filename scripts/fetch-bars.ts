/**
 * Pulls historical bars for the real-chart case studies.
 *
 *   npx tsx scripts/fetch-bars.ts
 *
 * Source: Yahoo Finance's public chart endpoint, the same data its site
 * shows. It's used here for education with attribution and never live: the
 * case studies are cut from history, dated, and labelled with the source.
 * Daily bars go back years, hourly bars about two years, and 5-minute bars
 * only the last sixty days, which is why the intraday case studies are
 * drawn from recent weeks.
 *
 * The raw pulls land in content/bars/ (gitignored, a few megabytes). The
 * committed artefacts are the small slices scripts/find-case-studies.ts
 * cuts from them.
 */
import { mkdirSync, writeFileSync } from "node:fs";

export interface Bar {
  /** Unix seconds, UTC. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

const PULLS: { symbol: string; interval: string; range: string }[] = [
  { symbol: "ES=F", interval: "1d", range: "2y" },
  { symbol: "ES=F", interval: "1h", range: "730d" },
  { symbol: "ES=F", interval: "5m", range: "60d" },
  { symbol: "NQ=F", interval: "5m", range: "60d" },
  { symbol: "NQ=F", interval: "1h", range: "730d" },
];

async function pull(symbol: string, interval: string, range: string): Promise<Bar[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (TradeMind Academy case studies)" } });
  if (!res.ok) throw new Error(`${symbol} ${interval}: HTTP ${res.status}`);
  const json = (await res.json()) as {
    chart: { result?: { timestamp: number[]; indicators: { quote: { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[] }[] } }[]; error?: { description?: string } };
  };
  const r = json.chart.result?.[0];
  if (!r) throw new Error(`${symbol} ${interval}: ${json.chart.error?.description ?? "no result"}`);
  const q = r.indicators.quote[0]!;
  const out: Bar[] = [];
  r.timestamp.forEach((t, i) => {
    const o = q.open[i];
    const h = q.high[i];
    const l = q.low[i];
    const c = q.close[i];
    if (o == null || h == null || l == null || c == null) return;
    out.push({ t, o, h, l, c });
  });
  return out;
}

async function main() {
  mkdirSync("content/bars", { recursive: true });
  const retrieved = new Date().toISOString().slice(0, 10);
  for (const p of PULLS) {
    const bars = await pull(p.symbol, p.interval, p.range);
    const file = `content/bars/${p.symbol.replace("=", "")}-${p.interval}.json`;
    writeFileSync(file, JSON.stringify({ symbol: p.symbol, interval: p.interval, retrieved, source: "Yahoo Finance", bars }));
    const first = new Date(bars[0]!.t * 1000).toISOString().slice(0, 10);
    const last = new Date(bars[bars.length - 1]!.t * 1000).toISOString().slice(0, 10);
    console.log(`${p.symbol} ${p.interval}: ${bars.length} bars, ${first} to ${last} → ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
