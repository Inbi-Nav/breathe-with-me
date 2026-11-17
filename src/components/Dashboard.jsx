import { useState } from 'react';
import Guide from './Guide';
import Wordmark from './Wordmark';
import { ProgressChart } from './Charts';
import { CalendarIcon, CheckIcon, SunIcon, TrashIcon } from './Icons';
import { coherenceLabel } from '../lib/sessionAnalysis';
import { formatDuration, formatReading, formatWhen } from '../lib/format';

const METRICS = [
  { id: 'coherence', label: 'Coherence' },
  { id: 'breathing', label: 'Breathing' },
  { id: 'pulse', label: 'Pulse' }
];

function Stat({ label, value, unit, hint }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}{unit && value !== '—' && <small> {unit}</small>}</strong>
      <em>{hint}</em>
    </div>
  );
}

export default function Dashboard({
  stats, sessions, message, voice, tip, saveOn, voiceName,
  onStart, onHistory, onOpen, onDeleteAll, onGoalChange, onVoiceChange
}) {
  const [metric, setMetric] = useState('coherence');
  const empty = stats.total === 0;
  const goalPct = Math.min(100, (stats.weekCount / stats.goalSessions) * 100);

  return (
    <div className="dash">
      <header className="dash-bar">
        <Wordmark />
        <button type="button" className="btn btn-outline btn-icon" onClick={onHistory}>
          <CalendarIcon /> Past sessions{stats.total > 0 ? ` (${stats.total})` : ''}
        </button>
      </header>

      <section className="dash-hero">
        <Guide mood={stats.weekCount >= stats.goalSessions ? 'celebrate' : 'happy'} message={message} voice={voice} size="lg" />
        <div className="start-card">
          <h1>Ready for a calm minute?</h1>
          <p>Three minutes is plenty. I will guide you from start to finish.</p>
          <button type="button" className="btn btn-primary btn-large" onClick={onStart}>Start a session</button>
        </div>
      </section>

      <section className="stat-row" aria-label="This week at a glance">
        <Stat label="Sessions this week" value={stats.weekCount} hint={`Goal: ${stats.goalSessions}`} />
        <Stat label="Calm minutes" value={stats.weekCount ? stats.calmMinutes : '—'} unit="min" hint="Last 7 days" />
        <Stat label="Steady rhythm" value={Number.isFinite(stats.avgCoherence) ? Math.round(stats.avgCoherence) : '—'} unit="%"
          hint={Number.isFinite(stats.avgCoherence) ? coherenceLabel(stats.avgCoherence) : 'Last 7 days'} />
        <Stat label="Breathing" value={formatReading(stats.avgBreathing)} unit="per min" hint="Average, last 7 days" />
      </section>

      <section className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h2>Your progress</h2>
            <div className="segmented" role="tablist" aria-label="Choose what to show">
              {METRICS.map((m) => (
                <button key={m.id} type="button" role="tab" aria-selected={metric === m.id}
                  className={metric === m.id ? 'on' : ''} onClick={() => setMetric(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {empty ? (
            <div className="empty">
              <svg viewBox="0 0 300 80" className="empty-line" aria-hidden="true">
                <path d="M0 55 C40 20 70 70 110 40 S190 10 230 45 S280 30 300 35" />
              </svg>
              <p>Your progress will appear here after your first session.</p>
            </div>
          ) : (
            <ProgressChart series={stats.series} metric={metric} />
          )}
        </div>

        <div className="card week-card">
          <h2>Your week</h2>
          <ul className="week">
            {stats.weekDays.map((d) => (
              <li key={d.key} className={`${d.done ? 'done' : ''} ${d.isToday ? 'today' : ''}`}>
                <span className="week-dot">{d.done && <CheckIcon />}</span>
                <small>{d.label}</small>
              </li>
            ))}
          </ul>
          <div className="goal">
            <div className="goal-top">
              <span>Weekly goal</span>
              <strong>{stats.weekCount} of {stats.goalSessions} sessions</strong>
            </div>
            <div className="bar bar-lg"><span className="dot-blue" style={{ width: `${goalPct}%` }} /></div>
            <div className="goal-edit">
              <button type="button" aria-label="Lower weekly goal" onClick={() => onGoalChange(-1)} disabled={stats.goalSessions <= 1}>−</button>
              <small>Change goal</small>
              <button type="button" aria-label="Raise weekly goal" onClick={() => onGoalChange(1)} disabled={stats.goalSessions >= 7}>+</button>
            </div>
          </div>
          <p className="streak">
            {stats.streak > 1 ? `${stats.streak} days in a row. Keep it going!`
              : stats.streak === 1 ? '1 day so far. A good start!' : 'A session today starts your streak.'}
          </p>
        </div>
      </section>

      <section className="dash-grid dash-grid-b">
        <div className="card">
          <h2>Recent sessions</h2>
          {sessions.length === 0 ? (
            <p className="muted">No sessions yet. Your results will be listed here.</p>
          ) : (
            <ul className="history-list">
              {sessions.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <button type="button" className="history-item" onClick={() => onOpen(s)}>
                    <span className="history-when">{formatWhen(s.startedAt)}</span>
                    <span>{formatDuration(s.duration)}</span>
                    <span className="badge">{Number.isFinite(s.coherence) ? `${s.coherence}% ${coherenceLabel(s.coherence)}` : '—'}</span>
                    <span>{formatReading(s.avgBreathing)} br/min</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card tip-card">
          <span className="tip-icon"><SunIcon /></span>
          <h2>Tip for today</h2>
          <strong>{tip.title}</strong>
          <p>{tip.text}</p>
        </div>
      </section>

      <footer className="dash-foot">
        <p>General wellness tool, not a medical device. {saveOn ? 'Your results are saved on this computer only.' : 'Saving is off. Results disappear when you close the app.'}</p>
        {voice.supported && !voice.cloud && voice.voices.length > 1 && (
          <label className="voice-pick">
            Bree's voice
            <select value={voiceName || ''} onChange={(e) => onVoiceChange(e.target.value)}>
              <option value="">Automatic (best available)</option>
              {voice.voices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
          </label>
        )}
        {voice.cloud && <span className="voice-pick">Bree's voice: natural (ElevenLabs)</span>}
        {stats.total > 0 && (
          <button type="button" className="btn-link" onClick={onDeleteAll}><TrashIcon /> Delete saved results</button>
        )}
      </footer>
    </div>
  );
}
