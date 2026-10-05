import { STUDENT_RACE_MOMENT } from "./studentRaceRuntimeConstants";

const ANSWER_MOMENTS = new Set([STUDENT_RACE_MOMENT.CORRECT, STUDENT_RACE_MOMENT.WRONG]);

function observeRuntime(runtimeState, previous) {
  return {
    activeEffect: runtimeState.visual?.activeEffect ?? null,
    feedbackEventId: runtimeState.visual?.feedbackEventId ?? null,
    feedbackStreak: runtimeState.visual?.feedbackStreak ?? 0,
    timeUpQuestionId: runtimeState.visual?.timeUpQuestionId ?? null,
    playerFinished: runtimeState.playerFinished ?? null,
    seenFeedbackEventIds: previous?.seenFeedbackEventIds ?? new Set(),
    seenTimeUpIds: previous?.seenTimeUpIds ?? new Set(),
  };
}

export function deriveStudentRaceMoments(previous, runtimeState) {
  if (runtimeState == null) {
    return { observed: previous, moments: [] };
  }

  const observed = observeRuntime(runtimeState, previous);
  const isFreshAnswer = ANSWER_MOMENTS.has(observed.activeEffect)
    && observed.feedbackEventId != null
    && !observed.seenFeedbackEventIds.has(observed.feedbackEventId);
  if (isFreshAnswer) {
    observed.seenFeedbackEventIds = new Set(observed.seenFeedbackEventIds);
    observed.seenFeedbackEventIds.add(observed.feedbackEventId);
  }
  const isFreshTimeUp = observed.timeUpQuestionId != null && !observed.seenTimeUpIds.has(observed.timeUpQuestionId);
  if (isFreshTimeUp) {
    observed.seenTimeUpIds = new Set(observed.seenTimeUpIds);
    observed.seenTimeUpIds.add(observed.timeUpQuestionId);
  }

  if (previous == null) return { observed, moments: [] };

  if (observed.playerFinished === true) {
    const moments = previous.playerFinished === false ? [{ type: STUDENT_RACE_MOMENT.FINISH, id: "finish" }] : [];
    return { observed, moments };
  }
  const moments = [];
  if (isFreshAnswer) {
    moments.push({ type: observed.activeEffect, id: observed.feedbackEventId, streak: observed.feedbackStreak });
  }
  if (isFreshTimeUp) moments.push({ type: STUDENT_RACE_MOMENT.TIME_UP, id: observed.timeUpQuestionId });
  return { observed, moments };
}
