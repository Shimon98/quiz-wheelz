import { create } from "zustand";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "../constants/messageConstants";

export const useLanguageStore = create((set) => ({
  language: DEFAULT_LANGUAGE,

  setLanguage: (language) => {
    const supportedValues = Object.values(SUPPORTED_LANGUAGES);

    if (!supportedValues.includes(language)) {
      return;
    }

    set({ language });
  },
}));
