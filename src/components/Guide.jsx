import { useEffect } from 'react';
import Mascot from './Mascot';
import { SpeakerIcon, SpeakerOffIcon } from './Icons';

export default function Guide({
  mood = 'happy', level = 0, phase = null, message, voice, live = false,
  size = 'md', stacked = false, children
}) {
  const speak = voice?.speak;
  const speaking = voice?.enabled;

  useEffect(() => {
    if (speaking && message && speak) speak(message);
  }, [message, speaking, speak]);

  const px = { sm: 84, md: 112, lg: 140, xl: 190 }[size];

  return (
    <div className={`guide guide-${size} ${stacked ? 'guide-stacked' : ''}`}>
      <Mascot mood={mood} level={level} phase={phase} size={px} />
      <div className="guide-bubble">
        <p className="guide-name">Bree</p>
        <p className="guide-text" aria-live={live ? 'polite' : undefined}>{message}</p>
        {children}
        {voice?.supported && voice.missing && (
          <p className="voice-missing">
            I need an English voice to talk. Add one in Windows Settings, Time &amp; language, Speech.
          </p>
        )}
        {voice?.supported && !voice.missing && (
          <button
            type="button"
            className="voice-btn"
            onClick={voice.toggle}
            aria-pressed={voice.enabled}
          >
            {voice.enabled ? <SpeakerIcon /> : <SpeakerOffIcon />}
            {voice.enabled ? 'Voice on' : 'Read aloud'}
          </button>
        )}
      </div>
    </div>
  );
}
