import { useId } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import RacePlacementBadge from "../../../shared/components/raceRank/RacePlacementBadge";
import RaceResultsStage from "../../../shared/components/raceResults/RaceResultsStage";
import { TEACHER_RACE_PROJECTOR_ART } from "../../teacherLiveRace/assets/teacherRaceProjectorArt";
import { buildLaneAccentStyle } from "../../teacherLiveRace/styles/teacherRaceProjectorStyles";
import {
  resolveTeacherWinnerLayout,
  TEACHER_RESULTS_WINNER_ENTRANCE as ENTRANCE,
} from "../config/teacherRaceResultsConfig";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";

function TeacherResultsWinnerVehicle({ winner, stageClassName }) {
  if (winner.heroVehicleSrc) {
    return <RaceResultsStage kartSrc={winner.heroVehicleSrc} className={stageClassName} />;
  }

  if (!winner.vehicleSrc) {
    return null;
  }

  return <img className={S.winnerKart} src={winner.vehicleSrc} alt="" aria-hidden="true" draggable={false} />;
}

export default function TeacherResultsWinners({ winners }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);
  const reduce = useReducedMotion();
  const titleId = useId();
  const layout = resolveTeacherWinnerLayout(winners.length);
  const L = S.winnerLayout[layout.id];

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
        <ul className={L.list} data-winner-layout={layout.id}>
          {winners.map((winner) => (
            <motion.li
              key={winner.racePlayerId}
              className={L.card}
              style={buildLaneAccentStyle(winner.accentColor)}
              initial={reduce ? false : ENTRANCE.initial}
              animate={ENTRANCE.animate}
              transition={ENTRANCE.transition}
              data-race-player-id={winner.racePlayerId}
            >
              <span className={L.art}>
                <span className={L.placement}>
                  <RacePlacementBadge
                    rank={winner.rank}
                    placementArtEligible={winner.placementArtEligible}
                    size={layout.placementSize}
                  />
                </span>
                <TeacherResultsWinnerVehicle winner={winner} stageClassName={L.stage} />
              </span>
              <span className={L.text}>
                <bdi className={S.winnerName} title={winner.displayName}>
                  {winner.displayName}
                </bdi>
                <span className={S.winnerScore}>{t("winners.points", { count: winner.score })}</span>
                <span className={S.winnerMeta}>
                  {t("winners.meta", { correct: winner.correctAnswers, streak: winner.bestStreak })}
                </span>
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
