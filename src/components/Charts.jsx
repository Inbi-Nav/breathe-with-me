import { formatClock } from '../lib/format';

export function ArcGauge({ value, label }) {
  const hasValue = Number.isFinite(value);
  const arc = 'M 20 100 A 80 80 0 0 1 180 100';
  return (
    <svg className="gauge" viewBox="0 0 200 120" role="img"
      aria-label={hasValue ? `Coherence score ${value} percent, ${label}` : 'Coherence score not available'}>
      <defs>
        <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3d7fd6" />
          <stop offset="1" stopColor="#8cc8ff" />
        </linearGradient>
      </defs>
      <path d={arc} className="gauge-track" pathLength="100" />
      {hasValue && (
        <path d={arc} className="gauge-fill" pathLength="100" strokeDasharray={`${value} 100`} />
      )}
      <text x="100" y="92" textAnchor="middle" className="gauge-value">{hasValue ? `${value}%` : '—'}</text>
      <text x="100" y="112" textAnchor="middle" className="gauge-label">{label}</text>
    </svg>
  );
}

function curve(points) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}

function movingAverage(values, radius = 2) {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - radius), i + radius + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

// Breathing rate over the session: the live line (blue), a smoothed
// average (gold) and the calm range (10 to 14 breaths a minute).
export function TrendChart({ trend, duration }) {
  const W = 560, H = 240, L = 38, R = 14, T = 14, B = 28;
  if (!trend || trend.length < 2) {
    return <p className="muted">Not enough readings to draw a trend.</p>;
  }
  const values = trend.map((p) => p.value);
  const smooth = movingAverage(values);
  const lo = Math.floor(Math.min(...values, 10) - 1);
  const hi = Math.ceil(Math.max(...values, 14) + 1);
  const span = Math.max(hi - lo, 4);
  const maxT = Math.max(trend[trend.length - 1].t, 1);
  const x = (t) => L + (t / maxT) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / span) * (H - T - B);

  const rawPts = trend.map((p) => [x(p.t), y(p.value)]);
  const smoothPts = trend.map((p, i) => [x(p.t), y(smooth[i])]);
  const yTicks = [0, 1, 2, 3, 4].map((i) => lo + (span * i) / 4);
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxT);
  const bandTop = y(Math.min(14, hi));
  const bandBottom = y(Math.max(10, lo));

  return (
    <div>
      <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Breathing rate over ${Math.round(duration / 60)} minutes, between ${Math.round(Math.min(...values))} and ${Math.round(Math.max(...values))} breaths per minute`}>
        <rect x={L} y={bandTop} width={W - L - R} height={Math.max(0, bandBottom - bandTop)} className="calm-band" />
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid-line" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" className="axis-text">{Math.round(v)}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="axis-text">{formatClock(t)}</text>
        ))}
        <path d={curve(rawPts)} className="trend-line trend-raw" />
        <path d={curve(smoothPts)} className="trend-line trend-smooth" />
      </svg>
      <ul className="chart-legend">
        <li><i className="dot dot-blue" />Breathing rate</li>
        <li><i className="dot dot-gold" />Smoothed average</li>
        <li><i className="swatch" />Calm range (10 to 14)</li>
      </ul>
    </div>
  );
}

// Progress over the last sessions, for one measure.
const METRICS = {
  coherence: { label: 'Coherence', unit: '%', domain: [0, 100] },
  breathing: { label: 'Breathing', unit: 'breaths/min', domain: null },
  pulse: { label: 'Pulse', unit: 'BPM', domain: null }
};

export function ProgressChart({ series, metric }) {
  const W = 560, H = 220, L = 38, R = 16, T = 16, B = 30;
  const info = METRICS[metric];
  const points = series
    .map((s, i) => ({ i, label: s.label, value: s[metric] }))
    .filter((p) => Number.isFinite(p.value));

  if (points.length === 0) return <p className="muted">No readings of this kind yet.</p>;

  const vals = points.map((p) => p.value);
  let [lo, hi] = info.domain ?? [Math.floor(Math.min(...vals) - 2), Math.ceil(Math.max(...vals) + 2)];
  if (hi - lo < 4) { lo -= 2; hi += 2; }
  const n = Math.max(series.length - 1, 1);
  const x = (i) => (series.length === 1 ? (L + W - R) / 2 : L + (i / n) * (W - L - R));
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const pts = points.map((p) => [x(p.i), y(p.value)]);
  const yTicks = [0, 1, 2, 3].map((k) => lo + ((hi - lo) * k) / 3);
  const labelEvery = Math.ceil(series.length / 6);
  const last = points[points.length - 1];

  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`${info.label} over your last ${series.length} sessions. Latest: ${Math.round(last.value)} ${info.unit}`}>
      <defs>
        <linearGradient id="prog-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5ea8ff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#5ea8ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid-line" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" className="axis-text">{Math.round(v)}</text>
        </g>
      ))}
      {series.map((s, i) => (i % labelEvery === 0 ? (
        <text key={s.id} x={x(i)} y={H - 8} textAnchor="middle" className="axis-text">{s.label}</text>
      ) : null))}
      {pts.length > 1 && (
        <>
          <path d={`${curve(pts)} L${pts[pts.length - 1][0]},${H - B} L${pts[0][0]},${H - B} Z`} fill="url(#prog-area)" />
          <path d={curve(pts)} className="trend-line trend-raw" />
        </>
      )}
      {pts.map(([px, py], k) => (
        <circle key={k} cx={px} cy={py} r={k === pts.length - 1 ? 6 : 4} className={k === pts.length - 1 ? 'pt pt-last' : 'pt'} />
      ))}
    </svg>
  );
}

// Where the score sits between "Settling in" and "Excellent".
export function CoherenceScale({ value }) {
  const bands = [
    { label: 'Settling in', from: 0, to: 50 },
    { label: 'Fair', from: 50, to: 70 },
    { label: 'Good', from: 70, to: 85 },
    { label: 'Excellent', from: 85, to: 100 }
  ];
  const has = Number.isFinite(value);
  return (
    <div className="scale" aria-hidden="true">
      <div className="scale-bar">
        {bands.map((b) => (
          <span key={b.label} style={{ flex: b.to - b.from }} className={has && value >= b.from && value < (b.to === 100 ? 101 : b.to) ? 'on' : ''} />
        ))}
        {has && <i className="scale-marker" style={{ left: `${value}%` }} />}
      </div>
      <div className="scale-labels">
        {bands.map((b) => <small key={b.label} style={{ flex: b.to - b.from }}>{b.label}</small>)}
      </div>
    </div>
  );
}
