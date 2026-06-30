/*
 * Single i18next instance for QuizWheelz.
 *
 * Initialized once at module load. Language STATE is owned by languageStore;
 * the initial `lng` is read from it (so a persisted choice is honored without
 * a flash) and LanguageProvider keeps i18next in sync afterwards. No language
 * detector plugin — that would be a competing source of truth.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { useLanguageStore } from "../stores/languageStore";
import { i18nResources } from "./resources";
import {
  FALLBACK_LANGUAGE,
  I18N_NAMESPACE_LIST,
  DEFAULT_NAMESPACE,
} from "./i18nConstants";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: i18nResources,
    lng: useLanguageStore.getState().language,
    fallbackLng: FALLBACK_LANGUAGE,
    ns: I18N_NAMESPACE_LIST,
    defaultNS: DEFAULT_NAMESPACE,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
