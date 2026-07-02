import { Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../../stores/themeStore";
import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { THEME_MODE_OPTIONS } from "./publicSettingsConfig";

/**
 * ThemeModeSelector — system / light / dark on a Mantine SegmentedControl.
 * Reads and writes themeStore; ThemeProvider + MantineUIProvider resolve the
 * applied scheme downstream. Labels from i18n, icons decorative.
 */
export default function ThemeModeSelector() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <Stack gap="xs">
      <Text component="h3" fw={700} size="sm">
        {t("theme.title")}
      </Text>
      <SegmentedControl
        fullWidth
        value={mode}
        onChange={setMode}
        data={THEME_MODE_OPTIONS.map(({ value, labelKey, Icon }) => ({
          value,
          label: (
            <Group gap={6} justify="center" wrap="nowrap">
              <Icon aria-hidden="true" size={16} />
              <span>{t(labelKey)}</span>
            </Group>
          ),
        }))}
      />
    </Stack>
  );
}
