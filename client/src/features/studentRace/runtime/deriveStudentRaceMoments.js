import { RACE_CHALLENGE_OUTCOMES } from "../../../constants/raceGameplayConstants";
import { STUDENT_RACE_MOMENT } from "./studentRaceRuntimeConstants";

const ANSWER_MOMENTS = new Set([STUDENT_RACE_MOMENT.CORRECT, STUDENT_RACE_MOMENT.WRONG]);
const CHALLENGE_RESULT_MOMENTS = Object.freeze({
  [RACE_CHALLENGE_OUTCOMES.TURBO_SUCCESS]: STUDENT_RACE_MOMENT.TURBO_SUCCESS,
  [RACE_CHALLENGE_OUTCOMES.TURBO_FAILURE]: STUDENT_RACE_MOMENT.TURBO_FAILURE,
  [RACE_CHALLENGE_OUTCOMES.SAFE_COMPLETE]: STUDENT_RACE_MOMENT.SAFE_COMPLETE,
  [RACE_CHALLENGE_OUTCOMES.SAFE_PERFECT]: STUDENT_RACE_MOMENT.SAFE_PERFECT,
});
const RESULT_MOMENTS = new Set(Object.values(CHALLENGE_RESULT_MOMENTS));
// Only recent IDs can come back in a stale sample, so a short memory is enough.
const SEEN_ID_LIMIT = 64;

function remember(seen, id) {
  const next = new Set(seen);
  next.add(id);
  if (next.size > SEEN_ID_LIMIT) next.delete(next.values().next().value);
  return next;
}

function resultIdOf(runtimeState) {
  const challengeId = runtimeState.gameplay?.challenge?.lastResult?.challengeId;
  return Number.isSafeInteger(challengeId) ? challengeId : null;
}

// Challenge IDs only grow for one race player, so the highest one seen is the whole
// memory; another race or player starts again from its own baseline.
function seenResultId(previous, identity, resultId) {
  if (previous?.identity !== identity) return resultId;
  return Math.max(previous.seenChallengeResultId ?? 0, resultId ?? 0) || null;
}

function observeRuntime(runtimeState, previous) {
  const identity = `${runtimeState.race?.id ?? ""}:${runtimeState.player?.racePlayerId ?? ""}`;
  const resultId = resultIdOf(runtimeState);
  return {
    identity,
    activeEffect: runtimeState.visual?.activeEffect ?? null,
    feedbackEventId: runtimeState.visual?.feedbackEventId ?? null,
    feedbackStreak: runtimeState.visual?.feedbackStreak ?? 0,
    timeUpQuestionId: runtimeState.visual?.timeUpQuestionId ?? null,
    playerFinished: runtimeState.playerFinished ?? null,
    seenFeedbackEventIds: previous?.seenFeedbackEventIds ?? new Set(),
    seenTimeUpIds: previous?.seenTimeUpIds ?? new Set(),
    seenChallengeResultId: seenResultId(previous, identity, resultId),
  };
}

function freshResultMoment(previous, observed, runtimeState) {
  const resultId = resultIdOf(runtimeState);
  if (resultId == null || previous?.identity !== observed.identity
    || resultId <= (previous.seenChallengeResultId ?? 0)) {
    return null;
  }
  const outcome = runtimeState.gameplay.challenge.lastResult.outcome;
  const type = Object.hasOwn(CHALLENGE_RESULT_MOMENTS, outcome) ? CHALLENGE_RESULT_MOMENTS[outcome] : null;
  return type == null ? null : { type, id: `challenge-${resultId}`, challengeId: resultId };
}

// A challenge result arrives with the answer that caused it and stands in for it, in sound and on screen.
export function presentedMoments({ moments }) {
  const results = moments.filter(({ type }) => RESULT_MOMENTS.has(type));
  return results.length > 0 ? results : moments;
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
    observed.seenFeedbackEventIds = remember(observed.seenFeedbackEventIds, observed.feedbackEventId);
  }
  const isFreshTimeUp = observed.timeUpQuestionId != null && !observed.seenTimeUpIds.has(observed.timeUpQuestionId);
  if (isFreshTimeUp) {
    observed.seenTimeUpIds = remember(observed.seenTimeUpIds, observed.timeUpQuestionId);
  }
  const resultMoment = freshResultMoment(previous, observed, runtimeState);

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
  if (resultMoment != null) moments.push(resultMoment);
  return { observed, moments };
}
