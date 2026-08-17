import useRaceBootstrap from "../hooks/useRaceBootstrap";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import StudentRaceScreen from "../layout/StudentRaceScreen";
import StudentRaceStatusView from "../components/StudentRaceStatusView";
import { STUDENT_RACE_STATUSES } from "../components/studentRaceStatusConfig";

/*
 * StudentRacePage — the production owner of the student race route (wired to
 * the router in a later substep). A SMALL presentation switch over the
 * bootstrap result; all fetching/mapping/status logic already lives in
 * useRaceBootstrap and below.
 *
 * Blocking rules: loading/error screens appear ONLY while no runtime exists.
 * Once a runtime is known, it keeps rendering through refreshes and
 * transient failures (last-known state — no flicker, no destructive error
 * screens; a real reconnect indicator lands in C1-05).
 */
export default function StudentRacePage() {
  const { runtimeState, view, isLoading, error, retry } = useRaceBootstrap();

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

  if (view === RACE_VIEWS.PLAYING) {
    return <StudentRaceScreen runtimeState={runtimeState} />;
  }

  return <StudentRaceStatusView status={view} onRetry={retry} />;
}
