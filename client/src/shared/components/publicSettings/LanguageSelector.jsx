import { SegmentedControl, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "../../../stores/languageStore";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { LANGUAGE_OPTIONS } from "./publicSettingsConfig";

/**
 * LanguageSelector — Hebrew / English toggle on a Mantine SegmentedControl.
 * Reads and writes the single app language state (languageStore);
 * LanguageProvider handles i18next + html lang/dir downstream. Endonym labels
 * carry their own `lang` so screen readers pronounce them correctly and bidi
 * stays isolated.
 */
export default function LanguageSelector() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return (
    <Stack gap="xs">
      <Text component="h3" fw={700} size="sm">
        {t("language.title")}
      </Text>
      <SegmentedControl
        fullWidth
        value={language}
        onChange={setLanguage}
        data={LANGUAGE_OPTIONS.map((option) => ({
          value: option.value,
          label: <span lang={option.value}>{option.endonym}</span>,
        }))}
      />
    </Stack>
  );
}
