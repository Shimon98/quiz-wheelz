import { useEffect, useRef } from "react";

import useRaceBootstrap from "../hooks/useRaceBootstrap";
import useStudentRaceQuestion from "../hooks/useStudentRaceQuestion";
import { RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import RacePlayerSessionGate from "../../../shared/racePlayer/RacePlayerSessionGate";
import {
  isConflictError,
  isRacePlayerSessionError,
} from "../../../errors/errorChecks";
import StudentRaceScreen from "../layout/StudentRaceScreen";
import StudentRaceStatusView from "../components/StudentRaceStatusView";
import { STUDENT_RACE_STATUSES } from "../components/studentRaceStatusConfig";

/*
 * StudentRacePage — the production owner of the student race route. It
 * composes the two separate resources (race runtime from useRaceBootstrap,
 * question lifecycle from useStudentRaceQuestion) and decides policy; all
 * rendering stays in the screen/status components, and the invalid-session
 * policy lives in the shared RacePlayerSessionGate — one gate per
 * authoritative source, because either race-state or current-question can
 * discover a dead RacePlayer identity, and a dead identity beats last-known
 * state.
 *
 * Blocking rules: loading/error screens appear ONLY while no runtime exists.
 * Once a runtime is known, it keeps rendering through refreshes and
 * transient failures (last-known state — no flicker, no destructive error
 * screens; a real reconnect indicator lands in C1-05).
 */

function StudentRaceContent({
  runtimeState,
  view,
  isLoading,
  error,
  retry,
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

  if (view === RACE_VIEWS.PLAYING) {
    return <StudentRaceScreen runtimeState={runtimeState} {...questionProps} />;
  }

  return <StudentRaceStatusView status={view} onRetry={retry} />;
}

export default function StudentRacePage() {
  const {
    runtimeState,
    view,
    isLoading,
    error: raceError,
    retry: raceRetry,
  } = useRaceBootstrap();

  // Questions only for an authoritatively playable player: last-known
  // PLAYING runtime must not start question requests once race-state has
  // already reported an invalid RacePlayer session.
  const questionEnabled =
    view === RACE_VIEWS.PLAYING && !isRacePlayerSessionError(raceError);

  const {
    question,
    error: questionError,
    isExpired: questionExpired,
    refreshQuestion,
  } = useStudentRaceQuestion({ enabled: questionEnabled });

  // The race page has no polling, so a question-endpoint gameplay conflict
  // (RACE_NOT_IN_PROGRESS / RACE_PLAYER_NOT_RACING / ...) is how it learns
  // the race ended mid-question. One race-state resync per error instance —
  // getRaceView then routes to the right status view; no request loop.
  const conflictHandledRef = useRef(null);
  useEffect(() => {
    if (
      isConflictError(questionError) &&
      conflictHandledRef.current !== questionError
    ) {
      conflictHandledRef.current = questionError;
      raceRetry();
    }
  }, [questionError, raceRetry]);

  return (
    <RacePlayerSessionGate error={raceError}>
      <RacePlayerSessionGate error={questionError}>
        <StudentRaceContent
          runtimeState={runtimeState}
          view={view}
          isLoading={isLoading}
          error={raceError}
          retry={raceRetry}
          questionProps={{
            question,
            questionError,
            questionExpired,
            onQuestionRetry: refreshQuestion,
          }}
        />
      </RacePlayerSessionGate>
    </RacePlayerSessionGate>
  );
}
