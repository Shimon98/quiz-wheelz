import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container } from "@mantine/core";
import { useFullscreenElement } from "@mantine/hooks";

import { ROUTES } from "../../../constants/routeConstants";
import { useLanguageStore } from "../../../stores/languageStore";
import { isFullscreenSupported } from "../../teacherLiveRace/utils/isFullscreenSupported";
import useTeacherRaceResults from "../hooks/useTeacherRaceResults";
import { buildTeacherRaceResultsViewModel } from "../utils/buildTeacherRaceResultsViewModel";
import { resolveTeacherResultsView, TEACHER_RESULTS_VIEWS } from "../utils/resolveTeacherResultsView";
import TeacherRaceResultsStates from "../components/TeacherRaceResultsStates";
import TeacherRaceResultsView from "../components/TeacherRaceResultsView";

function TeacherRaceResultsScreen({ raceId }) {
  const navigate = useNavigate();
  const language = useLanguageStore((state) => state.language);
  const { results, error, isLoading, retry } = useTeacherRaceResults(raceId);
  const view = resolveTeacherResultsView({ isLoading, error, results });
  const isReady = view === TEACHER_RESULTS_VIEWS.READY;
  const { ref: surfaceRef, toggle: toggleFullscreen, fullscreen } = useFullscreenElement();

  const viewModel = useMemo(
    () => (isReady ? buildTeacherRaceResultsViewModel(results, language) : null),
    [isReady, results, language],
  );

  const handleBackToRaces = useCallback(() => {
    navigate(ROUTES.TEACHER_RACES);
  }, [navigate]);

  if (!isReady) {
    return (
      <Container size="xl">
        <TeacherRaceResultsStates
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
      <TeacherRaceResultsView
        surfaceRef={surfaceRef}
        viewModel={viewModel}
        fullscreen={fullscreen}
        fullscreenSupported={isFullscreenSupported()}
        onToggleFullscreen={toggleFullscreen}
        onBackToRaces={handleBackToRaces}
      />
    </Container>
  );
}

export default function TeacherRaceResultsPage() {
  const { raceId } = useParams();

  return <TeacherRaceResultsScreen key={raceId} raceId={raceId} />;
}
