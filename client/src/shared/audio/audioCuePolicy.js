import { AUDIO_PLAY_RESULTS } from "./audioTypes";

export function createAudioCuePolicy() {
  const cues = new Map();

  return {
    acquire(key, nowMs, { cooldownMs, maxVoices }) {
      const cue = cues.get(key) ?? { voices: 0, startedAt: -Infinity };
      if (nowMs - cue.startedAt < cooldownMs) return AUDIO_PLAY_RESULTS.COOLDOWN;
      if (cue.voices >= maxVoices) return AUDIO_PLAY_RESULTS.VOICE_LIMIT;
      cues.set(key, { voices: cue.voices + 1, startedAt: nowMs });
      return null;
    },
    release(key) {
      const cue = cues.get(key);
      if (cue) cues.set(key, { ...cue, voices: Math.max(0, cue.voices - 1) });
    },
    clear: () => cues.clear(),
  };
}
