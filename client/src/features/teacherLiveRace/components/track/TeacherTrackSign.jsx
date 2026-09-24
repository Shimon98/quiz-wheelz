import { cx } from "../../../../utils/classNameUtils";
import { TEACHER_RACE_PROJECTOR_ART } from "../../assets/teacherRaceProjectorArt";
import {
  TEACHER_RACE_PROJECTOR_CONFIG,
  TRACK_SIGN_KINDS,
} from "../../config/teacherRaceProjectorConfig";
import {
  buildSignStyle,
  TEACHER_PROJECTOR_STYLES as S,
} from "../../styles/teacherRaceProjectorStyles";

const SIGN_CLASSES = Object.freeze({
  [TRACK_SIGN_KINDS.START]: { sign: S.trackSignStart, label: S.trackSignLabelStart },
  [TRACK_SIGN_KINDS.FINISH]: { sign: S.trackSignFinish, label: S.trackSignLabelFinish },
});

export default function TeacherTrackSign({ kind, label }) {
  const board = TEACHER_RACE_PROJECTOR_CONFIG.signBoards[kind];
  const classes = SIGN_CLASSES[kind];

  return (
    <span
      className={cx(S.trackSign, classes.sign)}
      style={buildSignStyle(board)}
      data-track-sign={kind}
    >
      <img
        className={S.trackSignArt}
        src={TEACHER_RACE_PROJECTOR_ART.signs[kind]}
        alt=""
        aria-hidden="true"
        draggable={false}
        decoding="async"
      />
      <span className={cx(S.trackSignLabel, classes.label)}>{label}</span>
    </span>
  );
}
