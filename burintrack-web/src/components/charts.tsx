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
  colorA = '#CC1416',
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
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto' }}
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
        <path d={lineB} fill="none" stroke={colorB} strokeWidth="2.5" strokeLinecap="round" />

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={baseY} stroke={colorA} strokeOpacity="0.25" strokeWidth="1.5" />
        )}

        {data.map((d, i) => (
          <g key={d.label}>
            <circle cx={x(i)} cy={y(d.a)} r={hover === i ? 6 : 4} fill="#fff" stroke={colorA} strokeWidth="2.5" />
            <circle cx={x(i)} cy={y(d.b)} r={hover === i ? 5 : 3} fill="#fff" stroke={colorB} strokeWidth="2" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fontWeight={hover === i ? 700 : 500} fill={hover === i ? colorA : '#656b85'}>
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
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            top: 8,
            left: `${(x(hover) / W) * 100}%`,
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.78rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="fw-bold mb-1" style={{ color: '#343a40' }}>{active.label}</div>
          <div className="d-flex align-items-center gap-2 text-muted">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorA, display: 'inline-block' }} />
            {labelA} <strong className="ms-auto ps-2" style={{ color: '#343a40' }}>{active.a}</strong>
          </div>
          <div className="d-flex align-items-center gap-2 text-muted">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorB, display: 'inline-block' }} />
            {labelB} <strong className="ms-auto ps-2" style={{ color: '#343a40' }}>{active.b}</strong>
          </div>
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
    <div style={{ position: 'relative', margin: '0 auto', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
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
                style={{ transition: 'all 0.7s ease' }}
              />
            );
            offset += len;
            return s.value > 0 ? el : null;
          })}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {center}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; value: number | string; color: string }[] }) {
  return (
    <ul className="list-unstyled mb-0">
      {items.map((i) => (
        <li key={i.label} className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '0.85rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: i.color, flexShrink: 0 }} />
          <span className="text-muted">{i.label}</span>
          <span className="ms-auto fw-semibold" style={{ color: '#343a40', fontVariantNumeric: 'tabular-nums' }}>{i.value}</span>
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
  colorTotal = '#fecaca',
  colorDone  = '#CC1416',
}: {
  rows: { label: string; total: number; done: number }[];
  colorTotal?: string;
  colorDone?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <ul className="list-unstyled mb-0">
      {rows.map((r) => (
        <li key={r.label} className="mb-3">
          <div className="d-flex align-items-baseline justify-content-between gap-2 mb-1" style={{ fontSize: '0.85rem' }}>
            <span className="text-truncate fw-medium" style={{ color: '#343a40' }}>{r.label}</span>
            <span className="flex-shrink-0 text-muted" style={{ fontSize: '0.75rem' }}>
              <strong style={{ color: '#343a40' }}>{r.done}</strong> / {r.total} résolues
            </span>
          </div>
          <div style={{ position: 'relative', height: 10, borderRadius: '50rem', background: '#e9ecef', overflow: 'hidden' }}>
            <div
              className="animate-grow-x"
              style={{ position: 'absolute', inset: '0 auto 0 0', height: '100%', borderRadius: '50rem', width: `${(r.total / max) * 100}%`, background: colorTotal }}
            />
            <div
              className="animate-grow-x"
              style={{ position: 'absolute', inset: '0 auto 0 0', height: '100%', borderRadius: '50rem', width: `${(r.done / max) * 100}%`, background: colorDone }}
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
    <ul className="list-unstyled mb-0">
      {rows.map((r) => (
        <li key={r.label} className="mb-3">
          <div className="d-flex align-items-baseline justify-content-between gap-2 mb-1" style={{ fontSize: '0.85rem' }}>
            <span className="text-truncate fw-medium" style={{ color: '#343a40' }}>{r.label}</span>
            <span className="flex-shrink-0 fw-semibold text-muted" style={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
              {format(r.a + r.b)} pages
            </span>
          </div>
          <div style={{ display: 'flex', height: 10, borderRadius: '50rem', background: '#e9ecef', overflow: 'hidden', width: '100%' }}>
            <div
              className="animate-grow-x"
              style={{ height: '100%', width: `${(r.a / max) * 100}%`, background: '#343a40' }}
              title={`Noir & blanc : ${format(r.a)}`}
            />
            <div
              className="animate-grow-x"
              style={{ height: '100%', width: `${(r.b / max) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #8b5cf6, #f43f5e)' }}
              title={`Couleur : ${format(r.b)}`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini courbe sparkline                                              */
/* ------------------------------------------------------------------ */
export function Sparkline({ values, color = '#CC1416' }: { values: number[]; color?: string }) {
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
    <svg viewBox={`0 0 ${W} ${H}`} style={{ height: 36, width: '100%' }} aria-hidden="true">
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
