import { useTranslation } from "react-i18next";
import { Button } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";

export default function StudentRaceInlineRetryButton({ onRetry, labelKey = "status.retry" }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);

  if (!onRetry) return null;

  return (
    <Button size="compact-sm" variant="light" color={UI_TONES.DANGER} onClick={onRetry}>
      {t(labelKey)}
    </Button>
  );
}
