const SESSIONS_KEY = 'bwm.sessions.v1';
const PREFS_KEY = 'bwm.prefs.v1';
const MAX_SESSIONS = 60;

export const DEFAULT_PREFS = { saveResults: true, voice: false, voiceName: '', goalSessions: 3 };

const r1 = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : null);

function encode(session) {
  return {
    ...session,
    samples: (session.samples ?? []).map((s) => [s.time, r1(s.breathingRate), r1(s.pulseRate)])
  };
}

function decode(raw) {
  return {
    ...raw,
    samples: (raw.samples ?? []).map(([time, breathingRate, pulseRate]) => ({ time, breathingRate, pulseRate }))
  };
}

export function loadSessions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && s.id && s.available && Number.isFinite(s.startedAt))
      .map(decode)
      .sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
}

export function saveSessions(sessions) {
  let list = sessions.filter((s) => !s.ephemeral).slice(0, MAX_SESSIONS).map(encode);
  while (true) {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
      return true;
    } catch {
      if (list.length <= 1) return false;
      list = list.slice(0, Math.ceil(list.length / 2));
    }
  }
}

export function clearSessions() {
  try {
    localStorage.removeItem(SESSIONS_KEY);
  } catch {

  }
}

export function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {

  }
}
