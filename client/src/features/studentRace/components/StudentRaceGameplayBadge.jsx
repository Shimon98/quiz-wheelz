import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { getRaceGameplayPresentation } from "../config/raceGameplayPresentationConfig";
import "../styles/studentRaceGameplay.css";

export default function StudentRaceGameplayBadge({ gameplay, className = "" }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const presentation = getRaceGameplayPresentation(gameplay);

  if (presentation == null) return null;

  const Icon = presentation.icon;

  return (
    <span className={`race-gameplay-badge ${className}`} data-gameplay={gameplay}>
      <Icon aria-hidden="true" focusable="false" />
      <span>{t(presentation.titleKey)}</span>
    </span>
  );
}
