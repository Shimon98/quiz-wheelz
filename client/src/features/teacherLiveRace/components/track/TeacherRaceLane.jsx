import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { cx } from "../../../../utils/classNameUtils";
import {
  TEACHER_PLAYER_STATUS_PRESENTATION,
  TEACHER_RACE_PROJECTOR_CONFIG,
} from "../../config/teacherRaceProjectorConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../../styles/teacherRaceProjectorStyles";
import TeacherRaceVehicle from "./TeacherRaceVehicle";

const VEHICLE_TWEEN = Object.freeze({
  duration: TEACHER_RACE_PROJECTOR_CONFIG.vehicleTweenMs / 1000,
  ease: "linear",
});

const IMMEDIATE = Object.freeze({ duration: 0 });

export default function TeacherRaceLane({ lane }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const reduce = useReducedMotion();
  const status = TEACHER_PLAYER_STATUS_PRESENTATION[lane.status];
  const StatusIcon = status?.icon;
  const target = `${lane.progressPercent}%`;

  return (
    <div
      className={cx(S.lane, status?.muted && S.muted)}
      data-lane-number={lane.laneNumber}
      data-race-player-id={lane.racePlayerId}
      data-progress-percent={lane.progressPercent}
    >
      <div className={S.laneLabel}>
        <span className={S.laneName} dir="auto">
          {lane.displayName}
        </span>
        {StatusIcon ? (
          <StatusIcon size={14} aria-label={t(status.labelKey)} role="img" />
        ) : null}
      </div>
      <div
        className={S.laneStrip}
        role="progressbar"
        aria-label={t("track.lane", { lane: lane.laneNumber })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(lane.progressPercent)}
      >
        <div className={S.laneRail}>
          <motion.div
            className={S.laneVehicleSlot}
            initial={false}
            animate={{ left: target }}
            transition={reduce ? IMMEDIATE : VEHICLE_TWEEN}
          >
            <TeacherRaceVehicle
              accentColor={lane.accentColor}
              vehicleAssetKey={lane.vehicleAssetKey}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
