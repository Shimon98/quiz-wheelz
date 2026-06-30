import { useLayoutEffect } from "react";
import { useLanguageStore } from "../../stores/languageStore";
import { getLanguageDirection } from "../../utils/languageDirectionUtils";
import i18n from "../../i18n";

/**
 * LanguageProvider — syncs the selected language (owned by languageStore) into
 * i18next and the <html> element's lang/dir attributes.
 *
 * Renders children only; all side effects live here, never in App.jsx.
 * Direction is derived from the language (never dir="auto"). Writes are
 * idempotent, so React StrictMode's double-invoke is safe.
 */
export default function LanguageProvider({ children }) {
  const language = useLanguageStore((state) => state.language);

  useLayoutEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.lang = language;
      root.dir = getLanguageDirection(language);
    }
  }, [language]);

  return children;
}
