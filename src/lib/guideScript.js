export function hello(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function homeMessage(stats, date = new Date()) {
  const greet = hello(date);
  if (!stats.total) {
    return `${greet}! I am Bree, your breathing buddy. Let us take a calm minute together. I will guide you the whole way.`;
  }
  if (stats.weekCount === 0) return `${greet}! Welcome back. It has been a few days. Ready for a calm minute?`;
  if (stats.weekCount >= stats.goalSessions) {
    return `${greet}! You reached your goal of ${stats.goalSessions} sessions this week. Wonderful work!`;
  }
  const left = stats.goalSessions - stats.weekCount;
  const streak = stats.streak > 1 ? ` That is ${stats.streak} days in a row.` : '';
  return `${greet}! You have done ${stats.weekCount} ${stats.weekCount === 1 ? 'session' : 'sessions'} this week.${streak} ${left} more to reach your goal.`;
}

export function startMessage({ needsKey, error }) {
  if (error) return `Oh, something stopped us. ${error}`;
  return needsKey
    ? 'Almost there! I need your Presage key and your permission to use the camera. This app does not record or save any video.'
    : 'Almost there! I need your permission to use the camera to see your breathing. This app does not record or save any video.';
}

export function liveMessage({ status, hasReading, hint, elapsed }) {
  if (status === 'stopping') return 'Finishing up. One moment.';
  if (status === 'error') return 'Something went wrong with the camera. You can finish the session, then try again.';
  if (!hasReading) return 'Hello! Sit comfortably and look at the screen. I am finding your breathing now.';
  if (hint) return `Let us fix one small thing. ${hint}`;
  if (elapsed < 20) return 'I can see your breathing. Just breathe naturally. The circles move with you.';
  if (elapsed < 60) return 'You are doing great. Nice and easy.';
  if (elapsed < 180) return 'One minute done. Lovely and steady. Stop whenever you like.';
  if (elapsed < 300) return 'Three minutes already. Wonderful. Keep your shoulders soft.';
  return 'Five minutes. A truly calm session. Press finish whenever you are ready.';
}

export function historyMessage(count) {
  return count
    ? `Here are your past sessions. Tap one and I will go through it with you.`
    : 'Nothing here yet. After your first session, I will keep your results here.';
}
