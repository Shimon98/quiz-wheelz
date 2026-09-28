import { useId } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import RaceRankMedal from "../../../shared/components/raceRank/RaceRankMedal";
import { RACE_RANK_MEDAL_SIZES } from "../../../shared/components/raceRank/raceRankMedalConfig";
import { TEACHER_RACE_PROJECTOR_ART } from "../../teacherLiveRace/assets/teacherRaceProjectorArt";
import { TEACHER_RESULTS_WINNER_ENTRANCE as ENTRANCE } from "../config/teacherRaceResultsConfig";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";

export default function TeacherResultsWinners({ winners }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);
  const reduce = useReducedMotion();
  const titleId = useId();

  return (
    <section className={S.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={S.panelTitle}>
        <img
          className={S.panelTitleArt}
          src={TEACHER_RACE_PROJECTOR_ART.uiAccents.leaderboardTrophy}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        {t("winners.title", { count: winners.length })}
      </h2>
      {winners.length === 0 ? (
        <p className={S.emptyText}>{t("winners.none")}</p>
      ) : (
        <ul className={S.winnersList}>
          {winners.map((winner) => (
            <motion.li
              key={winner.racePlayerId}
              className={S.winnerCard}
              initial={reduce ? false : ENTRANCE.initial}
              animate={ENTRANCE.animate}
              transition={ENTRANCE.transition}
              data-race-player-id={winner.racePlayerId}
            >
              <RaceRankMedal rank={winner.rank} medal={winner.medal} size={RACE_RANK_MEDAL_SIZES.LG} />
              {winner.vehicleSrc ? (
                <img className={S.winnerKart} src={winner.vehicleSrc} alt="" aria-hidden="true" draggable={false} />
              ) : null}
              <span className={S.winnerName} title={winner.displayName}>
                {winner.displayName}
              </span>
              <span className={S.winnerScore}>{t("winners.points", { count: winner.score })}</span>
              <span className={S.winnerMeta}>
                {t("winners.meta", { correct: winner.correctAnswers, streak: winner.bestStreak })}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
