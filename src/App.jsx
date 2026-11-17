import { useEffect, useMemo, useRef, useState } from 'react';
import { useSmartSpectra } from './hooks/useSmartSpectra';
import { useConfig } from './hooks/useConfig';
import { useVoice } from './hooks/useVoice';
import { useAiInsight } from './hooks/useAiInsight';
import { exportSessionCsv } from './lib/exportSession';
import { dashboardStats } from './lib/stats';
import { dailyTip } from './lib/advice';
import { homeMessage } from './lib/guideScript';
import { clearSessions, loadPrefs, loadSessions, savePrefs, saveSessions } from './lib/storage';
import Dashboard from './components/Dashboard';
import StartScreen from './components/StartScreen';
import LiveScreen from './components/LiveScreen';
import SummaryScreen from './components/SummaryScreen';
import HistoryScreen from './components/HistoryScreen';
import './App.css';

export default function App() {
  const config = useConfig();
  const [screen, setScreen] = useState('home');
  const [historyFrom, setHistoryFrom] = useState('home');
  const [apiKey, setApiKey] = useState('');
  const [keyRejected, setKeyRejected] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [history, setHistory] = useState(loadSessions);
  const [viewedId, setViewedId] = useState(null);
  const [shortSummary, setShortSummary] = useState(null);
  const stoppingRef = useRef(false);
  const session = useSmartSpectra();
  const { authFailed, stopSession, clearError } = session;
  const voice = useVoice(prefs.voice, () => updatePrefs({ voice: !prefs.voice }), prefs.voiceName, config.ttsEnabled);
  const viewed = history.find((s) => s.id === viewedId) ?? null;
  const stats = useMemo(() => dashboardStats(history, prefs.goalSessions), [history, prefs.goalSessions]);
  const tip = useMemo(() => dailyTip(), []);
  const needsKey = !config.presageKey || keyRejected;

  function updatePrefs(patch) {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      savePrefs(next);
      return next;
    });
  }

  useEffect(() => {
    if (prefs.saveResults) saveSessions(history);
  }, [history, prefs.saveResults]);

  useEffect(() => {
    if (authFailed && screen === 'live') {
      if (config.presageKey) setKeyRejected(true);
      stopSession().then(() => setScreen('start'));
    }
  }, [authFailed, screen, stopSession, config.presageKey]);

  function openStart() {
    clearError();
    setApiKey('');
    setCameraAllowed(false);
    setScreen('start');
  }

  async function startSession() {
    const key = needsKey ? apiKey.trim() : config.presageKey;
    if (!cameraAllowed || !key) return;
    setApiKey('');
    setScreen('live');
    const result = await session.startSession(key);
    if (result === 'failed') {
      if (needsKey) setApiKey(key); 
      setScreen('start');
    }
  }

  async function finishSession() {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      const hadError = Boolean(session.error);
      const summary = await stopSession();
      if (summary) {
        const entry = { ...summary, ephemeral: !prefs.saveResults };
        if (entry.available) setHistory((items) => [entry, ...items]);
        setViewedId(entry.id);
        setShortSummary(entry.available ? null : entry);
        setScreen('summary');
      } else {
        setScreen(hadError ? 'start' : 'home');
      }
    } finally {
      stoppingRef.current = false;
    }
  }

  const shown = viewed ?? shortSummary;

  function attachAi(id, ai) {
    setHistory((items) => items.map((s) => (s.id === id ? { ...s, ai } : s)));
  }
  const aiStatus = useAiInsight(shown, config.aiEnabled, attachAi);

  function openHistory(from) {
    setHistoryFrom(from);
    setScreen('history');
  }

  function openSession(s) {
    setShortSummary(null);
    setViewedId(s.id);
    setScreen('summary');
  }

  function deleteAll() {
    if (!window.confirm('Delete all saved results from this computer?')) return;
    clearSessions();
    setHistory([]);
    setViewedId(null);
  }

  return (
    <div className="app">
      {screen === 'home' && (
        <Dashboard
          stats={stats}
          sessions={history}
          message={homeMessage(stats)}
          voice={voice}
          tip={tip}
          saveOn={prefs.saveResults}
          onStart={openStart}
          onHistory={() => openHistory('home')}
          onOpen={openSession}
          onDeleteAll={deleteAll}
          onVoiceChange={(name) => { updatePrefs({ voiceName: name }); voice.preview(name); }}
          voiceName={prefs.voiceName}
          onGoalChange={(d) => updatePrefs({ goalSessions: Math.min(7, Math.max(1, prefs.goalSessions + d)) })}
        />
      )}

      {screen === 'start' && (
        <StartScreen
          needsKey={needsKey}
          apiKey={apiKey}
          onKeyChange={(value) => { setApiKey(value); if (session.error) clearError(); }}
          allowed={cameraAllowed}
          onToggleCamera={() => setCameraAllowed((v) => !v)}
          saveResults={prefs.saveResults}
          onToggleSave={() => updatePrefs({ saveResults: !prefs.saveResults })}
          onStart={startSession}
          onBack={() => { clearError(); setApiKey(''); setScreen('home'); }}
          error={session.error}
          voice={voice}
        />
      )}

      {screen === 'live' && (
        <LiveScreen
          status={session.status}
          hint={session.hint}
          error={session.error}
          elapsedSeconds={session.elapsedSeconds}
          breathingRate={session.breathingRate}
          pulseRate={session.pulseRate}
          breathingTrace={session.breathingTrace}
          stream={session.stream}
          onStop={finishSession}
          voice={voice}
        />
      )}

      {screen === 'summary' && shown && (
        <SummaryScreen
          key={shown.id}
          summary={shown}
          aiStatus={aiStatus}
          voice={voice}
          onExport={() => exportSessionCsv(shown)}
          onReturn={() => { setShortSummary(null); setScreen('home'); }}
          onHistory={() => openHistory('summary')}
        />
      )}

      {screen === 'history' && (
        <HistoryScreen
          sessions={history}
          onOpen={openSession}
          onBack={() => setScreen(historyFrom === 'summary' && !shown ? 'home' : historyFrom)}
          voice={voice}
        />
      )}
    </div>
  );
}
