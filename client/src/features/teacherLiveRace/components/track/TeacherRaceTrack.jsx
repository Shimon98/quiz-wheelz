import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { cx } from "../../../../utils/classNameUtils";
import { TRACK_SIGN_KINDS } from "../../config/teacherRaceProjectorConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";
import TeacherRaceProgressScale from "./TeacherRaceProgressScale";
import TeacherRaceLane from "./TeacherRaceLane";
import TeacherTrackSign from "./TeacherTrackSign";

export default function TeacherRaceTrack({ lanes }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);

  return (
    <section
      className={cx(S.panel, S.trackSurface)}
      aria-label={t("track.title")}
      data-testid="teacher-race-track"
      dir="ltr"
    >
      <div className={S.track}>
        <div className={S.trackEdges}>
          <span />
          <div className={S.trackSigns}>
            <TeacherTrackSign kind={TRACK_SIGN_KINDS.START} label={t("track.start")} />
            <TeacherTrackSign kind={TRACK_SIGN_KINDS.FINISH} label={t("track.finish")} />
          </div>
        </div>
        <div className={S.laneStack}>
          {lanes.map((lane) => (
            <TeacherRaceLane key={lane.racePlayerId} lane={lane} />
          ))}
        </div>
        <TeacherRaceProgressScale />
      </div>
    </section>
  );
}
