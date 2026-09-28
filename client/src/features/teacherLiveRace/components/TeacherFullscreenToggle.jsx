import { useTranslation } from "react-i18next";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Maximize2, Minimize2 } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";

export default function TeacherFullscreenToggle({ fullscreen, onToggle }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const label = t(fullscreen ? "header.fullscreenExit" : "header.fullscreenEnter");
  const Icon = fullscreen ? Minimize2 : Maximize2;

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="light"
        size="xl"
        radius="xl"
        aria-label={label}
        aria-pressed={fullscreen}
        onClick={onToggle}
      >
        <Icon size={22} aria-hidden="true" />
      </ActionIcon>
    </Tooltip>
  );
}
