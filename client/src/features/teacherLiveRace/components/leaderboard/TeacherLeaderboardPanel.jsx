import { useTranslation } from "react-i18next";
import { LayoutGroup } from "framer-motion";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";
import TeacherLeaderboardRow from "./TeacherLeaderboardRow";

export default function TeacherLeaderboardPanel({ rows }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);

  return (
    <section className={S.panel} aria-label={t("leaderboard.title")}>
      <h2 className={S.panelTitle}>{t("leaderboard.title")}</h2>
      {rows.length === 0 ? (
        <p className={S.eventsEmpty}>{t("leaderboard.empty")}</p>
      ) : (
        <LayoutGroup>
          <ol className={S.leaderboardList}>
            {rows.map((row) => (
              <TeacherLeaderboardRow key={row.racePlayerId} row={row} />
            ))}
          </ol>
        </LayoutGroup>
      )}
    </section>
  );
}
