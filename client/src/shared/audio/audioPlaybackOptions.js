const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 4;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function sanitizeGain(value, fallback = 1) {
  return Number.isFinite(value) ? clamp(value, 0, 1) : fallback;
}

export function sanitizePlaybackRate(value, fallback = 1) {
  return Number.isFinite(value) && value > 0 ? clamp(value, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE) : fallback;
}
