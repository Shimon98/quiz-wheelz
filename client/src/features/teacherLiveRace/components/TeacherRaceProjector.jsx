import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Text, Title } from "@mantine/core";
import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import { TEACHER_RACE_PROJECTOR_ART } from "../assets/teacherRaceProjectorArt";
import { TEACHER_RACE_PROJECTOR_CONFIG } from "../config/teacherRaceProjectorConfig";
import {
  buildProjectorSurfaceStyle,
  TEACHER_PROJECTOR_STYLES as S,
} from "../styles/teacherRaceProjectorStyles";
import TeacherRaceProjectorHeader from "./TeacherRaceProjectorHeader";
import TeacherRaceWorld from "./TeacherRaceWorld";
import TeacherRaceProjectorFooter from "./TeacherRaceProjectorFooter";
import TeacherLeaderboardPanel from "./leaderboard/TeacherLeaderboardPanel";
import TeacherRaceTrack from "./track/TeacherRaceTrack";
import TeacherLiveEventsPanel from "./events/TeacherLiveEventsPanel";

const SURFACE_STYLE = buildProjectorSurfaceStyle(
  TEACHER_RACE_PROJECTOR_CONFIG.laneGeometry,
);

const FINISHED_TROPHY_ENTRANCE = Object.freeze({
  initial: { scale: 0.6, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 260, damping: 16 },
});

function TeacherRaceFinishedBanner({ resultsPath }) {
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const reduce = useReducedMotion();

  return (
    <div className={S.finishedBanner} role="status">
      <div className={S.finishedCard}>
        <motion.img
          className={S.finishedTrophy}
          src={TEACHER_RACE_PROJECTOR_ART.uiAccents.leaderboardTrophy}
          alt=""
          aria-hidden="true"
          draggable={false}
          initial={reduce ? false : FINISHED_TROPHY_ENTRANCE.initial}
          animate={FINISHED_TROPHY_ENTRANCE.animate}
          transition={FINISHED_TROPHY_ENTRANCE.transition}
        />
        <div className={S.finishedText}>
          <Title order={2}>{t("finished.title")}</Title>
          <Text size="sm" c="dimmed">
            {t("finished.body")}
          </Text>
          <Button
            component={Link}
            to={resultsPath}
            mt="xs"
            radius="xl"
            leftSection={<Trophy size={18} aria-hidden="true" />}
          >
            {t("finished.viewResults")}
          </Button>
        </div>
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
  resultsPath,
}) {
  return (
    <section
      ref={surfaceRef}
      className={S.surface}
      style={SURFACE_STYLE}
      aria-label={viewModel.header.title}
    >
      <TeacherRaceWorld />

      <TeacherRaceProjectorHeader
        header={viewModel.header}
        fullscreen={fullscreen}
        fullscreenSupported={fullscreenSupported}
        onToggleFullscreen={onToggleFullscreen}
      />

      {viewModel.race.isFinished ? <TeacherRaceFinishedBanner resultsPath={resultsPath} /> : null}

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
