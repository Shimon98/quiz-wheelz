import { useCallback, useEffect, useRef, useState } from "react";

import { submitAnswer } from "../../../api/racePlayerApi";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import {
  isApiContractError,
  isQuestionExpiredError,
  isTransientError,
} from "../../../errors/errorChecks";
import { mapSubmitAnswerToModel } from "../runtime/mapSubmitAnswerToModel.js";
import { STUDENT_RACE_FEEDBACK } from "../runtime/studentRaceRuntimeConstants.js";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig.js";

/*
 * useStudentRaceAnswer — the answer-action lifecycle owner (C1-03), the
 * counterpart of useStudentRaceQuestion (which owns WHICH question is
 * current): submit single-flight, the submitted-question freeze, feedback
 * state and the transition to the next question. It never computes
 * score/progress/speed/finish — the server snapshot goes up through
 * applyAuthoritativeSnapshot untouched.
 *
 * The submitted QUESTION MODEL INSTANCE is retained for the whole feedback
 * window: the question hook may refresh underneath (deadline sync), but
 * feedback is always presented on the question that was answered — a
 * response for question A can never paint choices on question B.
 *
 * Reset model: no reset effects. Staleness is DERIVED — once the feedback
 * window is over (dwellComplete) and a NEW question model instance exists,
 * the stored answer state is simply ignored (and overwritten by the next
 * submit). This respects the project's no-sync-setState-in-effects rule.
 *
 * Error policy (safe recovery, never auto-resubmit a POST — it may have
 * committed server-side even when the response was lost):
 *   QUESTION_EXPIRED       time-up presentation, question resync only
 *   transient / contract   question resync here + race resync by the page
 *   lifecycle conflict     the page's race-state resync policy decides
 *   session error          the page's RacePlayerSessionGate decides
 */

const IDLE_ANSWER = Object.freeze({
  submittedQuestion: null,
  selectedChoiceId: null,
  result: null,
  error: null,
  isSubmitting: false,
  dwellComplete: false,
});

export default function useStudentRaceAnswer({
  question,
  refreshQuestion,
  applyAuthoritativeSnapshot,
}) {
  const [answer, setAnswer] = useState(IDLE_ANSWER);

  // Immediate reservation — two synchronous taps cannot both submit
  // (React state alone renders too late to guard this).
  const inFlightRef = useRef(false);
  const dwellTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(dwellTimerRef.current), []);

  const submitChoice = useCallback(
    async (choiceId) => {
      const submittedQuestion = question;

      if (inFlightRef.current || submittedQuestion == null) {
        return;
      }
      inFlightRef.current = true;

      // Lock + neutral "selected" presentation immediately; correctness
      // stays unknown until the server answers.
      setAnswer({
        ...IDLE_ANSWER,
        submittedQuestion,
        selectedChoiceId: choiceId,
        isSubmitting: true,
      });

      try {
        const response = await submitAnswer({
          questionId: submittedQuestion.id,
          choiceId,
        });
        const model = mapSubmitAnswerToModel(response, {
          question: submittedQuestion,
          choiceId,
        });

        // Truth first: the race reacts the same instant feedback appears.
        applyAuthoritativeSnapshot(model.snapshot);
        setAnswer((previous) => ({
          ...previous,
          isSubmitting: false,
          result: {
            correct: model.correct,
            correctAnswerChoiceId: model.correctAnswerChoiceId,
          },
        }));

        dwellTimerRef.current = setTimeout(() => {
          setAnswer((previous) => ({ ...previous, dwellComplete: true }));
          refreshQuestion();
        }, STUDENT_RACE_CONFIG.feedbackDelayMs);
      } catch (rawError) {
        const error = normalizeApiError(rawError);

        setAnswer((previous) => ({
          ...previous,
          isSubmitting: false,
          error,
          // Any refreshed question may replace the error presentation.
          dwellComplete: true,
        }));

        if (
          isQuestionExpiredError(error) ||
          isTransientError(error) ||
          isApiContractError(error)
        ) {
          refreshQuestion();
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [question, refreshQuestion, applyAuthoritativeSnapshot],
  );

  // A fresh question model after the feedback window supersedes the stored
  // answer state (every successful refresh is a new instance — same id or
  // not). A session-gated or conflict error never reaches this point with a
  // fresh question, so nothing is cleared prematurely.
  const isStale =
    answer.dwellComplete &&
    question != null &&
    question !== answer.submittedQuestion;
  const active = isStale ? IDLE_ANSWER : answer;

  let feedbackState = STUDENT_RACE_FEEDBACK.IDLE;
  if (active.result) {
    feedbackState = active.result.correct
      ? STUDENT_RACE_FEEDBACK.CORRECT
      : STUDENT_RACE_FEEDBACK.WRONG;
  } else if (active.error) {
    feedbackState = isQuestionExpiredError(active.error)
      ? STUDENT_RACE_FEEDBACK.EXPIRED
      : STUDENT_RACE_FEEDBACK.ERROR;
  }

  return {
    submitChoice,
    // The question the panel must display: the answered one while its
    // feedback is live, the current one otherwise.
    displayedQuestion: active.submittedQuestion ?? question,
    // True only during the timed feedback window — used by the page for the
    // finish moment, where no next question will ever end the freeze.
    isFeedbackDwellActive:
      active.submittedQuestion != null && !active.dwellComplete,
    isSubmitting: active.isSubmitting,
    selectedChoiceId: active.selectedChoiceId,
    correctAnswerChoiceId: active.result?.correctAnswerChoiceId ?? null,
    feedbackState,
    answerError: active.error,
  };
}
