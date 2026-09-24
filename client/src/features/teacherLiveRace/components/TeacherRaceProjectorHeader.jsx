import { useTranslation } from "react-i18next";
import { ActionIcon, Badge, Tooltip } from "@mantine/core";
import { Maximize2, Minimize2 } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { cx } from "../../../utils/classNameUtils";
import BrandLockup from "../../../shared/components/brand/BrandLockup";
import StatCard from "../../../shared/components/stats/StatCard";
import { TEACHER_RACE_PROJECTOR_ART } from "../assets/teacherRaceProjectorArt";
import {
  TEACHER_HEADER_STATS,
  TEACHER_RACE_PROJECTOR_CONFIG,
  TEACHER_RACE_STATUS_PRESENTATION,
} from "../config/teacherRaceProjectorConfig";
import {
  buildTitleBadgeStyles,
  TEACHER_PROJECTOR_STYLES as S,
} from "../styles/teacherRaceProjectorStyles";

const TITLE_BADGE_STYLES = buildTitleBadgeStyles(
  TEACHER_RACE_PROJECTOR_ART.uiAccents.titleBadge,
  TEACHER_RACE_PROJECTOR_CONFIG.titleBadge,
);

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
  const fullscreenLabel = t(
    fullscreen ? "header.fullscreenExit" : "header.fullscreenEnter",
  );
  const FullscreenIcon = fullscreen ? Minimize2 : Maximize2;

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
        <h1 className={S.headerTitle} style={TITLE_BADGE_STYLES.title}>
          <span
            className={S.headerTitleArt}
            style={TITLE_BADGE_STYLES.art}
            aria-hidden="true"
            data-title-badge-art
          />
          <span className={S.headerTitleText}>{header.title}</span>
        </h1>
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
        {fullscreenSupported ? (
          <Tooltip label={fullscreenLabel} withArrow>
            <ActionIcon
              variant="light"
              size="xl"
              radius="xl"
              aria-label={fullscreenLabel}
              aria-pressed={fullscreen}
              onClick={onToggleFullscreen}
            >
              <FullscreenIcon size={22} aria-hidden="true" />
            </ActionIcon>
          </Tooltip>
        ) : null}
      </div>
    </header>
  );
}
