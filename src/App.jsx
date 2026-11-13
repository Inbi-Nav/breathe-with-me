
import { useEffect, useRef, useState } from 'react';
import { useSmartSpectra } from './hooks/useSmartSpectra';
import BreathingOrb from './components/BreathingOrb';
import './App.css';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatReading(value) {
  return Number.isFinite(value) ? Math.round(value) : '—';
}

function SummaryCard({ summary }) {
  if (!summary) return null;
  return (
    <section className="summary-card" aria-labelledby="summary-title">
      <span className="section-label">SESSION COMPLETE</span>
      <h2 id="summary-title">Your session summary</h2>
      <p className="summary-duration">
        Duration: {formatTime(summary.duration)}
      </p>

      {!summary.available ? (
        <p className="summary-message">{summary.message}</p>
      ) : (
        <>
          <p className="summary-description">
            A simple comparison of your first and last minute.
          </p>

          <div className="summary-table">
            <div className="summary-head">
              <span>Measurement</span>
              <span>First min</span>
              <span>Last min</span>
            </div>

            <div className="summary-row">
              <span>Pulse (BPM)</span>
              <strong>{formatReading(summary.firstPulse)}</strong>
              <strong>{formatReading(summary.lastPulse)}</strong>
            </div>

            <div className="summary-row">
              <span>Breathing (br/min)</span>
              <strong>{formatReading(summary.firstBreathing)}</strong>
              <strong>{formatReading(summary.lastBreathing)}</strong>
            </div>
          </div>
        </>
      )}

      <p className="summary-note">
        These measurements are for general wellness only.
        They are not a medical assessment.
      </p>
    </section>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [consent, setConsent] = useState(false);
  const videoRef = useRef(null);
  const { status, hint, breathingRate, pulseRate, breathingTrace, stream, error, elapsedSeconds, summary,  startSession, stopSession } = useSmartSpectra();
  const isActive = [ 'starting', 'running', 'stopping',  'error'].includes(status);
  const isCalibrating = status === 'starting' || (status === 'running' && (breathingRate === null || pulseRate === null));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch((err) => {
        console.warn('Camera preview:', err);
      });
    }

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  async function handleStart() {
    if (!consent || !apiKey.trim() || isActive) return;
    const key = apiKey;
    setApiKey('');
    await startSession(key);
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-label">
          HUMAN SENSING EXPERIENCE
        </span>

        <h1>Breathe With Me</h1>

        <p>A quiet space to reconnect with your breathing.</p>
      </header>

      <main className="app-content">
        <section className="session" aria-label="Breathing session">
          <BreathingOrb
            trace={breathingTrace}
            isRunning={status === 'running'}
          />

          <h2>Your breathing, visualized.</h2>

          <p className="session-description">
            Discover your natural breathing rhythm
            through a real-time visual experience.
          </p>

          <p className="session-status" role="status">
            {status === 'idle' && 'Ready to begin'}
            {status === 'starting' && 'Starting camera...'}
            {status === 'running' && 'Session running'}
            {status === 'stopping' && 'Stopping camera...'}
            {status === 'error' && 'Session error'}
          </p>

          {isActive && hint && (
            <p className="validation-hint">{hint}</p>
          )}

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {status === 'running' && (
            <div className="session-info">
              <span className="session-timer">
                {formatTime(elapsedSeconds)}
              </span>

              <span className="session-state"> {isCalibrating ? 'Calibrating measurements...' : 'Live measurements'}</span>
            </div>
          )}

          {!isActive && (
            <div className="consent-panel">
              <label htmlFor="api-key">
                Presage API key
              </label>

              <input id="api-key" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)}
                placeholder="Enter your API key"
                autoComplete="off"/>

              <label className="consent-option">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />

                <span>
                  I consent to camera access for live wellness measurements. Measurements remain in memory and are not saved.  Optional SDK telemetry is disabled. Presage authentication requires a networkconnection.
                </span>
              </label>

              <button className="start-btn" onClick={handleStart} disabled={!consent || !apiKey.trim()} >
                Start Session
              </button>
            </div>
          )}

          <button className="stop-btn" onClick={stopSession} disabled={!isActive || status === 'stopping'}>
            Stop Session
          </button>

          <div className="measurements">
            <div className="measurement">
              <span>Breathing Rate</span>
              <strong>{formatReading(breathingRate)}</strong>
              <small>breaths/min</small>
            </div>

            <div className="measurement">
              <span>Pulse Rate</span>
              <strong>{formatReading(pulseRate)}</strong>
              <small>BPM</small>
            </div>
          </div>

          {stream && (
            <div className="camera-container" hidden={!stream}>
              <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview"/>
            </div>
          )}

          {!isActive && (
            <SummaryCard summary={summary} />
          )}
        </section>
      </main>

      <footer className="app-footer">
        General wellness tool, not a medical device.
      </footer>
    </div>
  );
}