import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "../../../utils/classNameUtils";
import { useThemeStore } from "../../../stores/themeStore";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { THEME_MODE_OPTIONS } from "./publicSettingsConfig";
import { PUBLIC_SETTINGS_STYLES as S } from "./publicSettingsStyles";

const TITLE_ID = "public-settings-theme-title";

/**
 * ThemeModeSelector — system / light / dark. Reads and writes themeStore;
 * ThemeProvider resolves the data-theme downstream. Labels from i18n, icons
 * decorative.
 */
export default function ThemeModeSelector() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <section className={S.section} aria-labelledby={TITLE_ID}>
      <h3 id={TITLE_ID} className={S.sectionTitle}>
        {t("theme.title")}
      </h3>

      <div className={S.optionGroup} role="group" aria-labelledby={TITLE_ID}>
        {THEME_MODE_OPTIONS.map(({ value, labelKey, Icon }) => {
          const selected = value === mode;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={selected}
              className={cx(S.option, selected && S.optionSelected)}
            >
              <Icon aria-hidden="true" className={S.optionIcon} />
              <span className={S.optionLabel}>{t(labelKey)}</span>
              {selected && <Check aria-hidden="true" className={S.optionCheck} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
