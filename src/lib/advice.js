// Turns the numbers of a session into plain-language advice.
// The app decides the levels, so the advice stays predictable and safe.
import { coherenceLabel } from './sessionAnalysis';
import { formatDuration } from './format';

export function breathingLevel(perMin) {
  if (!Number.isFinite(perMin)) return null;
  if (perMin < 8) return 'very_low';
  if (perMin < 12) return 'low';
  if (perMin <= 20) return 'normal';
  if (perMin <= 24) return 'slightly_high';
  if (perMin <= 30) return 'high';
  return 'very_high';
}

export function pulseLevel(bpm) {
  if (!Number.isFinite(bpm)) return null;
  if (bpm < 40) return 'very_low';
  if (bpm < 50) return 'low';
  if (bpm < 60) return 'slightly_low';
  if (bpm <= 100) return 'normal';
  if (bpm <= 120) return 'high';
  return 'very_high';
}

export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const round = (v) => Math.round(v);
const isBad = (lvl) => lvl && !['normal', 'slightly_low', 'low'].includes(lvl);

export function buildAdvice(session, date = new Date()) {
  const bLevel = breathingLevel(session.avgBreathing);
  const pLevel = pulseLevel(session.avgPulse);
  const coherence = session.coherence;
  const tod = timeOfDay(date);
  const c = session.comparison;

  const urgent = [bLevel, pLevel].some((l) => l === 'very_low' || l === 'very_high');
  const checkup = [bLevel, pLevel].some((l) => ['low', 'high'].includes(l));
  const elevated = urgent || checkup || bLevel === 'slightly_high';

  let mood = 'calm';
  if (urgent || checkup) mood = 'care';
  else if (Number.isFinite(coherence) && coherence >= 85) mood = 'celebrate';
  else if (Number.isFinite(coherence) && coherence >= 70) mood = 'happy';

  const parts = [`You breathed with me for ${formatDuration(session.duration)}.`];
  if (Number.isFinite(session.avgBreathing)) {
    const word = {
      very_low: 'very slow, so please rest and check again',
      low: 'slow and relaxed',
      normal: Number.isFinite(coherence) && session.avgBreathing <= 14 ? 'calm and in the normal range' : 'in the normal range',
      slightly_high: 'a little quick',
      high: 'quick',
      very_high: 'very quick, so please rest and check again'
    }[bLevel];
    parts.push(`Your breathing averaged ${round(session.avgBreathing)} breaths a minute, which is ${word}.`);
  }
  if (Number.isFinite(coherence)) {
    const steady = coherence >= 85 ? 'very steady' : coherence >= 70 ? 'steady' : coherence >= 50 ? 'a little uneven' : 'still settling';
    parts.push(`Your rhythm was ${steady} (${coherence}%).`);
  }
  if (c && Number.isFinite(c.firstBreathing) && Number.isFinite(c.lastBreathing)) {
    const diff = c.lastBreathing - c.firstBreathing;
    if (diff <= -1) parts.push(`You settled as we went, from ${round(c.firstBreathing)} down to ${round(c.lastBreathing)}.`);
    else if (diff >= 2) parts.push('Your breathing picked up toward the end, which is normal if you moved a little.');
  } else if (Number.isFinite(session.avgPulse) && pLevel === 'normal') {
    parts.push(`Your pulse averaged ${round(session.avgPulse)}, a typical resting value.`);
  }
  parts.push(mood === 'care' ? 'Camera readings can be off, so let us look again soon.' : 'Well done for taking this time.');

  let caution = null;
  if (urgent) {
    caution = { level: 'urgent', text: 'One reading was far from the usual resting range. Camera readings can be wrong, so rest and measure again. If it repeats, or you feel unwell, please contact a doctor.' };
  } else if (checkup) {
    caution = { level: 'checkup', text: 'A reading was a bit outside the usual resting range. Rest for a few minutes and try again. If it keeps happening, mention it at your next check-up.' };
  }

  const move = [];
  if (elevated) {
    move.push('Rest today. Sit or lie down for 10 minutes, then measure again.');
    move.push('Only easy stretching for now: roll your shoulders 10 times and turn your neck gently side to side.');
    move.push('Skip hard exercise until your readings settle.');
  } else {
    move.push('Take an easy 15 to 20 minute walk, at a pace where you could still chat.');
    move.push('Prefer to stay seated? March gently in your chair, 10 times, twice.');
    move.push('Stand up and stretch for one minute every hour.');
    if (pLevel === 'normal' && session.avgPulse <= 80 && bLevel === 'normal' && coherence >= 70) {
      move.push('Feeling strong? Add 5 minutes to your walk, or try light cycling or swimming.');
    }
  }
  move.push('Stop and rest if you feel dizzy or short of breath.');

  const breathe = [];
  if ((Number.isFinite(coherence) && coherence < 70) || session.avgBreathing > 15) {
    breathe.push('Try 4-6 breathing: in through the nose for 4, out slowly for 6.');
    breathe.push('Do it for 3 minutes, twice a day. Rest a hand on your belly and feel it rise.');
    breathe.push('Sit with your back supported and your shoulders loose.');
  } else {
    breathe.push('Keep it up. Try 5 minutes of slow breathing before bed.');
    breathe.push('Make your out-breath a little longer than your in-breath.');
    breathe.push('Use one slow breath whenever you feel rushed.');
  }

  const daily = [];
  if (tod === 'morning') daily.push('Drink a glass of water now and open a window for fresh air.');
  else if (tod === 'afternoon') daily.push('Have some water and a light snack. Step outside for a few minutes of daylight.');
  else daily.push('Dim the lights an hour before bed and put screens away.');
  if (Number.isFinite(session.avgPulse) && session.avgPulse > 85) daily.push('Cut back on coffee and strong tea, and drink more water.');
  else daily.push('Keep coffee and tea to the morning if you can.');
  daily.push('Measure at the same time each day, sitting still, so results are easy to compare.');
  daily.push('Aim for a regular bedtime and wake-up time.');

  const goal = session.duration < 180
    ? 'Next time, try for 3 minutes.'
    : Number.isFinite(coherence) && coherence < 85
      ? `Next time, aim for a steadier rhythm: ${Math.min(100, coherence + 5)}%.`
      : 'Next time, see if you can keep this steady rhythm for longer.';
  const mindset = [
    mood === 'celebrate' ? 'That was an excellent session. Be proud of it.'
      : mood === 'care' ? 'Be gentle with yourself today. Resting is a healthy choice.'
        : 'Good work. Calm builds a little more each time.',
    'Even one quiet minute counts.',
    goal
  ];

  return {
    mood,
    tone: coherenceLabel(coherence),
    narration: parts.join(' '),
    caution,
    cards: [
      { id: 'move', title: 'Move a little', icon: 'walk', items: move },
      { id: 'breathe', title: 'Breathing practice', icon: 'wind', items: breathe },
      { id: 'daily', title: 'Daily habits', icon: 'sun', items: daily },
      { id: 'mindset', title: 'Keep going', icon: 'heart', items: mindset }
    ]
  };
}

export function toAiInput(session, date = new Date()) {
  const p = session.phases ?? { deep: 0, calm: 0, active: 0 };
  const total = p.deep + p.calm + p.active || 1;
  const c = session.comparison ?? {};
  return {
    avgBreathing: session.avgBreathing,
    avgPulse: session.avgPulse,
    coherence: session.coherence,
    durationMin: Math.round((session.duration / 60) * 10) / 10,
    calmPercent: Math.round(((p.deep + p.calm) / total) * 100),
    trend: {
      breathingFirst: c.firstBreathing,
      breathingLast: c.lastBreathing,
      pulseFirst: c.firstPulse,
      pulseLast: c.lastPulse
    },
    timeOfDay: timeOfDay(date)
  };
}

const DAILY_TIPS = [
  { title: 'Drink water', text: 'A glass of water in the morning helps your body wake up gently.' },
  { title: 'Walk after a meal', text: 'Ten easy minutes of walking after eating is good for your heart.' },
  { title: 'Stretch your shoulders', text: 'Roll your shoulders back 10 times. Let your jaw relax.' },
  { title: 'Breathe out longer', text: 'Breathe in for 4, out for 6. The long out-breath calms the body.' },
  { title: 'Get some daylight', text: 'A few minutes outside helps you sleep better tonight.' },
  { title: 'Stand up often', text: 'Stand and stretch for a minute every hour if you sit a lot.' },
  { title: 'Keep a routine', text: 'Going to bed and waking at the same time makes calm easier.' },
  { title: 'Call a friend', text: 'A friendly chat is good for your mood and your breathing.' },
  { title: 'Sit tall', text: 'Back supported, shoulders loose. Your lungs have more room.' },
  { title: 'Slow down meals', text: 'Put your fork down between bites and take one slow breath.' },
  { title: 'Go easy on caffeine', text: 'Keep coffee and tea to the morning for calmer evenings.' },
  { title: 'Seated marching', text: 'March gently in your chair 20 times. Easy, and it wakes you up.' },
  { title: 'Try a short session', text: 'Even three minutes with me is enough to start.' },
  { title: 'Be kind to yourself', text: 'A calm day is a good day, however much you got done.' }
];

export function dailyTip(date = new Date()) {
  const day = Math.floor(date.getTime() / 86_400_000);
  return DAILY_TIPS[day % DAILY_TIPS.length];
}
