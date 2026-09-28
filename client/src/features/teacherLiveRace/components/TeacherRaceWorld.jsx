import { TEACHER_RACE_PROJECTOR_ART } from "../assets/teacherRaceProjectorArt";
import { TEACHER_PROJECTOR_STYLES as S } from "../styles/teacherRaceProjectorStyles";

export default function TeacherRaceWorld() {
  return (
    <div className={S.decorLayer} aria-hidden="true">
      <img
        className={S.worldBackdrop}
        src={TEACHER_RACE_PROJECTOR_ART.backdrop}
        alt=""
        draggable={false}
        decoding="async"
        data-projector-backdrop
      />
      <span className={S.worldTint} />
      <span className={S.worldVergeStart}>
        <img className={S.worldVerge} src={TEACHER_RACE_PROJECTOR_ART.verge} alt="" draggable={false} decoding="async" />
      </span>
      <span className={S.worldVergeEnd}>
        <img className={S.worldVerge} src={TEACHER_RACE_PROJECTOR_ART.verge} alt="" draggable={false} decoding="async" />
      </span>
    </div>
  );
}
