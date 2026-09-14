"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pill } from "@/components/ui/pill";

/**
 * Diagrams for the lessons that aren't about a chart: the timeframe stack,
 * the session clock, how the two instrument types are wired, and the
 * prop-firm funnel. Drawn as SVG from the design tokens so they sit with
 * the walkthroughs, and each one carries a plain-text description for the
 * "Describe" toggle, the same as every chart on the site.
 */

interface DiagramSpec {
  title: string;
  describe: string;
  render: () => React.ReactNode;
}

const T = {
  fg: "var(--fg-primary)",
  sec: "var(--fg-secondary)",
  muted: "var(--fg-muted)",
  accent: "var(--accent-bright)",
  mastery: "var(--mastery-bright)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  line: "rgba(255,255,255,0.12)",
  box: "rgba(255,255,255,0.04)",
};
const font = { fontFamily: "var(--font-sans)" } as const;
const mono = { fontFamily: "var(--font-jetbrains), monospace" } as const;

function Box({ x, y, w, h, title, sub, tone = T.accent }: { x: number; y: number; w: number; h: number; title: string; sub?: string; tone?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={T.box} stroke={tone} strokeOpacity={0.45} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 5)} textAnchor="middle" fontSize={13} fontWeight={500} fill={T.fg} style={font}>
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" fontSize={11} fill={T.sec} style={font}>
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, tone = T.sec, label }: { x1: number; y1: number; x2: number; y2: number; tone?: string; label?: string }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx = (t: number) => x2 - Math.cos(ang + t) * 9;
  const hy = (t: number) => y2 - Math.sin(ang + t) * 9;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tone} strokeWidth={1.5} />
      <polygon points={`${x2},${y2} ${hx(0.45)},${hy(0.45)} ${hx(-0.45)},${hy(-0.45)}`} fill={tone} />
      {label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" fontSize={11} fill={tone} style={font}>
          {label}
        </text>
      )}
    </g>
  );
}

const timeframeStack: DiagramSpec = {
  title: "The timeframe stack: count on the higher, confirm on the lower",
  describe:
    "Six pairs, one per row: monthly with daily, weekly with 4-hour, daily with 1-hour, 4-hour with 15-minute, 1-hour with 5-minute, 15-minute with 1-minute. Each row has twelve to thirty lower-timeframe candles inside one higher-timeframe candle. The 1-hour and 5-minute pair is highlighted as the one to learn first, and an arrow shows that bias comes from the pair one row above the one you trade.",
  render: () => {
    const rows: [string, string, string][] = [
      ["Monthly", "Daily", "~21 inside"],
      ["Weekly", "4-hour", "30 inside"],
      ["Daily", "1-hour", "23 inside"],
      ["4-hour", "15-minute", "16 inside"],
      ["1-hour", "5-minute", "12 inside"],
      ["15-minute", "1-minute", "15 inside"],
    ];
    return (
      <svg viewBox="0 0 800 420" className="block w-full" role="img" aria-hidden="true">
        <text x={200} y={28} textAnchor="middle" fontSize={11} fill={T.muted} style={{ ...mono, letterSpacing: 2 }}>
          COUNT AND PROFILE
        </text>
        <text x={520} y={28} textAnchor="middle" fontSize={11} fill={T.muted} style={{ ...mono, letterSpacing: 2 }}>
          CISD AND ENTRY
        </text>
        {rows.map(([hi, lo, n], i) => {
          const y = 44 + i * 58;
          const hot = i === 4;
          const tone = hot ? T.mastery : T.accent;
          return (
            <g key={hi}>
              <Box x={90} y={y} w={220} h={44} title={hi} tone={tone} />
              <Arrow x1={314} y1={y + 22} x2={406} y2={y + 22} tone={tone} label={n} />
              <Box x={410} y={y} w={220} h={44} title={lo} tone={tone} />
              {hot && (
                <text x={650} y={y + 27} fontSize={11} fill={T.mastery} style={font}>
                  learn this pair first
                </text>
              )}
            </g>
          );
        })}
        {/* Bias comes from one row up. */}
        <path d="M 60 300 C 30 300 30 242 60 242" fill="none" stroke={T.warning} strokeWidth={1.5} strokeDasharray="4 3" />
        <polygon points="60,242 51,237 51,247" fill={T.warning} />
        <text x={22} y={276} fontSize={10.5} fill={T.warning} style={font} transform="rotate(-90 22 276)" textAnchor="middle">
          bias: one pair up
        </text>
        <text x={400} y={404} textAnchor="middle" fontSize={11.5} fill={T.sec} style={font}>
          12 to 30 lower-timeframe candles inside each higher-timeframe candle: enough to form a swing and a CISD, few enough to read.
        </text>
      </svg>
    );
  },
};

const sessionClock: DiagramSpec = {
  title: "The trading day as a clock (New York time)",
  describe:
    "A 24-hour ring starting at 18:00 at the top and running clockwise. Asia runs from 19:00 to 00:00 as a quiet range. Midnight is marked as the true day open. London runs 02:00 to 05:00 and makes the first real move. New York morning is 08:30 to 11:00, the highest-volume window, with the 10:00 to 11:00 Silver Bullet inside it. Lunch is 12:00 to 13:00. New York afternoon is 13:30 to 16:00. The maintenance break is 17:00 to 18:00.",
  render: () => {
    const cx = 400;
    const cy = 210;
    // 18:00 at the top, clockwise. Angle for a time in minutes since 18:00.
    const ang = (mins: number) => ((mins / (24 * 60)) * 360 - 90) * (Math.PI / 180);
    const since18 = (h: number, m = 0) => (((h - 18 + 24) % 24) * 60 + m);
    const pt = (mins: number, r: number) => [cx + Math.cos(ang(mins)) * r, cy + Math.sin(ang(mins)) * r] as const;
    const arc = (a: number, b: number, r1: number, r2: number) => {
      const [x1, y1] = pt(a, r2);
      const [x2, y2] = pt(b, r2);
      const [x3, y3] = pt(b, r1);
      const [x4, y4] = pt(a, r1);
      const large = b - a > 720 ? 1 : 0;
      return `M ${x1} ${y1} A ${r2} ${r2} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 ${large} 0 ${x4} ${y4} Z`;
    };
    const sessions: { from: number; to: number; label: string; tone: string; r: [number, number] }[] = [
      { from: since18(19), to: since18(0), label: "Asia 19:00 to 00:00", tone: T.muted, r: [118, 150] },
      { from: since18(2), to: since18(5), label: "London 02:00 to 05:00", tone: T.warning, r: [118, 150] },
      { from: since18(8, 30), to: since18(11), label: "NY AM 08:30 to 11:00", tone: T.mastery, r: [118, 150] },
      { from: since18(10), to: since18(11), label: "Silver Bullet", tone: T.mastery, r: [100, 116] },
      { from: since18(12), to: since18(13), label: "lunch", tone: T.muted, r: [118, 150] },
      { from: since18(13, 30), to: since18(16), label: "NY PM 13:30 to 16:00", tone: T.accent, r: [118, 150] },
      { from: since18(17), to: 1440, label: "break", tone: T.danger, r: [118, 150] },
    ];
    const hours = [18, 21, 0, 3, 6, 9, 12, 15];
    return (
      <svg viewBox="0 0 800 420" className="block w-full" role="img" aria-hidden="true">
        <circle cx={cx} cy={cy} r={150} fill="none" stroke={T.line} />
        <circle cx={cx} cy={cy} r={118} fill="none" stroke={T.line} />
        {sessions.map((s) => (
          <path key={s.label} d={arc(s.from, s.to, s.r[0], s.r[1])} fill={s.tone} fillOpacity={0.22} stroke={s.tone} strokeOpacity={0.7} />
        ))}
        {hours.map((h) => {
          const [x, y] = pt(since18(h), 166);
          return (
            <text key={h} x={x} y={y + 4} textAnchor="middle" fontSize={11} fill={T.muted} style={mono}>
              {String(h).padStart(2, "0")}:00
            </text>
          );
        })}
        {/* The true day open. */}
        {(() => {
          const [x1, y1] = pt(since18(0), 100);
          const [x2, y2] = pt(since18(0), 152);
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.accent} strokeWidth={2} />;
        })()}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={13} fontWeight={500} fill={T.fg} style={font}>
          one futures day
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill={T.sec} style={font}>
          18:00 to 17:00 ET, clockwise
        </text>
        {/* Legend */}
        {[
          ["Asia: sets the range", T.muted],
          ["00:00 true day open", T.accent],
          ["London: the first real move", T.warning],
          ["NY AM: the volume; Silver Bullet inside", T.mastery],
          ["Lunch: leave it", T.muted],
          ["NY PM: continue or reverse", T.accent],
          ["17:00 to 18:00 break", T.danger],
        ].map(([label, tone], i) => (
          <g key={label} transform={`translate(585 ${86 + i * 34})`}>
            <rect x={0} y={-8} width={12} height={12} rx={3} fill={tone} fillOpacity={0.6} />
            <text x={20} y={2} fontSize={11.5} fill={T.sec} style={font}>
              {label}
            </text>
          </g>
        ))}
      </svg>
    );
  },
};

const instrumentMap: DiagramSpec = {
  title: "Where your order goes: futures against CFDs",
  describe:
    "Two flows. Futures: you send an order to a broker, the broker routes it to the exchange, and the exchange's clearing house stands between buyer and seller, so there is one price for everyone and the broker never makes the price; regulated by the CFTC and NFA in the US, with visible commissions and no financing charge. CFDs: you send an order to a broker and the broker is the counterparty, quoting a price derived from the market with a spread added and charging financing every night held; retail accounts under FCA, ESMA or ASIC rules get leverage caps, a margin close-out and negative balance protection.",
  render: () => (
    <svg viewBox="0 0 800 420" className="block w-full" role="img" aria-hidden="true">
      <text x={200} y={30} textAnchor="middle" fontSize={11} fill={T.mastery} style={{ ...mono, letterSpacing: 2 }}>
        FUTURES
      </text>
      <Box x={40} y={60} w={120} h={48} title="You" tone={T.mastery} />
      <Arrow x1={164} y1={84} x2={216} y2={84} tone={T.mastery} label="order" />
      <Box x={220} y={60} w={140} h={48} title="Broker (FCM)" sub="routes, charges commission" tone={T.mastery} />
      <Arrow x1={290} y1={112} x2={290} y2={150} tone={T.mastery} />
      <Box x={200} y={154} w={180} h={48} title="Exchange (CME)" sub="one order book, one price" tone={T.mastery} />
      <Arrow x1={290} y1={206} x2={290} y2={244} tone={T.mastery} />
      <Box x={200} y={248} w={180} h={48} title="Clearing house" sub="stands between buyer and seller" tone={T.mastery} />
      {["CFTC / NFA regulated", "visible commission + fees", "no financing charge", "can lose more than deposit"].map((t, i) => (
        <text key={t} x={40} y={340 + i * 18} fontSize={11.5} fill={i === 3 ? T.danger : T.sec} style={font}>
          • {t}
        </text>
      ))}

      <line x1={400} y1={40} x2={400} y2={400} stroke={T.line} strokeDasharray="4 4" />

      <text x={600} y={30} textAnchor="middle" fontSize={11} fill={T.warning} style={{ ...mono, letterSpacing: 2 }}>
        CFD / SPREAD BET
      </text>
      <Box x={440} y={60} w={120} h={48} title="You" tone={T.warning} />
      <Arrow x1={564} y1={84} x2={616} y2={84} tone={T.warning} label="order" />
      <Box x={620} y={60} w={150} h={48} title="Broker" sub="is the counterparty" tone={T.warning} />
      <Arrow x1={695} y1={112} x2={695} y2={150} tone={T.warning} />
      <Box x={600} y={154} w={190} h={48} title="Broker's price" sub="market price + spread" tone={T.warning} />
      <path d="M 695 206 C 695 236 640 236 640 262" fill="none" stroke={T.muted} strokeDasharray="4 3" />
      <Box x={560} y={264} w={160} h={40} title="the real market" sub="referenced, not traded" tone={T.muted} />
      {["FCA / ESMA / ASIC retail rules", "leverage capped by asset", "50% close-out, no negative balance", "spread + financing every night"].map((t, i) => (
        <text key={t} x={440} y={340 + i * 18} fontSize={11.5} fill={i === 3 ? T.danger : T.sec} style={font}>
          • {t}
        </text>
      ))}
    </svg>
  ),
};

const propFirmFunnel: DiagramSpec = {
  title: "The evaluation funnel: where the money and the attempts go",
  describe:
    "Four stages left to right. One: the fee, paid up front and non-refundable. Two: the evaluation, a simulated account with a profit target, a daily loss limit, a maximum drawdown and a consistency rule; most attempts end here, at the drawdown. Three: the funded account, usually still simulated, paying a profit split with a first-payout delay and denial conditions. Four: the payout, which depends on the firm staying solvent and willing. Underneath, the seven checks from the lesson: instrument and platform, drawdown type, rules you can follow, payout history, operating history, total cost per attempt, and the arithmetic of target against drawdown.",
  render: () => {
    const stages = [
      ["1. The fee", "paid up front, not refunded", T.warning],
      ["2. Evaluation", "simulated account, target + rules", T.accent],
      ["3. Funded", "usually still simulated; a split", T.mastery],
      ["4. Payout", "if the firm can and will", T.mastery],
    ] as const;
    return (
      <svg viewBox="0 0 800 420" className="block w-full" role="img" aria-hidden="true">
        {stages.map(([title, sub, tone], i) => (
          <g key={title}>
            <Box x={30 + i * 190} y={50} w={170} h={64} title={title} sub={sub} tone={tone} />
            {i < 3 && <Arrow x1={204 + i * 190} y1={82} x2={216 + i * 190} y2={82} tone={T.sec} />}
          </g>
        ))}
        {/* The leak: most attempts end in the evaluation, at the drawdown. */}
        <path d="M 305 118 C 305 170 240 170 240 210" fill="none" stroke={T.danger} strokeWidth={1.5} strokeDasharray="4 3" />
        <polygon points="240,210 235,201 245,201" fill={T.danger} />
        <text x={150} y={232} fontSize={11.5} fill={T.danger} style={font}>
          most attempts end here: the drawdown floor, not the target
        </text>
        <text x={400} y={272} textAnchor="middle" fontSize={11} fill={T.muted} style={{ ...mono, letterSpacing: 2 }}>
          THE SEVEN CHECKS, IN ORDER
        </text>
        {[
          "1 instrument & platform",
          "2 drawdown type fits you",
          "3 rules you can follow",
          "4 payout history & denials",
          "5 operating history, warnings",
          "6 total cost per attempt",
          "7 target vs drawdown maths",
        ].map((t, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return (
            <text key={t} x={60 + col * 185} y={300 + row * 26} fontSize={11.5} fill={T.sec} style={font}>
              {t}
            </text>
          );
        })}
        <text x={400} y={392} textAnchor="middle" fontSize={11.5} fill={T.fg} style={font}>
          A leverage product with a subscription fee. Sensible after fifty A-grade journal trades; tuition before that.
        </text>
      </svg>
    );
  },
};

export const DIAGRAMS: Record<string, DiagramSpec> = {
  "timeframe-stack": timeframeStack,
  "session-clock": sessionClock,
  "instrument-map": instrumentMap,
  "prop-firm-funnel": propFirmFunnel,
};

export function Diagram({ id }: { id: string }) {
  const [describe, setDescribe] = useState(false);
  const spec = DIAGRAMS[id];
  if (!spec) return null;
  return (
    <figure id={`diagram-${id}`} className="scroll-mt-32">
      <div className="relative overflow-hidden rounded-card bg-bg-elevated shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Pill tone="accent" dot>
              Diagram
            </Pill>
            <span className="truncate text-sm font-medium text-fg-primary">{spec.title}</span>
          </div>
          <button
            onClick={() => setDescribe((d) => !d)}
            aria-expanded={describe}
            className="rounded-pill bg-[rgba(5,5,7,0.8)] px-3 py-1.5 text-label-caps uppercase tracking-wider text-mastery-bright shadow-hairline transition-[background-color,box-shadow] duration-200 hover:bg-bg-deep hover:shadow-[inset_0_0_0_1px_var(--mastery-glow)]"
          >
            {describe ? "Hide description" : "Describe this diagram"}
          </button>
        </div>
        <div className="px-2 pb-2 pt-1">{spec.render()}</div>
      </div>
      <AnimatePresence>
        {describe && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden rounded-control bg-white/5 p-4 text-sm leading-6 text-fg-secondary"
          >
            {spec.describe}
          </motion.p>
        )}
      </AnimatePresence>
    </figure>
  );
}
