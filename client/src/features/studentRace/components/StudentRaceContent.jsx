import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import StudentRaceScreen from "../layout/StudentRaceScreen";
import StudentRaceStatusView from "./StudentRaceStatusView";
import { STUDENT_RACE_STATUSES } from "./studentRaceStatusConfig";

/*
 * The race route's view switch — blocking screens only while no runtime
 * exists; a known runtime keeps rendering through transient failures.
 */
export default function StudentRaceContent({
  runtimeState,
  view,
  isLoading,
  error,
  retry,
  showFinishMoment,
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

  // showFinishMoment keeps the finish visible for the feedback window.
  if (view === RACE_VIEWS.PLAYING || showFinishMoment) {
    return <StudentRaceScreen runtimeState={runtimeState} {...questionProps} />;
  }

  return <StudentRaceStatusView status={view} onRetry={retry} />;
}
