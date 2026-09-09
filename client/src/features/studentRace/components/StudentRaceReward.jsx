import { useTranslation } from "react-i18next";
import { BadgeCheckIcon, SparklesIcon } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";

export default function StudentRaceReward({ reward }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  if (reward == null) return null;

  return (
    <div className="race-hud-reward" data-kind={reward.kind} role="status" aria-atomic="true">
      <SparklesIcon className="race-hud-reward-spark" aria-hidden="true" />
      <BadgeCheckIcon className="race-hud-reward-medal" aria-hidden="true" />
      <div className="race-hud-reward-copy">
        <strong>{t(reward.titleKey)}</strong>
        <span>{t("reward.streak", { count: reward.streak })}</span>
      </div>
      {reward.pointsText != null ? (
        <div className="race-hud-reward-points">
          <strong dir="ltr">{reward.pointsText}</strong>
          <span>{t("reward.points")}</span>
        </div>
      ) : null}
    </div>
  );
}
