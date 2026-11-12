
import { useEffect, useRef, useState } from 'react';

const MAX_SAMPLES = 120;
const MIN_RANGE = 0.001;
const SMOOTHING = 0.2;

export default function BreathingOrb({ trace, isRunning }) {
    const historyRef = useRef([]);
    const previousScaleRef = useRef(1);

    const [scale, setScale] = useState(1);
    const [hasSignal, setHasSignal] = useState(false);

    useEffect(() => {
        if (!isRunning) {
            historyRef.current = [];
            previousScaleRef.current = 1;
            setScale(1);
            setHasSignal(false);
            return;
        }

        const latestSample = trace?.at(-1);
        const value = latestSample?.value;

        if (!Number.isFinite(value)) return;
        const history = historyRef.current;
        history.push(value);
        if (history.length > MAX_SAMPLES) {
          history.shift();
        }
        if (history.length < 15) return;
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min;
        if (range < MIN_RANGE) return;
        const normalized = (value - min) / range;
        const targetScale = 0.85 + normalized * 0.3;
        const smoothed = previousScaleRef.current + (targetScale - previousScaleRef.current) * SMOOTHING;
        previousScaleRef.current = smoothed;
        setScale(smoothed);
        setHasSignal(true);
    }, [trace, isRunning]);

    return (
        <div className="orb-container">
            <div className={`breathing-orb ${hasSignal ? 'orb-active' : ''}`}  style={{ transform: `scale(${scale})` }} role="img" aria-label={ hasSignal ? 'Orb responding to the measured breathing signal' : 'Breathing signal not yet available'}/>

            <p className="orb-caption" aria-live="off">
                {isRunning ? hasSignal ? 'Following your breathing' : 'Finding your breathing rhythm...' : 'Your breathing experience starts here'}
            </p>
        </div>
    );
}
