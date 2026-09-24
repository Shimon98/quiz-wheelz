import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { cx } from "../../../../utils/classNameUtils";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../config/teacherRaceProjectorConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";

export default function TeacherRaceProgressScale() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);

  return (
    <div className={S.scale} aria-hidden="true">
      <span />
      <div className={S.scaleTrack}>
        {TEACHER_RACE_PROJECTOR_CONFIG.progressMarkers.map((marker) => (
          <span
            key={marker.value}
            className={cx(S.scaleMarker, !marker.compact && S.scaleMarkerWide)}
            style={{ left: `${marker.value}%` }}
            data-marker={marker.value}
          >
            {t("track.progress", { percent: marker.value })}
          </span>
        ))}
      </div>
    </div>
  );
}
