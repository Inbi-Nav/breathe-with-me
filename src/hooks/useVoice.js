import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const FEMALE = [
  'aria', 'jenny', 'sonia', 'libby', 'natasha', 'clara', 'emma', 'michelle',
  'samantha', 'serena', 'karen', 'moira', 'tessa', 'fiona', 'victoria',
  'zira', 'hazel', 'susan', 'catherine', 'linda', 'eva',
  'google us english', 'google uk english female', 'female'
];
const MALE = ['guy', 'ryan', 'davis', 'david', 'mark', 'george', 'james', 'daniel', 'alex', 'fred', 'male'];

function scoreVoice(voice) {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (/natural|neural/.test(name)) score += 100;   
  if (/online/.test(name)) score += 40;
  if (/google/.test(name)) score += 20;
  if (FEMALE.some((n) => name.includes(n)) && !/\bmale\b/.test(name.replace('female', ''))) score += 60;
  if (MALE.some((n) => name.includes(n)) && !name.includes('female')) score -= 60;
  if (/^en[-_]us/i.test(voice.lang)) score += 6;
  else if (/^en[-_]gb/i.test(voice.lang)) score += 5;
  if (/compact|espeak/.test(name)) score -= 50;
  return score;
}

export function englishVoices(all) {
  return all
    .filter((v) => /^en([-_]|$)/i.test(v.lang))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

function cleanForSpeech(text) {
  return text.replace(/…/g, '.').replace(/\s+/g, ' ').trim();
}

let audioContext = null;

async function playBytes(bytes) {
  audioContext = audioContext ?? new AudioContext();
  if (audioContext.state === 'suspended') await audioContext.resume();
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const buffer = await audioContext.decodeAudioData(copy);
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  return source;
}

export function useVoice(enabled, onToggle, voiceName = '', cloud = false) {
  const hasSynth = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const supported = hasSynth || cloud;
  const [voices, setVoices] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const lastRef = useRef('');
  const utteranceRef = useRef(null);  
  const timerRef = useRef(null);
  const sourceRef = useRef(null);
  const tokenRef = useRef(0);

  useEffect(() => {
    if (!hasSynth) return undefined;
    const synth = window.speechSynthesis;
    const load = () => {
      const all = synth.getVoices();
      setVoices(englishVoices(all));
      if (all.length) setLoaded(true);
    };
    load();
    synth.addEventListener('voiceschanged', load);
    const timeout = setTimeout(() => setLoaded(true), 2000);
    return () => {
      synth.removeEventListener('voiceschanged', load);
      clearTimeout(timeout);
    };
  }, [hasSynth]);

  const chosen = useMemo(
    () => voices.find((v) => v.name === voiceName) ?? voices[0] ?? null,
    [voices, voiceName]
  );

  const cancel = useCallback(() => {
    tokenRef.current += 1;
    clearTimeout(timerRef.current);
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    sourceRef.current = null;
    if (hasSynth) window.speechSynthesis.cancel();
  }, [hasSynth]);

  const systemSay = useCallback((text, voice) => {
    if (!hasSynth || !voice) return;
    const synth = window.speechSynthesis;
    timerRef.current = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.88;   
      utterance.pitch = 1.08;  
      utteranceRef.current = utterance;
      synth.speak(utterance);
    }, 60);
  }, [hasSynth]);

  const say = useCallback(async (text, voice) => {
    if (!text) return;
    cancel();
    const token = tokenRef.current;
    const clean = cleanForSpeech(text);

    if (cloud && window.bwm?.speak) {
      try {
        const bytes = await window.bwm.speak(clean);
        if (token !== tokenRef.current) return;      
        if (bytes?.byteLength) {
          const source = await playBytes(bytes);
          if (token !== tokenRef.current) return;
          sourceRef.current = source;
          source.start();
          return;
        }
      } catch (err) {
        console.warn('Natural voice failed, using the system voice:', err);
      }
      if (token !== tokenRef.current) return;
    }
    systemSay(clean, voice);
  }, [cloud, cancel, systemSay]);

  const speak = useCallback((text) => {
    if (text === lastRef.current) return;
    lastRef.current = text;
    say(text, chosen);
  }, [say, chosen]);

  const preview = useCallback((name) => {
    const voice = voices.find((v) => v.name === name) ?? voices[0];
    say('Hello, I am Bree. This is how I sound.', voice);
  }, [say, voices]);

  useEffect(() => {
    if (!enabled) {
      lastRef.current = '';
      cancel();
    }
  }, [enabled, cancel]);

  useEffect(() => cancel, [cancel]);

  return {
    supported,
    cloud,
    enabled: supported && enabled && (cloud || Boolean(chosen)),
    missing: !cloud && hasSynth && loaded && voices.length === 0,
    voices,
    current: chosen?.name ?? '',
    toggle: onToggle,
    speak,
    preview
  };
}
