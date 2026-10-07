import { useTranslation } from "react-i18next";
import { Badge } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { cx } from "../../../utils/classNameUtils";
import BrandLockup from "../../../shared/components/brand/BrandLockup";
import StatCard from "../../../shared/components/stats/StatCard";
import { AudioSettingsButton } from "../../../shared/components/publicSettings";
import {
  TEACHER_HEADER_STATS,
  TEACHER_RACE_PROJECTOR_CONFIG,
  TEACHER_RACE_STATUS_PRESENTATION,
} from "../config/teacherRaceProjectorConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../styles/teacherRaceProjectorStyles";
import TeacherFullscreenToggle from "./TeacherFullscreenToggle";
import TeacherTitlePlaque from "./TeacherTitlePlaque";

function resolveStatValues(header, t) {
  return {
    elapsed: header.elapsedLabel ?? t("stats.elapsedUnavailable"),
    participants: header.participantCount,
    roomCode: header.roomCode,
  };
}

export default function TeacherRaceProjectorHeader({
  header,
  fullscreen,
  fullscreenSupported,
  onToggleFullscreen,
}) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const statusPresentation = TEACHER_RACE_STATUS_PRESENTATION[header.status];
  const statValues = resolveStatValues(header, t);

  return (
    <header
      className={cx(
        S.header,
        fullscreen ? S.headerColumnsWithBrand : S.headerColumns,
      )}
    >
      {fullscreen ? (
        <BrandLockup
          className={S.headerBrand}
          shuffleIntervalMs={TEACHER_RACE_PROJECTOR_CONFIG.brandShuffleIntervalMs}
        />
      ) : null}

      <div className={S.headerIdentity}>
        <TeacherTitlePlaque title={header.title} />
        {statusPresentation ? (
          <span className={S.headerStatus}>
            <Badge size="lg" variant="filled" color={statusPresentation.tone}>
              {t(statusPresentation.labelKey)}
            </Badge>
          </span>
        ) : null}
      </div>

      <div className={S.headerStats}>
        {TEACHER_HEADER_STATS.map((stat) => (
          <StatCard
            key={stat.id}
            compact
            icon={stat.icon}
            tone={stat.tone}
            label={t(stat.labelKey)}
            value={statValues[stat.id]}
            valueDir={stat.valueDir}
          />
        ))}
        <AudioSettingsButton variant="light" size="xl" withinPortal={false} />
        {fullscreenSupported ? (
          <TeacherFullscreenToggle fullscreen={fullscreen} onToggle={onToggleFullscreen} />
        ) : null}
      </div>
    </header>
  );
}
