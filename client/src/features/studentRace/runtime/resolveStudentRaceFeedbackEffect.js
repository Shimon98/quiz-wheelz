import {
  STUDENT_RACE_EFFECT,
  STUDENT_RACE_FEEDBACK,
} from "./studentRaceRuntimeConstants.js";

const FEEDBACK_EFFECTS = Object.freeze({
  [STUDENT_RACE_FEEDBACK.CORRECT]: STUDENT_RACE_EFFECT.CORRECT,
  [STUDENT_RACE_FEEDBACK.WRONG]: STUDENT_RACE_EFFECT.WRONG,
});

export function resolveStudentRaceFeedbackEffect(
  feedbackState,
  { playerFinished = false } = {},
) {
  if (playerFinished || typeof feedbackState !== "string") {
    return null;
  }

  return Object.hasOwn(FEEDBACK_EFFECTS, feedbackState)
    ? FEEDBACK_EFFECTS[feedbackState]
    : null;
}

export function applyFeedbackEffectToRuntime(
  runtimeState,
  feedbackState,
  answerFeedback = null,
  { reducedMotion = false } = {},
) {
  if (runtimeState == null) {
    return runtimeState;
  }

  const activeEffect = resolveStudentRaceFeedbackEffect(feedbackState, {
    playerFinished: runtimeState.playerFinished === true,
  });
  const feedbackEventId = activeEffect == null ? null : answerFeedback?.questionId ?? null;
  const feedbackStreak = activeEffect === STUDENT_RACE_EFFECT.CORRECT && answerFeedback?.correct === true
    ? answerFeedback.streak
    : 0;

  if (
    activeEffect === (runtimeState.visual?.activeEffect ?? null)
    && feedbackEventId === (runtimeState.visual?.feedbackEventId ?? null)
    && feedbackStreak === (runtimeState.visual?.feedbackStreak ?? 0)
    && reducedMotion === (runtimeState.visual?.reducedMotion ?? false)
  ) {
    return runtimeState;
  }

  return {
    ...runtimeState,
    visual: { ...runtimeState.visual, activeEffect, feedbackEventId, feedbackStreak, reducedMotion },
  };
}
