const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const MAX_CHARS = 600;
let broken = false; 

async function synthesize(text, tts) {
  if (!tts.apiKey || broken) return null;
  if (typeof text !== 'string') return null;
  const clean = text.trim().slice(0, MAX_CHARS);
  if (!clean) return null;
  if (!/^[A-Za-z0-9]{10,40}$/.test(tts.voiceId)) {
    console.warn('[tts] ELEVENLABS_VOICE_ID looks wrong.');
    return null;
  }

  const hash = crypto.createHash('sha1').update(`${tts.voiceId}|${tts.model}|${clean}`).digest('hex');
  const file = tts.cacheDir ? path.join(tts.cacheDir, `${hash}.mp3`) : null;

  try {
    if (file && fs.existsSync(file)) return new Uint8Array(fs.readFileSync(file));
  } catch {
  
  }

  try {
    const res = await fetch(`${tts.baseUrl}/v1/text-to-speech/${tts.voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': tts.apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      signal: AbortSignal.timeout(tts.timeoutMs),
      body: JSON.stringify({
        text: clean,
        model_id: tts.model,
        voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0, use_speaker_boost: true }
      })
    });

    if (res.status === 401 || res.status === 403) {
      broken = true;
      console.warn('[tts] ElevenLabs rejected the key. Using the system voice instead.');
      return null;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!bytes.byteLength) return null;

    try {
      if (file) {
        fs.mkdirSync(tts.cacheDir, { recursive: true });
        fs.writeFileSync(file, bytes);
      }
    } catch {

    }
    return bytes;
  } catch (err) {
    console.warn('[tts] voice unavailable, using the system voice:', err.message);
    return null;
  }
}

module.exports = { synthesize };
