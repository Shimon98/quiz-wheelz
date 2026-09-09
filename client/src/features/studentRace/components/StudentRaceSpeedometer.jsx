import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { getStudentRaceSpeedometerModel } from "../utils/getStudentRaceSpeedometerModel";
import "../styles/studentRaceSpeedometer.css";

export default function StudentRaceSpeedometer({ speed }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const model = getStudentRaceSpeedometerModel(speed);

  if (model == null) return null;

  return (
    <div
      className="student-race-speedometer"
      role="img"
      aria-label={t("hud.speedValue", { speed: model.valueText })}
    >
      <svg viewBox="0 0 88 55" aria-hidden="true" focusable="false">
        <path className="race-speedometer-track" d="M 14 33 A 30 30 0 0 1 74 33" />
        <path
          className="race-speedometer-arc"
          d="M 14 33 A 30 30 0 0 1 74 33"
          pathLength="100"
          style={model.arcStyle}
        />
        <path className="race-speedometer-ticks" d="M 20 33 H 23 M 44 9 V 12 M 65 33 H 68" />
        <line
          className="race-speedometer-needle"
          x1="44"
          y1="33"
          x2="21"
          y2="33"
          style={model.needleStyle}
        />
        <circle className="race-speedometer-hub" cx="44" cy="33" r="3" />
      </svg>
      <span className="race-speedometer-value" dir="ltr" aria-hidden="true">
        {model.valueText}
      </span>
    </div>
  );
}
