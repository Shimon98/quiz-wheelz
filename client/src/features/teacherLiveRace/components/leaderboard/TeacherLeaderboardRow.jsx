import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { cx } from "../../../../utils/classNameUtils";
import {
  TEACHER_PLAYER_STATUS_PRESENTATION,
  TEACHER_RACE_PROJECTOR_CONFIG,
} from "../../config/teacherRaceProjectorConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";

const LAYOUT_TRANSITION = Object.freeze({
  layout: {
    duration: TEACHER_RACE_PROJECTOR_CONFIG.leaderboardLayoutMs / 1000,
    ease: "easeInOut",
  },
});

export default function TeacherLeaderboardRow({ row }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const reduce = useReducedMotion();
  const status = TEACHER_PLAYER_STATUS_PRESENTATION[row.status];
  const StatusIcon = status?.icon;

  return (
    <motion.li
      layout={reduce ? false : "position"}
      transition={LAYOUT_TRANSITION}
      className={cx(S.leaderboardRow, status?.muted && S.muted)}
      data-race-player-id={row.racePlayerId}
    >
      <span className={S.leaderboardRank}>{row.rank}</span>
      <span
        className={cx(S.leaderboardSwatch, !row.accentColor && S.vehicleFallback)}
        style={row.accentColor ? { backgroundColor: row.accentColor } : undefined}
        aria-hidden="true"
      />
      <span className={S.leaderboardName}>{row.displayName}</span>
      <span className={S.leaderboardMeta}>
        <span>{t("leaderboard.points", { count: row.score })}</span>
        {row.streak > 0 ? (
          <span>{t("leaderboard.streak", { count: row.streak })}</span>
        ) : null}
        <span dir="ltr">{t("track.progress", { percent: Math.round(row.progressPercent) })}</span>
        {StatusIcon ? (
          <StatusIcon size={14} aria-label={t(status.labelKey)} role="img" />
        ) : null}
      </span>
    </motion.li>
  );
}
