const DAY = 86_400_000;

function startOfDay(time) {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function mean(values) {
  const list = values.filter(Number.isFinite);
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
}

export function dashboardStats(sessions, goalSessions = 3, now = Date.now()) {
  const available = sessions.filter((s) => s.available);
  const today = startOfDay(now);
  const weekStart = today - 6 * DAY;
  const week = available.filter((s) => s.startedAt >= weekStart);

  const dayHasSession = (dayStart) =>
    available.some((s) => s.startedAt >= dayStart && s.startedAt < dayStart + DAY);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dayStart = weekStart + i * DAY;
    return {
      key: dayStart,
      label: new Date(dayStart).toLocaleDateString(undefined, { weekday: 'short' }),
      done: dayHasSession(dayStart),
      isToday: dayStart === today
    };
  });

  let streak = 0;
  let cursor = dayHasSession(today) ? today : today - DAY;
  while (dayHasSession(cursor)) {
    streak += 1;
    cursor -= DAY;
  }

  const calmSeconds = week.reduce((sum, s) => sum + (s.phases?.deep ?? 0) + (s.phases?.calm ?? 0), 0);

  return {
    total: available.length,
    weekCount: week.length,
    goalSessions,
    calmMinutes: Math.round(calmSeconds / 60),
    avgCoherence: mean(week.map((s) => s.coherence)),
    avgBreathing: mean(week.map((s) => s.avgBreathing)),
    avgPulse: mean(week.map((s) => s.avgPulse)),
    streak,
    weekDays,
    latest: available[0] ?? null,
    series: available.slice(0, 10).reverse().map((s) => ({
      id: s.id,
      label: new Date(s.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      coherence: s.coherence,
      breathing: s.avgBreathing,
      pulse: s.avgPulse
    }))
  };
}
