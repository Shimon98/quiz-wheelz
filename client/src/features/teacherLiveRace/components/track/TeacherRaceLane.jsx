import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";

import { I18N_NAMESPACES } from "../../../../i18n/i18nConstants";
import { cx } from "../../../../utils/classNameUtils";
import {
  TEACHER_PLAYER_STATUS_PRESENTATION,
  TEACHER_RACE_PROJECTOR_CONFIG,
} from "../../config/teacherRaceProjectorConfig";
import {
  buildLaneAccentStyle,
  TEACHER_PROJECTOR_STYLES as S,
} from "../../styles/teacherRaceProjectorStyles";
import TeacherRaceVehicle from "./TeacherRaceVehicle";

const VEHICLE_TWEEN = Object.freeze({
  duration: TEACHER_RACE_PROJECTOR_CONFIG.vehicleTweenMs / 1000,
  ease: "linear",
});

const IMMEDIATE = Object.freeze({ duration: 0 });

const PROGRESS_MIN = 0;
const PROGRESS_MAX = 100;

const GUIDE_VARIANTS = Object.freeze({
  [PROGRESS_MIN]: S.laneGuideStart,
  [PROGRESS_MAX]: S.laneGuideFinish,
});

export default function TeacherRaceLane({ lane }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const reduce = useReducedMotion();
  const status = TEACHER_PLAYER_STATUS_PRESENTATION[lane.status];
  const StatusIcon = status?.icon;
  const target = `${lane.progressPercent}%`;
  const transition = reduce ? IMMEDIATE : VEHICLE_TWEEN;

  return (
    <div
      className={S.lane}
      style={buildLaneAccentStyle(lane.accentColor)}
      data-lane-number={lane.laneNumber}
      data-race-player-id={lane.racePlayerId}
      data-progress-percent={lane.progressPercent}
    >
      <div className={cx(S.laneLabel, status?.muted && S.muted)}>
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
        aria-valuemin={PROGRESS_MIN}
        aria-valuemax={PROGRESS_MAX}
        aria-valuenow={Math.round(lane.progressPercent)}
      >
        <div className={S.laneRail}>
          <span className={S.laneRailLine} aria-hidden="true" />
          {TEACHER_RACE_PROJECTOR_CONFIG.progressMarkers.map((marker) => (
            <span
              key={marker.value}
              className={cx(S.laneGuide, GUIDE_VARIANTS[marker.value])}
              style={{ left: `${marker.value}%` }}
              data-guide={marker.value}
              aria-hidden="true"
            />
          ))}
          <motion.div
            className={S.laneProgressFill}
            initial={false}
            animate={{ width: target }}
            transition={transition}
            data-progress-fill
            aria-hidden="true"
          />
          <motion.div
            className={cx(S.laneVehicleSlot, status?.muted && S.laneVehicleMuted)}
            initial={false}
            animate={{ left: target }}
            transition={transition}
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
