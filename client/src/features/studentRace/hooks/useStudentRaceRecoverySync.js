import { useEffect, useRef } from "react";

import {
  isQuestionExpiredError,
  isRaceLifecycleConflictError,
  isRacePlayerSessionError,
} from "../../../errors/errorChecks";
import { FINAL_RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import useRuntimeSessionResync from "../../../shared/racePlayer/useRuntimeSessionResync";

/*
 * The race page's lifecycle policy: pull fresh authoritative truth on
 * session resyncs / question conflicts / non-expiry submit failures (each
 * latched per error instance), and stop presence on a final race view.
 */
export default function useStudentRaceRecoverySync({
  view,
  stopPresence,
  questionError,
  answerError,
  raceRetry,
  resyncToken,
  authoritativeResync,
}) {
  useRuntimeSessionResync(resyncToken, authoritativeResync);

  useEffect(() => {
    if (FINAL_RACE_VIEWS.has(view)) {
      stopPresence();
    }
  }, [view, stopPresence]);

  const conflictHandledRef = useRef(null);
  useEffect(() => {
    if (
      isRaceLifecycleConflictError(questionError) &&
      conflictHandledRef.current !== questionError
    ) {
      conflictHandledRef.current = questionError;
      raceRetry();
    }
  }, [questionError, raceRetry]);

  const answerResyncHandledRef = useRef(null);
  useEffect(() => {
    if (
      answerError &&
      !isRacePlayerSessionError(answerError) &&
      !isQuestionExpiredError(answerError) &&
      answerResyncHandledRef.current !== answerError
    ) {
      answerResyncHandledRef.current = answerError;
      raceRetry();
    }
  }, [answerError, raceRetry]);
}
