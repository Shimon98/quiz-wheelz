import { ActionIcon, Popover } from "@mantine/core";
import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { useAudioSettingsStore } from "../../../stores/audioSettingsStore";
import AudioSettingsControls from "./AudioSettingsControls";

export default function AudioSettingsButton({ size = "lg", variant = "default", withinPortal = true, className }) {
  const { t } = useTranslation(I18N_NAMESPACES.PUBLIC_SETTINGS);
  const silent = useAudioSettingsStore((state) => !state.musicEnabled && !state.sfxEnabled);
  const Icon = silent ? VolumeX : Volume2;

  return (
    <Popover position="bottom-end" shadow="md" radius="md" withArrow trapFocus returnFocus withinPortal={withinPortal}>
      <Popover.Target>
        <ActionIcon variant={variant} size={size} radius="xl" aria-label={t("audio.buttonLabel")} className={className}>
          <Icon aria-hidden="true" size="55%" />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <AudioSettingsControls />
      </Popover.Dropdown>
    </Popover>
  );
}
