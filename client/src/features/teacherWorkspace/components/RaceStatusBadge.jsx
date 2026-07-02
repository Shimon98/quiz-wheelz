import { useTranslation } from "react-i18next";
import { Badge } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { getRaceStatusConfig } from "../config/raceStatusConfig";

/**
 * RaceStatusBadge — THE one way a race status is rendered in the workspace.
 * Tone + label come from raceStatusConfig; unknown statuses fall back to the
 * neutral badge instead of breaking a row.
 */
export default function RaceStatusBadge({ status, size = "md" }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_WORKSPACE);
  const statusConfig = getRaceStatusConfig(status);

  return (
    <Badge variant="light" color={statusConfig.tone} size={size} radius="md">
      {t(statusConfig.labelKey)}
    </Badge>
  );
}
