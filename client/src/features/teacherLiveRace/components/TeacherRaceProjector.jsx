import { useTranslation } from "react-i18next";
import { Text, Title } from "@mantine/core";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../config/teacherRaceProjectorConfig";
import {
  buildProjectorSurfaceStyle,
  TEACHER_PROJECTOR_STYLES as S,
} from "../styles/teacherRaceProjectorStyles";
import TeacherRaceProjectorHeader from "./TeacherRaceProjectorHeader";
import TeacherRaceProjectorFooter from "./TeacherRaceProjectorFooter";
import TeacherLeaderboardPanel from "./leaderboard/TeacherLeaderboardPanel";
import TeacherRaceTrack from "./track/TeacherRaceTrack";
import TeacherLiveEventsPanel from "./events/TeacherLiveEventsPanel";

const SURFACE_STYLE = buildProjectorSurfaceStyle(
  TEACHER_RACE_PROJECTOR_CONFIG.laneGeometry,
);

function TeacherRaceFinishedBanner() {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);

  return (
    <div className={S.finishedBanner} role="status">
      <div className={S.finishedCard}>
        <Title order={2}>{t("finished.title")}</Title>
        <Text size="sm" c="dimmed">
          {t("finished.body")}
        </Text>
      </div>
    </div>
  );
}

export default function TeacherRaceProjector({
  surfaceRef,
  viewModel,
  recentEvents,
  connectionState,
  serverNowEpochMs,
  fullscreen,
  fullscreenSupported,
  onToggleFullscreen,
  onBackToRaces,
}) {
  return (
    <section
      ref={surfaceRef}
      className={S.surface}
      style={SURFACE_STYLE}
      aria-label={viewModel.header.title}
    >
      <div className={S.decorLayer} aria-hidden="true">
        <span className={S.decorBlobPrimary} />
        <span className={S.decorBlobSecondary} />
      </div>

      <TeacherRaceProjectorHeader
        header={viewModel.header}
        fullscreen={fullscreen}
        fullscreenSupported={fullscreenSupported}
        onToggleFullscreen={onToggleFullscreen}
      />

      {viewModel.race.isFinished ? <TeacherRaceFinishedBanner /> : null}

      <div className={S.main}>
        <div className={S.leaderboardPanel}>
          <TeacherLeaderboardPanel rows={viewModel.leaderboard} />
        </div>
        <div className={S.trackPanel}>
          <TeacherRaceTrack lanes={viewModel.lanes} />
        </div>
        <div className={S.eventsPanel}>
          <TeacherLiveEventsPanel
            items={recentEvents}
            serverNowEpochMs={serverNowEpochMs}
          />
        </div>
      </div>

      <TeacherRaceProjectorFooter
        connectionState={connectionState}
        onBackToRaces={onBackToRaces}
      />
    </section>
  );
}
