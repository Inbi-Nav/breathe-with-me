import { useMemo } from 'react';
import Guide from './Guide';
import { ArcGauge, CoherenceScale, TrendChart } from './Charts';
import { CalendarIcon, CARD_ICONS, DownloadIcon, SparkIcon } from './Icons';
import { buildAdvice } from '../lib/advice';
import { coherenceLabel } from '../lib/sessionAnalysis';
import { formatDuration, formatPhase, formatReading } from '../lib/format';

const PHASES = [
  { key: 'deep', label: 'Deep', range: '9 breaths/min or fewer', cls: 'dot-blue' },
  { key: 'calm', label: 'Calm', range: '10 to 14 breaths/min', cls: 'dot-green' },
  { key: 'active', label: 'Active', range: 'More than 14', cls: 'dot-gold' }
];

function insights(s) {
  const list = [];
  list.push({
    cls: 'dot-green',
    text: s.longestSteady > 0
      ? `Longest steady stretch: ${formatDuration(s.longestSteady)}`
      : 'No steady stretch of 30 seconds or more'
  });
  if (Number.isFinite(s.lowBreathing)) {
    list.push({ cls: 'dot-blue', text: `Slowest breathing: ${Math.round(s.lowBreathing)} breaths/min` });
  }
  const c = s.comparison;
  if (c && Number.isFinite(c.firstBreathing) && Number.isFinite(c.lastBreathing)) {
    list.push({
      cls: 'dot-gold',
      text: `Breathing, first to last minute: ${Math.round(c.firstBreathing)} to ${Math.round(c.lastBreathing)}`
    });
  }
  if (c && Number.isFinite(c.firstPulse) && Number.isFinite(c.lastPulse)) {
    list.push({
      cls: 'dot-gold',
      text: `Pulse, first to last minute: ${Math.round(c.firstPulse)} to ${Math.round(c.lastPulse)} BPM`
    });
  }
  return list;
}

export default function SummaryScreen({ summary, aiStatus, voice, onExport, onReturn, onHistory }) {
  const advice = useMemo(() => buildAdvice(summary, new Date(summary.endedAt)), [summary]);

  if (!summary.available) {
    return (
      <div className="page summary">
        <header className="summary-head">
          <h1>Session summary: {formatDuration(summary.duration)}</h1>
        </header>
        <Guide mood="care" size="lg" voice={voice}
          message={`${summary.message} No worries. Let us try again when you are ready.`}>
          <div className="actions actions-row actions-left">
            <button type="button" className="btn btn-primary" onClick={onReturn}>Back to my dashboard</button>
          </div>
        </Guide>
      </div>
    );
  }

  const label = coherenceLabel(summary.coherence);
  const total = Math.max(1, summary.phases.deep + summary.phases.calm + summary.phases.active);
  const narration = summary.ai?.summary || advice.narration;
  const quote = summary.ai?.motivation || advice.quote;

  return (
    <div className="page summary">
      <header className="summary-head">
        <h1>Session summary: {formatDuration(summary.duration)}</h1>
        <button type="button" className="btn btn-outline btn-icon" onClick={onHistory}>
          <CalendarIcon /> View past sessions
        </button>
      </header>

      {/* Score and Bree's summary */}
      <section className="summary-top">
        <div className="gauge-wrap">
          <ArcGauge value={summary.coherence} label={label} />
        </div>
        <div className="card score-card">
          <h2>Coherence score</h2>
          <p className="muted">How steady your breathing rhythm stayed, from 0 to 100.</p>
          <CoherenceScale value={summary.coherence} />
        </div>
        <Guide mood={advice.mood} message={narration} voice={voice} size="md" />
      </section>

      {advice.caution && (
        <p className={`caution caution-${advice.caution.level}`} role="note">{advice.caution.text}</p>
      )}

      {/* Charts */}
      <section className="summary-mid">
        <div className="card" aria-labelledby="trend-title">
          <h2 id="trend-title">Breathing rate trends</h2>
          <TrendChart trend={summary.trend} duration={summary.duration} />
        </div>

        <div className="card split-card">
          <div aria-labelledby="dist-title">
            <h2 id="dist-title">Coherence distribution</h2>
            <ul className="phase-list">
              {PHASES.map((p) => (
                <li key={p.key}>
                  <div className="phase-top">
                    <span><i className={`dot ${p.cls}`} />{p.label}</span>
                    <strong>{formatPhase(summary.phases[p.key])}</strong>
                  </div>
                  <div className="bar"><span className={p.cls} style={{ width: `${(summary.phases[p.key] / total) * 100}%` }} /></div>
                  <small>{p.range}</small>
                </li>
              ))}
            </ul>
          </div>
          <div aria-labelledby="ins-title">
            <h2 id="ins-title">Mindfulness insights</h2>
            <ul className="insight-list">
              {insights(summary).map((item) => (
                <li key={item.text}><i className={`dot ${item.cls}`} />{item.text}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Advice */}
      <section className="plan" aria-labelledby="plan-title">
        <h2 id="plan-title" className="plan-title">Your plan from Bree</h2>
        <div className="plan-grid">
          {advice.cards.map((card) => {
            const Icon = CARD_ICONS[card.icon];
            return (
              <article key={card.id} className="card plan-card">
                <span className="plan-icon"><Icon /></span>
                <h3>{card.title}</h3>
                <ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            );
          })}
        </div>

        {aiStatus === 'loading' && (
          <p className="ai-note ai-loading" role="status"><SparkIcon /> Bree is writing you a personal note…</p>
        )}
        {summary.ai && summary.ai.tips.length > 0 && (
          <div className="card ai-card">
            <h3><SparkIcon /> A personal note from Bree</h3>
            <ul>{summary.ai.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            <small>Written with AI ({summary.ai.model}) from your numbers only. General wellness advice.</small>
          </div>
        )}

        <blockquote className="quote">“{quote}”</blockquote>
      </section>

      {/* Footer row */}
      <footer className="summary-foot">
        <div className="card averages">
          <h2>Average metrics</h2>
          <p>Avg. breathing rate <strong>{formatReading(summary.avgBreathing)} breaths/min</strong></p>
          <p>Avg. heart rate <strong>{formatReading(summary.avgPulse)} BPM</strong></p>
        </div>
        <div className="actions actions-row">
          <button type="button" className="btn btn-green btn-icon" onClick={onExport}>
            <DownloadIcon /> Export session data
          </button>
          <button type="button" className="btn btn-outline" onClick={onReturn}>Return to dashboard</button>
        </div>
      </footer>
      <p className="disclaimer">General wellness only. Not a medical assessment. Camera readings can be affected by movement and light.</p>
    </div>
  );
}
