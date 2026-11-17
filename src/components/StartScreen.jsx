import StepShell from './StepShell';
import Guide from './Guide';
import { guideMood } from '../lib/guideMood';
import { startMessage } from '../lib/guideScript';

function Switch({ id, on, onToggle, title, hint }) {
  return (
    <div className="toggle-row">
      <button type="button" role="switch" aria-checked={on} aria-labelledby={`${id}-label`}
        className={`switch ${on ? 'on' : ''}`} onClick={onToggle}>
        <span />
      </button>
      <div id={`${id}-label`} className="toggle-text">
        <strong>{title}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}

export default function StartScreen({
  needsKey, apiKey, onKeyChange, allowed, onToggleCamera, saveResults, onToggleSave,
  onStart, onBack, error, voice
}) {
  const canStart = allowed && (!needsKey || apiKey.trim().length > 0);

  function handleSubmit(event) {
    event.preventDefault();
    if (canStart) onStart();
  }

  const art = (
    <Guide mood={guideMood(error)} message={startMessage({ needsKey, error })} voice={voice} size="xl" stacked />
  );

  return (
    <StepShell title="Get started" art={art}>
      <form className="step" onSubmit={handleSubmit}>
        <h2>Before we begin</h2>
        <p className="lead">Two quick choices, then your session starts right away.</p>

        {needsKey && (
          <label className="field" htmlFor="api-key">
            <span>Presage API key</span>
            <input id="api-key" type="password" value={apiKey} onChange={(e) => onKeyChange(e.target.value)}
              placeholder="Paste your API key" autoComplete="off" spellCheck={false} autoFocus />
            <small className="field-hint">
              Tip: save it once in a <code>.env</code> file (see <code>.env.example</code>) and the app will never ask again.
            </small>
          </label>
        )}

        <Switch id="camera" on={allowed} onToggle={onToggleCamera}
          title="Allow camera access" hint="Needed to see your breathing. Required." />
        <Switch id="save" on={saveResults} onToggle={onToggleSave}
          title="Save my results on this computer" hint="So I can show your progress. Numbers only, never video." />

        {error && <p className="error-message" role="alert">{error}</p>}

        <div className="actions">
          <button type="submit" className="btn btn-primary btn-large" disabled={!canStart}>Start session</button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
        </div>
      </form>
    </StepShell>
  );
}
