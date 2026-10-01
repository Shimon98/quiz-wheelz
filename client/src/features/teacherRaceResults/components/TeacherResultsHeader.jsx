import { useTranslation } from "react-i18next";
import { Badge } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { UI_TONES } from "../../../app/theme/quizWheelzTheme";
import { cx } from "../../../utils/classNameUtils";
import BrandLockup from "../../../shared/components/brand/BrandLockup";
import TeacherFullscreenToggle from "../../teacherLiveRace/components/TeacherFullscreenToggle";
import TeacherTitlePlaque from "../../teacherLiveRace/components/TeacherTitlePlaque";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../../teacherLiveRace/config/teacherRaceProjectorConfig";
import { TEACHER_RESULTS_STYLES as S } from "../styles/teacherRaceResultsStyles";

export default function TeacherResultsHeader({ header, fullscreen, fullscreenSupported, onToggleFullscreen }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_RACE_RESULTS);

  return (
    <header className={cx(S.header, fullscreen ? S.headerColumnsWithBrand : S.headerColumns)}>
      {fullscreen ? (
        <BrandLockup
          className={S.headerBrand}
          shuffleIntervalMs={TEACHER_RACE_PROJECTOR_CONFIG.brandShuffleIntervalMs}
        />
      ) : null}

      <div className={S.headerIdentity}>
        <TeacherTitlePlaque title={header.title} />
        <span className={S.headerStatus}>
          <Badge size="lg" variant="filled" color={UI_TONES.WARNING}>
            {t("header.badge")}
          </Badge>
        </span>
      </div>

      <div className={S.headerMeta}>
        {header.subjectName ? (
          <Badge size="lg" variant="light">
            {header.subjectName}
          </Badge>
        ) : null}
        {header.finishedAtLabel ? <span dir="ltr">{header.finishedAtLabel}</span> : null}
        {fullscreenSupported ? (
          <TeacherFullscreenToggle fullscreen={fullscreen} onToggle={onToggleFullscreen} />
        ) : null}
      </div>
    </header>
  );
}
