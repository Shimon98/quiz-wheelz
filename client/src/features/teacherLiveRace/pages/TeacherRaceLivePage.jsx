import { useCallback, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "@mantine/core";
import { useFullscreenElement } from "@mantine/hooks";
import { MonitorSmartphone } from "lucide-react";

import { I18N_NAMESPACES } from "../../../i18n/i18nConstants";
import {
  ROUTES,
  buildTeacherRaceRoomPath,
} from "../../../constants/routeConstants";
import PreferredDeviceNotice from "../../../shared/responsive/PreferredDeviceNotice";
import usePreferredDeviceNotice from "../../../shared/responsive/usePreferredDeviceNotice";
import { PREFERRED_DEVICE_PROFILES } from "../../../shared/responsive/preferredDeviceProfiles";
import useTeacherRaceLive from "../hooks/useTeacherRaceLive";
import useTeacherRaceElapsedTime from "../hooks/useTeacherRaceElapsedTime";
import { buildTeacherRaceProjectorViewModel } from "../utils/buildTeacherRaceProjectorViewModel";
import { isFullscreenSupported } from "../utils/isFullscreenSupported";
import {
  resolveTeacherLiveView,
  TEACHER_LIVE_VIEWS,
} from "../utils/resolveTeacherLiveView";
import TeacherRaceLiveStates from "../components/TeacherRaceLiveStates";
import TeacherRaceProjector from "../components/TeacherRaceProjector";

export default function TeacherRaceLivePage() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(I18N_NAMESPACES.TEACHER_LIVE_RACE);
  const {
    runtime,
    serverClock,
    recentEvents,
    connectionState,
    isLoading,
    error,
    retry,
  } = useTeacherRaceLive(raceId);
  const view = resolveTeacherLiveView({ isLoading, error, runtime });
  const isProjector = view === TEACHER_LIVE_VIEWS.PROJECTOR;

  const { elapsedMs, serverNowEpochMs } = useTeacherRaceElapsedTime({
    serverClock,
    race: runtime?.race ?? null,
  });
  const { ref: surfaceRef, toggle: toggleFullscreen, fullscreen } =
    useFullscreenElement();
  const deviceNotice = usePreferredDeviceNotice({
    profile: PREFERRED_DEVICE_PROFILES.TEACHER_LIVE,
    enabled: isProjector,
  });

  const viewModel = useMemo(
    () =>
      isProjector ? buildTeacherRaceProjectorViewModel(runtime, elapsedMs) : null,
    [isProjector, runtime, elapsedMs],
  );

  const handleBackToRaces = useCallback(() => {
    navigate(ROUTES.TEACHER_RACES);
  }, [navigate]);

  if (view === TEACHER_LIVE_VIEWS.REDIRECT_ROOM) {
    return (
      <Navigate to={buildTeacherRaceRoomPath(runtime.race.raceId)} replace />
    );
  }

  if (!isProjector) {
    return (
      <Container size="xl">
        <TeacherRaceLiveStates
          view={view}
          error={error}
          onRetry={retry}
          onBackToRaces={handleBackToRaces}
        />
      </Container>
    );
  }

  return (
    <Container fluid px={0}>
      <TeacherRaceProjector
        surfaceRef={surfaceRef}
        viewModel={viewModel}
        recentEvents={recentEvents}
        connectionState={connectionState}
        serverNowEpochMs={serverNowEpochMs}
        fullscreen={fullscreen}
        fullscreenSupported={isFullscreenSupported()}
        onToggleFullscreen={toggleFullscreen}
        onBackToRaces={handleBackToRaces}
      />
      <PreferredDeviceNotice
        open={deviceNotice.open}
        title={t("deviceAdvice.title")}
        body={t("deviceAdvice.body")}
        confirmLabel={t("deviceAdvice.confirm")}
        icon={MonitorSmartphone}
        onDismiss={deviceNotice.dismiss}
      />
    </Container>
  );
}
