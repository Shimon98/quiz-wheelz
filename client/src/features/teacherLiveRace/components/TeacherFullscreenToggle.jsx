import { useTranslation } from "react-i18next";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Maximize2, Minimize2 } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";

// The browser may refuse fullscreen (permissions, a frame without allowfullscreen) and Mantine's toggle then rejects.
// Its fullscreen events already keep the real state, so a refusal only needs catching: the button stays as it is.
const keepStateOnRefusal = () => {};

export default function TeacherFullscreenToggle({ fullscreen, onToggle }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const label = t(fullscreen ? "header.fullscreenExit" : "header.fullscreenEnter");
  const Icon = fullscreen ? Minimize2 : Maximize2;
  const requestToggle = () => {
    Promise.resolve(onToggle?.()).catch(keepStateOnRefusal);
  };

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="light"
        size="xl"
        radius="xl"
        aria-label={label}
        aria-pressed={fullscreen}
        onClick={requestToggle}
      >
        <Icon size={22} aria-hidden="true" />
      </ActionIcon>
    </Tooltip>
  );
}
