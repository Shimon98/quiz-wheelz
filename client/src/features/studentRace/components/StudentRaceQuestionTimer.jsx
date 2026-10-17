import { useTranslation } from "react-i18next";
import { TimerIcon } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { useStudentRaceQuestionTimer } from "../hooks/useStudentRaceQuestionTimer";
import "../styles/studentRaceHud.css";

export default function StudentRaceQuestionTimer({ labelKey = "timer.label", ...countdown }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const timer = useStudentRaceQuestionTimer(countdown);

  return (
    <div className="race-hud-timer" data-urgency={timer.urgency} aria-label={t(labelKey)}>
      <div className="race-hud-timer-face" dir="ltr">
        <TimerIcon aria-hidden="true" />
        <span className="race-hud-timer-value">{timer.timeText}</span>
      </div>
      {timer.progressStyle != null ? (
        <div className="race-hud-timer-track" aria-hidden="true">
          <div className="race-hud-timer-fill" style={timer.progressStyle} />
        </div>
      ) : null}
    </div>
  );
}
