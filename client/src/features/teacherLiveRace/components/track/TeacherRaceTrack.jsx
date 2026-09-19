import { useTranslation } from "react-i18next";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";
import TeacherRaceProgressScale from "./TeacherRaceProgressScale";
import TeacherRaceLane from "./TeacherRaceLane";

export default function TeacherRaceTrack({ lanes }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);

  return (
    <section
      className={S.panel}
      aria-label={t("track.title")}
      data-testid="teacher-race-track"
      dir="ltr"
    >
      <div className={S.track}>
        <div className={S.trackEdges}>
          <span>{t("track.start")}</span>
          <span>{t("track.finish")}</span>
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
