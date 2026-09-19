import { useTranslation } from "react-i18next";
import { ActionIcon, Badge, Tooltip } from "@mantine/core";
import { Maximize2, Minimize2 } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import BrandLockup from "../../../shared/components/brand/BrandLockup";
import StatCard from "../../../shared/components/stats/StatCard";
import {
  TEACHER_HEADER_STATS,
  TEACHER_RACE_STATUS_PRESENTATION,
} from "../config/teacherRaceProjectorConfig";
import { TEACHER_PROJECTOR_STYLES as S } from "../styles/teacherRaceProjectorStyles";

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
    <header className={S.header}>
      <BrandLockup className={S.headerBrand} />

      <div className={S.headerIdentity}>
        <h1 className={S.headerTitle}>{header.title}</h1>
        {statusPresentation ? (
          <Badge size="lg" variant="filled" color={statusPresentation.tone}>
            {t(statusPresentation.labelKey)}
          </Badge>
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
