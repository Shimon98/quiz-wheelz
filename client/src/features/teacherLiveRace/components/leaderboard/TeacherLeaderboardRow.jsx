import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { cx } from "../../../../utils/classNameUtils";
import {
  TEACHER_LEADERBOARD_DEFAULT_TIER,
  TEACHER_LEADERBOARD_RANK_TIERS,
  TEACHER_LEADERBOARD_TIER_MEDALS,
  TEACHER_PLAYER_STATUS_PRESENTATION,
  TEACHER_RACE_PROJECTOR_CONFIG,
} from "../../config/teacherRaceProjectorConfig";
import {
  buildLaneAccentStyle,
  TEACHER_PROJECTOR_STYLES as S,
} from "../../styles/teacherRaceProjectorStyles";

const LAYOUT_TRANSITION = Object.freeze({
  layout: {
    duration: TEACHER_RACE_PROJECTOR_CONFIG.leaderboardLayoutMs / 1000,
    ease: TEACHER_RACE_PROJECTOR_CONFIG.leaderboardLayoutEase,
  },
});

const BAR_TRANSITION_STYLE = Object.freeze({
  transitionDuration: `${TEACHER_RACE_PROJECTOR_CONFIG.vehicleTweenMs}ms`,
});

function RankBadge({ rank, medal }) {
  if (!medal) {
    return <span className={S.leaderboardRank}>{rank}</span>;
  }

  const tone = S.leaderboardMedalTone[medal];

  return (
    <span className={S.leaderboardMedal} data-medal={medal}>
      <span className={cx(S.leaderboardMedalRibbon, tone.ribbon)} aria-hidden="true" />
      <span className={cx(S.leaderboardMedalDisk, tone.disk)}>{rank}</span>
    </span>
  );
}

export default function TeacherLeaderboardRow({ row }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const reduce = useReducedMotion();
  const status = TEACHER_PLAYER_STATUS_PRESENTATION[row.status];
  const StatusIcon = status?.icon;
  const progressPercent = Math.round(row.progressPercent);
  const rankTier =
    TEACHER_LEADERBOARD_RANK_TIERS[row.rank] ?? TEACHER_LEADERBOARD_DEFAULT_TIER;

  return (
    <motion.li
      layout={reduce ? false : "position"}
      transition={LAYOUT_TRANSITION}
      className={cx(
        S.leaderboardRow,
        S.leaderboardRowTier[rankTier],
        status?.muted && S.muted,
      )}
      style={buildLaneAccentStyle(row.accentColor)}
      data-race-player-id={row.racePlayerId}
      data-rank-tier={rankTier}
    >
      <RankBadge rank={row.rank} medal={TEACHER_LEADERBOARD_TIER_MEDALS[rankTier]} />
      <span
        className={cx(S.leaderboardSwatch, !row.accentColor && S.vehicleFallback)}
        style={row.accentColor ? { backgroundColor: row.accentColor } : undefined}
        aria-hidden="true"
      />
      <span className={S.leaderboardName}>{row.displayName}</span>
      <span className={S.leaderboardMeta}>
        <span>{t("leaderboard.points", { count: row.score })}</span>
        {row.streak > 0 ? (
          <span className={S.leaderboardStreak}>
            {t("leaderboard.streak", { count: row.streak })}
          </span>
        ) : null}
        <span className={S.leaderboardProgress} dir="ltr">
          {t("track.progress", { percent: progressPercent })}
        </span>
        {StatusIcon ? (
          <StatusIcon size={14} aria-label={t(status.labelKey)} role="img" />
        ) : null}
      </span>
      <span className={S.leaderboardBar} aria-hidden="true">
        <span
          className={S.leaderboardBarFill}
          style={{ ...BAR_TRANSITION_STYLE, width: `${progressPercent}%` }}
          data-progress-fill
        />
      </span>
    </motion.li>
  );
}
