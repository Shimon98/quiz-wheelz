import { Group, Stack, Switch, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { useAudioSettingsStore } from "../../../stores/audioSettingsStore";
import { AUDIO_TOGGLE_OPTIONS } from "./publicSettingsConfig";

export default function AudioSettingsControls() {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);
  const audio = useAudioSettingsStore();

  return (
    <Stack gap="xs">
      <Text component="h3" fw={700} size="sm">
        {t("audio.title")}
      </Text>
      {AUDIO_TOGGLE_OPTIONS.map(({ field, setter, labelKey, Icon }) => (
        <Switch
          key={field}
          checked={audio[field]}
          onChange={(event) => audio[setter](event.currentTarget.checked)}
          label={
            <Group gap={6} wrap="nowrap">
              <Icon aria-hidden="true" size={16} />
              <span>{t(labelKey)}</span>
            </Group>
          }
        />
      ))}
    </Stack>
  );
}
