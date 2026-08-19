import { useEffect, useRef } from "react";

import {
  isQuestionExpiredError,
  isRaceLifecycleConflictError,
  isRacePlayerSessionError,
} from "../../../errors/errorChecks";
import useRuntimeSessionResync from "../../../shared/racePlayer/useRuntimeSessionResync";

/*
 * The one owner of "pull fresh authoritative race truth": session resyncs,
 * question lifecycle conflicts, and non-expiry submit failures — each
 * latched per error instance so no request loop can form.
 */
export default function useStudentRaceRecoverySync({
  questionError,
  answerError,
  raceRetry,
  resyncToken,
  authoritativeResync,
}) {
  useRuntimeSessionResync(resyncToken, authoritativeResync);

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
