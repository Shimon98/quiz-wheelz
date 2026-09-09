import { STUDENT_RACE_EFFECT } from "../../runtime/studentRaceRuntimeConstants";

function observeRuntime(runtimeState, previous) {
  return {
    activeEffect: runtimeState.visual?.activeEffect ?? null,
    feedbackEventId: runtimeState.visual?.feedbackEventId ?? null,
    feedbackStreak: runtimeState.visual?.feedbackStreak ?? 0,
    targetSpeed: runtimeState.visual?.targetSpeed ?? null,
    playerFinished: runtimeState.playerFinished ?? null,
    seenFeedbackEventIds: previous?.seenFeedbackEventIds ?? new Set(),
  };
}

export function detectRuntimeEffectTriggers(previous, runtimeState) {
  if (runtimeState == null) {
    return { observed: previous, effects: [] };
  }

  const observed = observeRuntime(runtimeState, previous);
  const isAnswerEffect = observed.activeEffect === STUDENT_RACE_EFFECT.CORRECT
    || observed.activeEffect === STUDENT_RACE_EFFECT.WRONG;
  const isFreshAnswer = isAnswerEffect && observed.feedbackEventId != null
    && !observed.seenFeedbackEventIds.has(observed.feedbackEventId);
  if (isFreshAnswer) {
    observed.seenFeedbackEventIds = new Set(observed.seenFeedbackEventIds);
    observed.seenFeedbackEventIds.add(observed.feedbackEventId);
  }

  const effects = [];
  if (observed.playerFinished === true) {
    if (previous?.playerFinished === false) effects.push(STUDENT_RACE_EFFECT.FINISH);
    return { observed, effects };
  }
  if (isFreshAnswer) effects.push(observed.activeEffect);
  if (
    previous?.targetSpeed != null &&
    observed.targetSpeed != null &&
    observed.targetSpeed > previous.targetSpeed
  ) {
    effects.push(STUDENT_RACE_EFFECT.BOOST);
  }

  return { observed, effects };
}
