export const AUDIO_KINDS = Object.freeze({
  SFX: "sfx",
  LOOP: "loop",
  MUSIC: "music",
});

export const AUDIO_LOOP_CHANNELS = Object.freeze({
  ENGINE: "engine",
  AMBIENCE: "ambience",
});

export const AUDIO_ENGINE_STATUS = Object.freeze({
  LOCKED: "locked",
  RUNNING: "running",
  SUSPENDED: "suspended",
  INTERRUPTED: "interrupted",
  UNAVAILABLE: "unavailable",
});

export const AUDIO_PLAY_RESULTS = Object.freeze({
  PLAYED: "played",
  MUTED: "muted",
  LOCKED: "locked",
  NOT_READY: "not-ready",
  COOLDOWN: "cooldown",
  VOICE_LIMIT: "voice-limit",
  MISSING: "missing",
  FAILED: "failed",
});
