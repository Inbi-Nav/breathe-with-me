export function exportSessionCsv(summary) {
  const rows = ['elapsed_seconds,breathing_rate_per_min,pulse_bpm'];
  for (const s of summary.samples ?? []) {
    const elapsed = ((s.time - summary.startedAt) / 1000).toFixed(1);
    const breathing = Number.isFinite(s.breathingRate) ? s.breathingRate.toFixed(2) : '';
    const pulse = Number.isFinite(s.pulseRate) ? s.pulseRate.toFixed(2) : '';
    rows.push(`${elapsed},${breathing},${pulse}`);
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date(summary.startedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.href = url;
  link.download = `breathe-with-me-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
