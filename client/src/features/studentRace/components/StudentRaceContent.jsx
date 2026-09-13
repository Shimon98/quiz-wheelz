import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import StudentRaceScreen from "../layout/StudentRaceScreen";
import StudentRaceStatusView from "./StudentRaceStatusView";
import { STUDENT_RACE_STATUSES } from "./studentRaceStatusConfig";

export default function StudentRaceContent({
  runtimeState,
  view,
  isLoading,
  error,
  retry,
  keepRaceScreen = false,
  finishPresentation = null,
  questionProps,
}) {
  if (!runtimeState && isLoading) {
    return <StudentRaceStatusView status={STUDENT_RACE_STATUSES.LOADING} />;
  }

  if (!runtimeState && error) {
    return (
      <StudentRaceStatusView
        status={STUDENT_RACE_STATUSES.ERROR}
        error={error}
        onRetry={retry}
      />
    );
  }

  if (!runtimeState) {
    return (
      <StudentRaceStatusView status={RACE_VIEWS.UNKNOWN} onRetry={retry} />
    );
  }

  if (view === RACE_VIEWS.PLAYING || keepRaceScreen) {
    return <StudentRaceScreen runtimeState={runtimeState} finishPresentation={finishPresentation} {...questionProps} />;
  }

  return <StudentRaceStatusView status={view} onRetry={retry} />;
}
