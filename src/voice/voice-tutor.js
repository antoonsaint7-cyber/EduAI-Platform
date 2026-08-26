export const VOICE_MODES = Object.freeze({ speechToText: 'stt', textToSpeech: 'tts' });

export function createVoiceTutorRequest({ text, language = 'en', mode = VOICE_MODES.textToSpeech } = {}) {
  if (!text || typeof text !== 'string') throw new Error('text is required');
  if (!Object.values(VOICE_MODES).includes(mode)) throw new Error('unsupported voice mode');
  return { text, language, mode };
}

export function normalizeTranscript(transcript) {
  return String(transcript ?? '').trim().replace(/\s+/g, ' ');
}
