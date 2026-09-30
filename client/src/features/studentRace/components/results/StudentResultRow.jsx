import { useTranslation } from "react-i18next";
import { Badge } from "@mantine/core";
import { motion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { UI_TONES } from "../../../../app/theme/quizWheelzTheme";
import { cx } from "../../../../utils/classNameUtils";
import RacePlacementBadge from "../../../../shared/components/raceRank/RacePlacementBadge";
import { STUDENT_RESULTS_STYLES as S } from "../../styles/studentRaceResultsStyles";
import { resolveResultRowMotion } from "../../utils/studentResultsPresentation";

export default function StudentResultRow({ participant, status, reducedMotion }) {
  const { t } = useTranslation(I18N_NAMESPACES.STUDENT_RACE);
  const StatusIcon = status?.icon;

  return (
    <motion.li
      {...resolveResultRowMotion(participant.racePlayerId, reducedMotion)}
      className={cx(S.row, participant.isMe && S.rowMe)}
      style={{ "--qw-lane-accent": participant.accentColor }}
      data-race-player-id={participant.racePlayerId}
    >
      <span className={S.rowLead}>
        {participant.rank != null ? (
          <RacePlacementBadge
            rank={participant.rank}
            placementArtEligible={participant.placementArtEligible}
            accentColor={participant.accentColor}
          />
        ) : (
          <span className={S.rowStatusIcon} aria-hidden="true">
            {StatusIcon ? <StatusIcon size={16} /> : null}
          </span>
        )}
      </span>

      {participant.vehicleSrc ? (
        <img
          className={cx(S.rowKart, status?.muted && S.rowKartMuted)}
          src={participant.vehicleSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      ) : null}

      <span className={S.rowIdentity}>
        <bdi className={S.rowName} title={participant.displayName}>
          {participant.displayName}
        </bdi>
        {participant.isMe ? (
          <Badge size="sm" variant="filled" color={UI_TONES.SUCCESS}>
            {t("results.you")}
          </Badge>
        ) : null}
      </span>

      {status ? <span className={S.rowStatus}>{t(status.labelKey)}</span> : null}
    </motion.li>
  );
}
