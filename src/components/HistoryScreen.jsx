import Guide from './Guide';
import { ArrowLeftIcon } from './Icons';
import { coherenceLabel } from '../lib/sessionAnalysis';
import { historyMessage } from '../lib/guideScript';
import { formatDuration, formatReading, formatWhen } from '../lib/format';

export default function HistoryScreen({ sessions, onOpen, onBack, voice }) {
  return (
    <div className="page history">
      <header className="summary-head">
        <h1>Past sessions</h1>
        <button type="button" className="btn btn-outline btn-icon" onClick={onBack}>
          <ArrowLeftIcon /> Back
        </button>
      </header>

      <Guide size="sm" mood="happy" message={historyMessage(sessions.length)} voice={voice} />

      {sessions.length > 0 && (
        <ul className="history-list history-gap">
          {sessions.map((s) => (
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
  );
}
