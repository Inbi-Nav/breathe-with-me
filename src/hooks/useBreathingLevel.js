import { useEffect, useRef, useState } from 'react';

const MAX_SAMPLES = 150;   
const MIN_SAMPLES = 15;   
const MIN_RANGE = 0.001;
const SMOOTHING = 0.25;

function toNumber(ts) {
  if (typeof ts === 'number') return ts;
  if (ts && typeof ts.toNumber === 'function') return ts.toNumber();
  return Number(ts);
}

export function useBreathingLevel(trace, isRunning) {
  const historyRef = useRef([]);
  const lastTimeRef = useRef(-Infinity);
  const levelRef = useRef(0);
  const [state, setState] = useState({ level: 0, hasSignal: false, phase: null });
  const phaseRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      historyRef.current = [];
      lastTimeRef.current = -Infinity;
      levelRef.current = 0;
      phaseRef.current = null;
      setState({ level: 0, hasSignal: false, phase: null });
      return;
    }
    if (!trace?.length) return;

    const fresh = trace.filter((s) => Number.isFinite(s?.value) && toNumber(s.timestamp) > lastTimeRef.current);
    if (!fresh.length) return;

    const history = historyRef.current;
    const before = levelRef.current;
    let level = before;
    let ready = false;

    for (const sample of fresh) {
      history.push(sample.value);
      if (history.length > MAX_SAMPLES) history.shift();
      lastTimeRef.current = Math.max(lastTimeRef.current, toNumber(sample.timestamp));

      if (history.length < MIN_SAMPLES) continue;
      const min = Math.min(...history);
      const max = Math.max(...history);
      if (max - min < MIN_RANGE) continue;

      const normalized = (sample.value - min) / (max - min);
      level += (normalized - level) * SMOOTHING;
      ready = true;
    }

    if (ready) {
      levelRef.current = level;
      if (level - before > 0.015) phaseRef.current = 'in';
      else if (before - level > 0.015) phaseRef.current = 'out';
      setState({ level, hasSignal: true, phase: phaseRef.current });
    }
  }, [trace, isRunning]);

  return state;
}
