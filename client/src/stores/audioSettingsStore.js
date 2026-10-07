import { create } from "zustand";

import {
  AUDIO_SETTINGS_DEFAULTS,
  isValidAudioSetting,
  sanitizeAudioSettings,
} from "../shared/audio/audioSettings";

const AUDIO_SETTINGS_STORAGE_KEY = "qw-audio";

function readStoredAudioSettings() {
  try {
    const stored = window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    return sanitizeAudioSettings(stored == null ? null : JSON.parse(stored));
  } catch {
    return { ...AUDIO_SETTINGS_DEFAULTS };
  }
}

function writeStoredAudioSettings(settings) {
  try {
    window.localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private mode / blocked) — keep in-memory only.
  }
}

export const useAudioSettingsStore = create((set, get) => {
  const apply = (patch) => {
    writeStoredAudioSettings({ ...sanitizeAudioSettings(get()), ...patch });
    set(patch);
  };

  const setterFor = (field) => (value) => {
    if (isValidAudioSetting(field, value)) apply({ [field]: value });
  };

  return {
    ...readStoredAudioSettings(),
    setMusicEnabled: setterFor("musicEnabled"),
    setSfxEnabled: setterFor("sfxEnabled"),
    setMusicVolume: setterFor("musicVolume"),
    setSfxVolume: setterFor("sfxVolume"),
    resetAudioSettings: () => apply({ ...AUDIO_SETTINGS_DEFAULTS }),
  };
});
