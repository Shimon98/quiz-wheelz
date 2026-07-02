import { create } from "zustand";

export const THEME_MODES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
});

const ALLOWED_MODES = Object.values(THEME_MODES);
const DEFAULT_MODE = THEME_MODES.SYSTEM;
const THEME_STORAGE_KEY = "qw-theme-mode";

function isValidMode(mode) {
  return ALLOWED_MODES.includes(mode);
}

function readStoredMode() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isValidMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function writeStoredMode(mode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable (private mode / blocked) — keep in-memory only.
  }
}

export const useThemeStore = create((set) => ({
  mode: readStoredMode(),

  setMode: (mode) => {
    if (!isValidMode(mode)) {
      return;
    }

    writeStoredMode(mode);
    set({ mode });
  },
}));
