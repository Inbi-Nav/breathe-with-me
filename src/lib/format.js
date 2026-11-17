export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const mins = `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  const secs = `${r} ${r === 1 ? 'second' : 'seconds'}`;
  if (m === 0) return secs;
  return r === 0 ? mins : `${mins} ${secs}`;
}

export function formatPhase(seconds) {
  if (seconds < 60) {
    const n = Math.round(seconds);
    return `${n} ${n === 1 ? 'second' : 'seconds'}`;
  }
  const minutes = (seconds / 60).toFixed(1).replace(/\.0$/, '');
  return `${minutes} ${minutes === '1' ? 'minute' : 'minutes'}`;
}

export function formatReading(value) {
  return Number.isFinite(value) ? Math.round(value) : '—';
}

export function formatWhen(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
