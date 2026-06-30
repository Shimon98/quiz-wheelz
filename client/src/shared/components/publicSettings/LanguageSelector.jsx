import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "../../../utils/classNameUtils";
import { useLanguageStore } from "../../../stores/languageStore";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { LANGUAGE_OPTIONS } from "./publicSettingsConfig";
import { PUBLIC_SETTINGS_STYLES as S } from "./publicSettingsStyles";

const TITLE_ID = "public-settings-language-title";

/**
 * LanguageSelector — Hebrew / English toggle. Reads and writes the single app
 * language state (languageStore); LanguageProvider handles i18next + html
 * lang/dir downstream. Endonym labels carry their own `lang` so screen readers
 * pronounce them correctly and bidi stays isolated.
 */
export default function LanguageSelector() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return (
    <section className={S.section} aria-labelledby={TITLE_ID}>
      <h3 id={TITLE_ID} className={S.sectionTitle}>
        {t("language.title")}
      </h3>

      <div className={S.optionGroup} role="group" aria-labelledby={TITLE_ID}>
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = option.value === language;
          return (
            <button
              key={option.value}
              type="button"
              lang={option.value}
              onClick={() => setLanguage(option.value)}
              aria-pressed={selected}
              className={cx(S.option, selected && S.optionSelected)}
            >
              <span className={S.optionLabel}>{option.endonym}</span>
              {selected && <Check aria-hidden="true" className={S.optionCheck} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
