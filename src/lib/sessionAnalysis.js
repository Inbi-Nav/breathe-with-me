const MIN_SAMPLES = 3;
const MIN_COMPARE_SECONDS = 120;
const COMPARE_WINDOW_MS = 60_000;
const MAX_GAP_S = 5;          
const WINDOW_S = 30;          
const STEADY_RANGE = 2;        
const DEEP_MAX = 9;           
const CALM_MAX = 14;          

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function meanIfEnough(values) {
  return values.length >= MIN_SAMPLES ? mean(values) : null;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

export function coherenceLabel(score) {
  if (!Number.isFinite(score)) return 'Not enough data';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Settling in';
}

export function analyzeSession(samples, startedAt, endedAt) {
  const duration = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
  const base = { id: String(startedAt), startedAt, endedAt, duration, samples };

  const breathing = samples
    .filter((s) => Number.isFinite(s.breathingRate))
    .sort((a, b) => a.time - b.time);

  if (breathing.length < MIN_SAMPLES) {
    return {
      ...base,
      available: false,
      message: 'This session was too short to measure your breathing. Try again for a few minutes.'
    };
  }

  const phases = { deep: 0, calm: 0, active: 0 };
  breathing.forEach((s, i) => {
    const next = breathing[i + 1];
    const dt = next ? Math.min((next.time - s.time) / 1000, MAX_GAP_S) : 1;
    const key = s.breathingRate <= DEEP_MAX ? 'deep' : s.breathingRate <= CALM_MAX ? 'calm' : 'active';
    phases[key] += dt;
  });

  const buckets = new Map();
  breathing.forEach((s) => {
    const b = Math.floor((s.time - startedAt) / (WINDOW_S * 1000));
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b).push(s.breathingRate);
  });
  const judged = [...buckets.entries()]
    .filter(([, v]) => v.length >= 2)
    .sort((a, b) => a[0] - b[0])
    .map(([b, v]) => ({ b, steady: Math.max(...v) - Math.min(...v) <= STEADY_RANGE }));

  const coherence = judged.length
    ? Math.round((judged.filter((w) => w.steady).length / judged.length) * 100)
    : null;

  let longest = 0;
  let run = 0;
  let prev = null;
  judged.forEach((w) => {
    if (w.steady) run = prev !== null && w.b === prev + 1 && run > 0 ? run + 1 : 1;
    else run = 0;
    prev = w.b;
    longest = Math.max(longest, run);
  });

  const step = Math.max(5, Math.ceil(duration / 60));
  const trendBuckets = new Map();
  breathing.forEach((s) => {
    const b = Math.floor((s.time - startedAt) / 1000 / step);
    if (!trendBuckets.has(b)) trendBuckets.set(b, []);
    trendBuckets.get(b).push(s.breathingRate);
  });
  const trend = [...trendBuckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([b, v]) => ({ t: b * step, value: mean(v) }));

  const sortedRates = breathing.map((s) => s.breathingRate).sort((a, b) => a - b);
  const pulses = samples.map((s) => s.pulseRate).filter(Number.isFinite);

  let comparison = null;
  if (duration >= MIN_COMPARE_SECONDS) {
    const first = samples.filter((s) => s.time >= startedAt && s.time < startedAt + COMPARE_WINDOW_MS);
    const last = samples.filter((s) => s.time > endedAt - COMPARE_WINDOW_MS && s.time <= endedAt);
    const pick = (items, field) => meanIfEnough(items.map((i) => i[field]).filter(Number.isFinite));
    comparison = {
      firstBreathing: pick(first, 'breathingRate'),
      lastBreathing: pick(last, 'breathingRate'),
      firstPulse: pick(first, 'pulseRate'),
      lastPulse: pick(last, 'pulseRate')
    };
  }

  return {
    ...base,
    available: true,
    avgBreathing: mean(breathing.map((s) => s.breathingRate)),
    avgPulse: meanIfEnough(pulses),
    lowBreathing: percentile(sortedRates, 0.1),
    coherence,
    phases,
    longestSteady: longest * WINDOW_S,
    trend,
    comparison
  };
}
