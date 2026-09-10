import { useTranslation } from "react-i18next";
import { FlagIcon, FlameIcon, TrophyIcon } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { getStudentRaceHudModel } from "../utils/getStudentRaceHudModel";
import StudentRaceQuestionTimer from "./StudentRaceQuestionTimer";
import StudentRaceSpeedometer from "./StudentRaceSpeedometer";
import StudentRaceReward from "./StudentRaceReward";
import "../styles/studentRaceHud.css";

function HudStatChip({ icon: Icon, label, value, accessibleLabel }) {
  return (
    <div className="race-hud-stat" aria-label={accessibleLabel}>
      <div className="race-hud-stat-label">
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </div>
      <span className="race-hud-stat-value" dir="ltr" title={value}>{value}</span>
    </div>
  );
}

export default function StudentRaceHud({ runtimeState = null, question = null, answerFeedback = null }) {
  const { t, i18n } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const hud = getStudentRaceHudModel(runtimeState, i18n.resolvedLanguage, answerFeedback);

  if (hud == null) return null;

  return (
    <div className="student-race-hud" style={hud.style} data-reward={hud.reward != null}>
      <div className="race-hud-top">
        <HudStatChip key={hud.rewardKey} icon={TrophyIcon} label={t("hud.scoreLabel")} value={hud.scoreText} />
        {question ? <StudentRaceQuestionTimer {...question} /> : <span aria-hidden="true" />}
        {hud.rankText != null ? (
          <HudStatChip
            icon={FlagIcon}
            label={t("hud.rankLabel")}
            value={hud.rankText}
            accessibleLabel={t("hud.rankValue", { rank: hud.rank, count: hud.playerCount })}
          />
        ) : <span aria-hidden="true" />}
      </div>
      <div className="race-hud-telemetry">
        <div
          key={hud.rewardKey}
          className="race-hud-combo"
          data-active={hud.isCombo}
          data-celebrating={hud.reward != null}
          aria-label={t("hud.streakValue", { count: hud.streak })}
        >
          <FlameIcon aria-hidden="true" />
          <div className="race-hud-combo-copy">
            <span className="race-hud-combo-label">{t(hud.streakLabelKey)}</span>
            <strong dir="ltr">{hud.streakText}</strong>
          </div>
        </div>
        <div className="race-hud-progress">
          {hud.progressPercent != null ? (
            <>
              <div className="race-hud-progress-caption">
                <span>{t("hud.progressShortLabel")}</span>
                <span dir="ltr" aria-hidden="true">{hud.progressText}</span>
              </div>
              <div
                className="race-hud-progress-track"
                role="progressbar"
                aria-label={t("hud.progressLabel")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={hud.progressPercent}
              >
                <div className="race-hud-progress-fill" style={hud.progressStyle} />
              </div>
            </>
          ) : null}
        </div>
        <StudentRaceSpeedometer speed={hud.speed} />
      </div>
      <StudentRaceReward key={hud.rewardKey} reward={hud.reward} />
    </div>
  );
}
