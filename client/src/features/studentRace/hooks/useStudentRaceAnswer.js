import { useCallback, useEffect, useRef, useState } from "react";

import { submitAnswer } from "../../../api/racePlayerApi";
import { normalizeApiError } from "../../../errors/normalizeApiError.js";
import {
  isApiContractError,
  isQuestionExpiredError,
  isStaleQuestionSubmissionError,
  isTransientError,
} from "../../../errors/errorChecks";
import { mapSubmitAnswerToModel } from "../runtime/mapSubmitAnswerToModel.js";
import { STUDENT_RACE_FEEDBACK } from "../runtime/studentRaceRuntimeConstants.js";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig.js";

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
  beginAuthoritativeMutation,
  endAuthoritativeMutation,
  isMutationCurrent,
}) {
  const [answer, setAnswer] = useState(IDLE_ANSWER);

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
      const token = beginAuthoritativeMutation?.();

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

        if (isMutationCurrent && !isMutationCurrent(token)) return;
        if (token == null) applyAuthoritativeSnapshot(model.snapshot);
        else if (!applyAuthoritativeSnapshot(model.snapshot, token)) {
          setAnswer(IDLE_ANSWER);
          return;
        }
        setAnswer((previous) => ({
          ...previous,
          isSubmitting: false,
          result: {
            correct: model.correct,
            correctAnswerChoiceId: model.correctAnswerChoiceId,
            feedback: model.feedback,
          },
        }));

        dwellTimerRef.current = setTimeout(() => {
          if (isMutationCurrent && !isMutationCurrent(token)) {
            setAnswer(IDLE_ANSWER);
            return;
          }
          setAnswer((previous) => ({ ...previous, dwellComplete: true }));
          refreshQuestion();
        }, STUDENT_RACE_CONFIG.feedbackDelayMs);
      } catch (rawError) {
        if (isMutationCurrent && !isMutationCurrent(token)) return;
        const error = normalizeApiError(rawError);

        setAnswer((previous) => ({
          ...previous,
          isSubmitting: false,
          error,
          dwellComplete: true,
        }));

        if (
          isQuestionExpiredError(error) ||
          isStaleQuestionSubmissionError(error) ||
          isTransientError(error) ||
          isApiContractError(error)
        ) {
          refreshQuestion();
        }
      } finally {
        if (isMutationCurrent && !isMutationCurrent(token)) setAnswer(IDLE_ANSWER);
        if (token != null) endAuthoritativeMutation?.(token);
        inFlightRef.current = false;
      }
    },
    [question, refreshQuestion, applyAuthoritativeSnapshot, beginAuthoritativeMutation,
      endAuthoritativeMutation, isMutationCurrent],
  );

  const isStale =
    answer.dwellComplete &&
    question != null &&
    question !== answer.submittedQuestion;
  const active = isStale ? IDLE_ANSWER : answer;
  const answerFeedback = active.result != null && !active.dwellComplete && active.error == null
    ? active.result.feedback
    : null;

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
    displayedQuestion: active.submittedQuestion ?? question,
    isFeedbackDwellActive:
      active.submittedQuestion != null && !active.dwellComplete,
    isAwaitingNextQuestion: active.result != null && active.dwellComplete,
    isSubmitting: active.isSubmitting,
    selectedChoiceId: active.selectedChoiceId,
    correctAnswerChoiceId: active.result?.correctAnswerChoiceId ?? null,
    feedbackState,
    answerFeedback,
    answerError: active.error,
  };
}
