import { useEffect, useState } from 'react';
import { toAiInput } from '../lib/advice';

export function useAiInsight(session, enabled, onResult) {
  const [status, setStatus] = useState(session?.ai ? 'ready' : 'idle');

  useEffect(() => {
    if (session?.ai) { setStatus('ready'); return; }
    if (!enabled || !session?.available || !window.bwm?.generateInsight) { setStatus('idle'); return; }

    let cancelled = false;
    setStatus('loading');
    window.bwm
      .generateInsight(toAiInput(session))
      .then((result) => {
        if (cancelled) return;
        if (result) { onResult(session.id, result); setStatus('ready'); }
        else setStatus('unavailable');
      })
      .catch(() => { if (!cancelled) setStatus('unavailable'); });

    return () => { cancelled = true; };
  }, [session?.id, enabled]);

  return status;
}
