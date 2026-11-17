import BreathingStage from './BreathingStage';
import Guide from './Guide';
import { useBreathingLevel } from '../hooks/useBreathingLevel';
import { liveMessage } from '../lib/guideScript';
import { formatClock, formatReading } from '../lib/format';

export default function LiveScreen({
  status, hint, error, elapsedSeconds, breathingRate, pulseRate, breathingTrace, stream, onStop, voice
}) {
  const stopping = status === 'stopping';
  const { level, hasSignal, phase } = useBreathingLevel(breathingTrace, status === 'running');
  const message = liveMessage({
    status, hasReading: Number.isFinite(breathingRate), hint, elapsed: elapsedSeconds
  });

  return (
    <div className="page live">
      <div className="live-layout">
        <div className="live-stage">
          <BreathingStage stream={stream} level={level} hasSignal={hasSignal} />
          <p className="breath-word" aria-hidden="true">
            {hasSignal && phase === 'in' && 'Breathing in'}
            {hasSignal && phase === 'out' && 'Breathing out'}
          </p>
        </div>

        <section className="live-panel" aria-label="Your session">
          <Guide
            live
            size="md"
            mood={status === 'error' ? 'care' : 'breathe'}
            level={level}
            phase={phase}
            message={message}
            voice={voice}
          />

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="live-row">
            <p className="live-timer" aria-label="Session time">{formatClock(elapsedSeconds)}</p>
            <div className="live-metrics">
              <div className="metric">
                <span>Breathing</span>
                <strong>{formatReading(breathingRate)}</strong>
                <small>per minute</small>
              </div>
              <div className="metric">
                <span>Pulse</span>
                <strong>{formatReading(pulseRate)}</strong>
                <small>beats per minute</small>
              </div>
            </div>
          </div>

          <button type="button" className="btn btn-primary btn-large" onClick={onStop} disabled={stopping}>
            Finish session
          </button>
        </section>
      </div>
    </div>
  );
}
