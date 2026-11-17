const SYSTEM_PROMPT = `You are Bree, a friendly breathing guide inside a wellness app. You are NOT a doctor.
You receive camera-based wellness numbers from one breathing session taken at rest.
Speak to the person directly, in very simple words and short sentences, as you would to an older adult.

Rules:
- "summary": 2 to 4 warm sentences about how the session went. Mention that camera readings can be affected by movement and lighting.
- Never diagnose, never name a medical condition, never suggest medication.
- "tips": 3 to 5 short, practical, gentle tips for today (easy movement, breathing, water, rest, routine). Nothing intense.
- If the numbers look unusual, include one tip to rest and measure again, and to talk to a doctor if it keeps happening or they feel unwell.
- "motivation": one short, kind, encouraging sentence.
- Respond only with JSON: {"summary": string, "tips": string[], "motivation": string}.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    tips: { type: 'array', items: { type: 'string' } },
    motivation: { type: 'string' }
  },
  required: ['summary', 'tips', 'motivation']
};

function num(value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return Math.round(value * 10) / 10;
}

function sanitize(input = {}) {
  const trend = input.trend || {};
  return {
    averageBreathingPerMin: num(input.avgBreathing, 2, 80),
    averagePulseBpm: num(input.avgPulse, 20, 250),
    steadyBreathingPercent: num(input.coherence, 0, 100),
    sessionMinutes: num(input.durationMin, 0, 240),
    calmOrDeepPercent: num(input.calmPercent, 0, 100),
    breathingFirstMinute: num(trend.breathingFirst, 2, 80),
    breathingLastMinute: num(trend.breathingLast, 2, 80),
    pulseFirstMinute: num(trend.pulseFirst, 20, 250),
    pulseLastMinute: num(trend.pulseLast, 20, 250),
    timeOfDay: ['morning', 'afternoon', 'evening', 'night'].includes(input.timeOfDay) ? input.timeOfDay : null
  };
}

async function generateInsight(input, ai) {
  if (!ai.enabled) return null;
  const readings = sanitize(input);
  if (readings.averageBreathingPerMin === null && readings.averagePulseBpm === null) return null;

  const headers = { 'Content-Type': 'application/json' };
  if (ai.apiKey) headers.Authorization = `Bearer ${ai.apiKey}`;

  try {
    const res = await fetch(`${ai.baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(ai.timeoutMs),
      body: JSON.stringify({
        model: ai.model,
        stream: false,
        format: RESPONSE_SCHEMA,
        options: { temperature: 0.3 },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(readings) }
        ]
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const parsed = JSON.parse(data?.message?.content ?? '');
    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.tips)) {
      throw new Error('Unexpected AI response');
    }

    return {
      summary: parsed.summary.trim().slice(0, 800),
      tips: parsed.tips
        .filter((t) => typeof t === 'string' && t.trim())
        .slice(0, 5)
        .map((t) => t.trim().slice(0, 240)),
      motivation: typeof parsed.motivation === 'string' ? parsed.motivation.trim().slice(0, 240) : '',
      model: ai.model
    };
  } catch (err) {
    console.warn('[insights] AI unavailable, using built-in tips:', err.message);
    return null;
  }
}

module.exports = { generateInsight };
