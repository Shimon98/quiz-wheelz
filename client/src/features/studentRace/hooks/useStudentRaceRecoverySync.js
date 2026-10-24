import { useEffect, useRef } from "react";

import {
  isChallengeChoiceRequiredError,
  isQuestionExpiredError,
  isRaceLifecycleConflictError,
  isRacePlayerReconnectRequiredError,
  isRacePlayerSessionError,
} from "../../../errors/errorChecks";
import { FINAL_RACE_VIEWS } from "../../../shared/racePlayer/getRaceView";
import useRuntimeSessionResync from "../../../shared/racePlayer/useRuntimeSessionResync";

/*
 * The race page's lifecycle policy: pull fresh authoritative truth on
 * session resyncs / question conflicts / non-expiry submit failures (each
 * latched per error instance), and stop presence on a final race view.
 * C5-02: a question refused because a challenge offer is open (3034) is one
 * more question conflict; a failed challenge choice reconciles itself in
 * useStudentRaceChallenge, so here it only joins the reconnect check.
 */
export default function useStudentRaceRecoverySync({
  view,
  stopPresence,
  raceError,
  questionError,
  answerError,
  challengeError = null,
  reconnectNow,
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

  const reconnectRequiredHandledRef = useRef(null);
  const reconnectRequiredError = [raceError, questionError, answerError, challengeError].find(
    isRacePlayerReconnectRequiredError,
  );
  useEffect(() => {
    if (
      reconnectRequiredError &&
      reconnectRequiredHandledRef.current !== reconnectRequiredError
    ) {
      reconnectRequiredHandledRef.current = reconnectRequiredError;
      reconnectNow();
    }
  }, [reconnectRequiredError, reconnectNow]);

  const conflictHandledRef = useRef(null);
  useEffect(() => {
    if (
      (isRaceLifecycleConflictError(questionError) || isChallengeChoiceRequiredError(questionError)) &&
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
      !isRacePlayerReconnectRequiredError(answerError) &&
      answerResyncHandledRef.current !== answerError
    ) {
      answerResyncHandledRef.current = answerError;
      raceRetry();
    }
  }, [answerError, raceRetry]);
}
