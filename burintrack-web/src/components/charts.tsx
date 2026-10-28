import { useId, useState, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Courbe lissée (Catmull-Rom → Bézier)                               */
/* ------------------------------------------------------------------ */
type Pt = [number, number];

function smoothPath(points: Pt[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0]![0]} ${points[0]![1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/*  Graphique en aires (2 séries)                                      */
/* ------------------------------------------------------------------ */
export interface AreaDatum {
  label: string;
  a: number;
  b: number;
}

export function AreaChart({
  data,
  labelA,
  labelB,
  colorA = '#6366f1',
  colorB = '#f43f5e',
}: {
  data: AreaDatum[];
  labelA: string;
  labelB: string;
  colorA?: string;
  colorB?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);

  const W = 640;
  const H = 260;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const max = Math.max(4, ...data.map((d) => Math.max(d.a, d.b)));
  const niceMax = Math.ceil(max / 4) * 4;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const x = (i: number) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;

  const ptsA: Pt[] = data.map((d, i) => [x(i), y(d.a)]);
  const ptsB: Pt[] = data.map((d, i) => [x(i), y(d.b)]);
  const lineA = smoothPath(ptsA);
  const lineB = smoothPath(ptsB);
  const baseY = padT + innerH;
  const areaA = `${lineA} L ${x(data.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`;
  const areaB = `${lineB} L ${x(data.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`;
  const ticks = [0, 1, 2, 3, 4].map((t) => (niceMax / 4) * t);

  const active = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Évolution mensuelle des interventions"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colorA} stopOpacity="0.32" />
            <stop offset="1" stopColor={colorA} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colorB} stopOpacity="0.22" />
            <stop offset="1" stopColor={colorB} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e8eaf2" strokeDasharray={t === 0 ? '0' : '4 6'} />
            <text x={padL - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8a90a9">
              {t}
            </text>
          </g>
        ))}

        <path d={areaA} fill={`url(#${uid}-a)`} />
        <path d={areaB} fill={`url(#${uid}-b)`} />
        <path d={lineA} fill="none" stroke={colorA} strokeWidth="3" strokeLinecap="round" />
        <path d={lineB} fill="none" stroke={colorB} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 0" />

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={baseY} stroke={colorA} strokeOpacity="0.25" strokeWidth="1.5" />
        )}

        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={x(i)} cy={y(d.a)} r={hover === i ? 6 : 4} fill="#fff" stroke={colorA} strokeWidth="2.5" />
            <circle cx={x(i)} cy={y(d.b)} r={hover === i ? 5 : 3} fill="#fff" stroke={colorB} strokeWidth="2" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fontWeight={hover === i ? 700 : 500} fill={hover === i ? '#2e2a7f' : '#656b85'}>
              {d.label}
            </text>
            <rect
              x={x(i) - innerW / data.length / 2}
              y={padT}
              width={innerW / data.length}
              height={innerH + padB}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseMove={() => setHover(i)}
            />
          </g>
        ))}
      </svg>

      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs shadow-lift"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <p className="mb-1 font-bold text-ink-900">{active.label}</p>
          <p className="flex items-center gap-2 text-ink-600">
            <span className="h-2 w-2 rounded-full" style={{ background: colorA }} />
            {labelA} <strong className="ml-auto pl-3 text-ink-900">{active.a}</strong>
          </p>
          <p className="flex items-center gap-2 text-ink-600">
            <span className="h-2 w-2 rounded-full" style={{ background: colorB }} />
            {labelB} <strong className="ml-auto pl-3 text-ink-900">{active.b}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Donut                                                              */
/* ------------------------------------------------------------------ */
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  slices,
  center,
  size = 190,
  thickness = 24,
}: {
  slices: DonutSlice[];
  center?: ReactNode;
  size?: number;
  thickness?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = total > 0 && slices.filter((s) => s.value > 0).length > 1 ? 4 : 0;

  let offset = 0;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eceef5" strokeWidth={thickness} />
        {total > 0 &&
          slices.map((s) => {
            const len = (s.value / total) * c;
            const dash = Math.max(0, len - gap);
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                className="transition-all duration-700"
              />
            );
            offset += len;
            return s.value > 0 ? el : null;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; value: number | string; color: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2.5 text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: i.color }} />
          <span className="text-ink-600">{i.label}</span>
          <span className="ml-auto font-semibold tabular-nums text-ink-900">{i.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Barres horizontales                                                */
/* ------------------------------------------------------------------ */
export function HBars({
  rows,
  colorTotal = '#c7d2fe',
  colorDone = '#6366f1',
}: {
  rows: { label: string; total: number; done: number }[];
  colorTotal?: string;
  colorDone?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-medium text-ink-800">{r.label}</span>
            <span className="shrink-0 text-xs text-ink-500">
              <strong className="text-ink-900">{r.done}</strong> / {r.total} résolues
            </span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="absolute inset-y-0 left-0 origin-left rounded-full animate-grow-x"
              style={{ width: `${(r.total / max) * 100}%`, background: colorTotal }}
            />
            <div
              className="absolute inset-y-0 left-0 origin-left rounded-full animate-grow-x"
              style={{ width: `${(r.done / max) * 100}%`, background: colorDone }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Barres empilées (NB / couleur)                                     */
/* ------------------------------------------------------------------ */
export function StackedBars({
  rows,
  format,
}: {
  rows: { label: string; a: number; b: number }[];
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.a + r.b));
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-medium text-ink-800">{r.label}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-600">{format(r.a + r.b)} pages</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-100" style={{ width: '100%' }}>
            <div
              className="h-full origin-left bg-ink-800 animate-grow-x"
              style={{ width: `${(r.a / max) * 100}%` }}
              title={`Noir & blanc : ${format(r.a)}`}
            />
            <div
              className="h-full origin-left bg-gradient-to-r from-brand-400 via-violet-400 to-rose-400 animate-grow-x"
              style={{ width: `${(r.b / max) * 100}%` }}
              title={`Couleur : ${format(r.b)}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini courbe                                                        */
/* ------------------------------------------------------------------ */
export function Sparkline({ values, color = '#6366f1' }: { values: number[]; color?: string }) {
  const uid = useId().replace(/:/g, '');
  if (values.length < 2) return null;
  const W = 120;
  const H = 36;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  const pts: Pt[] = values.map((v, i) => [(i / (values.length - 1)) * W, H - 4 - ((v - min) / span) * (H - 8)]);
  const line = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-full" aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill={`url(#${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
