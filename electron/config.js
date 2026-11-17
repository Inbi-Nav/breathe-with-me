const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

function loadEnv() {
  const dotenv = require('dotenv');
  const candidates = [
    path.join(__dirname, '..', '.env'),
    path.join(app.getPath('userData'), '.env')
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) dotenv.config({ path: file, quiet: true });
  }
}

function getConfig() {
  const env = process.env;
  const apiKey = (env.OLLAMA_API_KEY || '').trim();
  const baseUrl = (env.OLLAMA_BASE_URL || (apiKey ? 'https://ollama.com' : 'http://localhost:11434'))
    .trim()
    .replace(/\/$/, '');

  return {
    tts: {
      apiKey: (env.ELEVENLABS_API_KEY || '').trim(),
      voiceId: (env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM').trim(),
      model: (env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5').trim(),
      baseUrl: (env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io').trim().replace(/\/$/, ''),
      timeoutMs: 20_000,
      cacheDir: path.join(app.getPath('userData'), 'voice-cache')
    },
    presageKey: (env.PRESAGE_API_KEY || env.SMARTSPECTRA_API_KEY || '').trim(),
    ai: {
      enabled: Boolean(env.OLLAMA_MODEL || env.OLLAMA_BASE_URL || apiKey),
      baseUrl,
      model: (env.OLLAMA_MODEL || 'gpt-oss:20b-cloud').trim(),
      apiKey,
      timeoutMs: Number(env.OLLAMA_TIMEOUT_MS) || 30_000
    }
  };
}

module.exports = { loadEnv, getConfig };
