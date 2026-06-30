import { create } from "zustand";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "../constants/messageConstants";

const LANGUAGE_STORAGE_KEY = "qw-language";
const SUPPORTED_VALUES = Object.values(SUPPORTED_LANGUAGES);

function isValidLanguage(language) {
  return SUPPORTED_VALUES.includes(language);
}

function readStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isValidLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function writeStoredLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // localStorage unavailable (private mode / blocked) — keep in-memory only.
  }
}

export const useLanguageStore = create((set) => ({
  language: readStoredLanguage(),

  setLanguage: (language) => {
    if (!isValidLanguage(language)) {
      return;
    }

    writeStoredLanguage(language);
    set({ language });
  },
}));
