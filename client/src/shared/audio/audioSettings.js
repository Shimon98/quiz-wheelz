export const AUDIO_SETTINGS_DEFAULTS = Object.freeze({
  musicEnabled: false,
  sfxEnabled: true,
  musicVolume: 0.6,
  sfxVolume: 0.75,
});

const isFlag = (value) => typeof value === "boolean";
const isVolume = (value) => Number.isFinite(value) && value >= 0 && value <= 1;

const AUDIO_SETTING_VALIDATORS = Object.freeze({
  musicEnabled: isFlag,
  sfxEnabled: isFlag,
  musicVolume: isVolume,
  sfxVolume: isVolume,
});

export function isValidAudioSetting(field, value) {
  return AUDIO_SETTING_VALIDATORS[field]?.(value) === true;
}

export function sanitizeAudioSettings(candidate, fallback = AUDIO_SETTINGS_DEFAULTS) {
  const source = candidate !== null && typeof candidate === "object" ? candidate : {};
  return Object.fromEntries(Object.keys(AUDIO_SETTINGS_DEFAULTS).map((field) => [
    field,
    isValidAudioSetting(field, source[field]) ? source[field] : fallback[field],
  ]));
}
