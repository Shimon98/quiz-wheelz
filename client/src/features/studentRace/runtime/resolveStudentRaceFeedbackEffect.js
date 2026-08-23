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

export function applyFeedbackEffectToRuntime(runtimeState, feedbackState) {
  if (runtimeState == null) {
    return runtimeState;
  }

  const activeEffect = resolveStudentRaceFeedbackEffect(feedbackState, {
    playerFinished: runtimeState.playerFinished === true,
  });

  if (activeEffect === (runtimeState.visual?.activeEffect ?? null)) {
    return runtimeState;
  }

  return {
    ...runtimeState,
    visual: { ...runtimeState.visual, activeEffect },
  };
}
