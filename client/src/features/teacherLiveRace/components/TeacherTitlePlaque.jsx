import { TEACHER_RACE_PROJECTOR_ART } from "../assets/teacherRaceProjectorArt";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../config/teacherRaceProjectorConfig";
import {
  buildTitleBadgeStyles,
  TEACHER_PROJECTOR_STYLES as S,
} from "../styles/teacherRaceProjectorStyles";

const TITLE_BADGE_STYLES = buildTitleBadgeStyles(
  TEACHER_RACE_PROJECTOR_ART.uiAccents.titleBadge,
  TEACHER_RACE_PROJECTOR_CONFIG.titleBadge,
);

export default function TeacherTitlePlaque({ title }) {
  return (
    <h1 className={S.headerTitle} style={TITLE_BADGE_STYLES.title}>
      <span
        className={S.headerTitleArt}
        style={TITLE_BADGE_STYLES.art}
        aria-hidden="true"
        data-title-badge-art
      />
      <span className={S.headerTitleText}>{title}</span>
    </h1>
  );
}
