
import { useEffect, useRef, useState } from 'react';
import { useSmartSpectra } from './hooks/useSmartSpectra';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [consent, setConsent] = useState(false);
  const videoRef = useRef(null);

  const {
    status,
    hint,
    breathingRate,
    pulseRate,
    stream,
    error,
    startSession,
    stopSession
  } = useSmartSpectra();

  const isActive = ['starting', 'running', 'stopping', 'error'].includes(status);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch(console.warn);
    }
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  async function handleStart() {
    if (!consent || !apiKey.trim()) return;
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
        <section className="session">
          <div className="orb-container">
            <div className="breathing-orb" />
          </div>

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
            <p className="error-message" role="alert">{error}</p>
          )}

          {!isActive && (
            <div className="consent-panel">
              <label htmlFor="api-key">Presage API key</label>

              <input id="api-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" autoComplete="off" />

              <label className="consent-option">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}/>
                <span>
                  I agree to camera access for live wellness measurements.
                  Measurements remain in memory and are not saved.
                  Optional SDK telemetry is disabled; Presage
                  authentication requires network access.
                </span>
              </label>

              <button className="start-btn" onClick={handleStart} disabled={!consent || !apiKey.trim()}>
                Start Session
              </button>
            </div>
          )}

          <button className="stop-btn" onClick={stopSession} disabled={!isActive || status === 'stopping'} >
            Stop Session
          </button>

          <div className="measurements">
            <div className="measurement">
              <span>Breathing Rate</span>
              <strong>
                {breathingRate === null ? '—' : Math.round(breathingRate)}
              </strong>
              <small>breaths/min</small>
            </div>

            <div className="measurement">
              <span>Pulse Rate</span>
              <strong> {pulseRate === null ? '—' : Math.round(pulseRate)}
              </strong>
              <small>BPM</small>
            </div>
          </div>

          {stream && (
            <div className="camera-container">
              <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview"/>
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        General wellness tool, not a medical device.
      </footer>
    </div>
  );
}

export default App;
