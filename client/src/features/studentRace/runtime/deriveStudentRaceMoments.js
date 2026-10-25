import {
  RACE_CHALLENGE_CHOICES,
  RACE_CHALLENGE_OUTCOMES,
  RACE_LUCK_EVENT_TYPES,
  RACE_LUCK_OUTCOMES,
} from "../../../constants/raceGameplayConstants";
import { STUDENT_RACE_MOMENT } from "./studentRaceRuntimeConstants";

const ANSWER_MOMENTS = new Set([STUDENT_RACE_MOMENT.CORRECT, STUDENT_RACE_MOMENT.WRONG]);
const CHALLENGE_RESULT_MOMENTS = Object.freeze({
  [RACE_CHALLENGE_OUTCOMES.TURBO_SUCCESS]: STUDENT_RACE_MOMENT.TURBO_SUCCESS,
  [RACE_CHALLENGE_OUTCOMES.TURBO_FAILURE]: STUDENT_RACE_MOMENT.TURBO_FAILURE,
  [RACE_CHALLENGE_OUTCOMES.SAFE_COMPLETE]: STUDENT_RACE_MOMENT.SAFE_COMPLETE,
  [RACE_CHALLENGE_OUTCOMES.SAFE_PERFECT]: STUDENT_RACE_MOMENT.SAFE_PERFECT,
});
const RESULT_MOMENTS = new Set(Object.values(CHALLENGE_RESULT_MOMENTS));
// Luck is named by what the server applied, not by what it drew: a Tailwind at top speed is applied as an Energy Orb.
const LUCK_APPLIED_MOMENTS = Object.freeze({
  [RACE_LUCK_EVENT_TYPES.TAILWIND]: STUDENT_RACE_MOMENT.LUCK_TAILWIND,
  [RACE_LUCK_EVENT_TYPES.ENERGY_ORB]: STUDENT_RACE_MOMENT.LUCK_ENERGY_ORB,
  [RACE_LUCK_EVENT_TYPES.MUD_SPLASH]: STUDENT_RACE_MOMENT.LUCK_MUD,
});
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

function offerIdOf(runtimeState) {
  const offerId = runtimeState.gameplay?.challenge?.offer?.offerId;
  return Number.isSafeInteger(offerId) ? offerId : null;
}

// Only a run the server already holds counts: tapping a card changes nothing until its answer is applied.
function turboRunIdOf(runtimeState) {
  const run = runtimeState.gameplay?.challenge?.run;
  return run?.type === RACE_CHALLENGE_CHOICES.TURBO_TRIAL && Number.isSafeInteger(run.challengeId) ? run.challengeId : null;
}

function luckEventsOf(runtimeState) {
  const events = runtimeState.gameplay?.luck?.recentEvents;
  return Array.isArray(events) ? events.filter((event) => Number.isSafeInteger(event?.eventId)) : [];
}

// Only the server's outcome reveals a shield block: a shield count that drops proves nothing.
function luckMomentTypeOf({ appliedType, outcome }) {
  if (outcome === RACE_LUCK_OUTCOMES.BLOCKED_BY_SHIELD) {
    return appliedType === RACE_LUCK_EVENT_TYPES.MUD_SPLASH ? STUDENT_RACE_MOMENT.LUCK_SHIELD_BLOCKED : null;
  }
  return outcome === RACE_LUCK_OUTCOMES.APPLIED && Object.hasOwn(LUCK_APPLIED_MOMENTS, appliedType)
    ? LUCK_APPLIED_MOMENTS[appliedType]
    : null;
}

// Challenge IDs only grow for one race player, so the highest one seen is the whole
// memory; another race or player starts again from its own baseline.
function seenResultId(previous, identity, resultId) {
  if (previous?.identity !== identity) return resultId;
  return Math.max(previous.seenChallengeResultId ?? 0, resultId ?? 0) || null;
}

function observeRuntime(runtimeState, previous) {
  const identity = `${runtimeState.race?.id ?? ""}:${runtimeState.player?.racePlayerId ?? ""}`;
  // Every memory belongs to one race player, so nothing seen for another one can silence or replay a moment.
  const sameIdentity = previous?.identity === identity;
  const resultId = resultIdOf(runtimeState);
  return {
    identity,
    activeEffect: runtimeState.visual?.activeEffect ?? null,
    feedbackEventId: runtimeState.visual?.feedbackEventId ?? null,
    feedbackStreak: runtimeState.visual?.feedbackStreak ?? 0,
    timeUpQuestionId: runtimeState.visual?.timeUpQuestionId ?? null,
    playerFinished: runtimeState.playerFinished ?? null,
    seenFeedbackEventIds: sameIdentity ? previous.seenFeedbackEventIds : new Set(),
    seenTimeUpIds: sameIdentity ? previous.seenTimeUpIds : new Set(),
    seenChallengeResultId: seenResultId(previous, identity, resultId),
    // Sets rather than a highest id: nothing in the contract promises that offer ids arrive in order.
    seenOfferIds: sameIdentity ? previous.seenOfferIds : new Set(),
    seenRunIds: sameIdentity ? previous.seenRunIds : new Set(),
    seenLuckEventIds: sameIdentity ? previous.seenLuckEventIds : new Set(),
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
  const offerId = offerIdOf(runtimeState);
  const isFreshOffer = offerId != null && !observed.seenOfferIds.has(offerId);
  if (isFreshOffer) observed.seenOfferIds = remember(observed.seenOfferIds, offerId);
  const armedId = turboRunIdOf(runtimeState);
  const isFreshArm = armedId != null && !observed.seenRunIds.has(armedId);
  if (isFreshArm) observed.seenRunIds = remember(observed.seenRunIds, armedId);
  const luckMoments = [];
  for (const event of luckEventsOf(runtimeState)) {
    if (observed.seenLuckEventIds.has(event.eventId)) continue;
    observed.seenLuckEventIds = remember(observed.seenLuckEventIds, event.eventId);
    const type = luckMomentTypeOf(event);
    if (type != null) luckMoments.push({ type, id: `luck-${event.eventId}`, luckEventId: event.eventId });
  }
  // The first sight of a race or player is a baseline: a refresh or a reconnect never replays an offer or an arm.
  // Answers, time-ups, the finish and Luck follow the same rule.
  const sameIdentity = previous?.identity === observed.identity;

  if (!sameIdentity) return { observed, moments: [] };

  if (observed.playerFinished === true) {
    const moments = previous.playerFinished === false ? [{ type: STUDENT_RACE_MOMENT.FINISH, id: "finish" }] : [];
    return { observed, moments };
  }
  const moments = [];
  if (isFreshAnswer) {
    moments.push({ type: observed.activeEffect, id: observed.feedbackEventId, streak: observed.feedbackStreak });
  }
  if (isFreshTimeUp) moments.push({ type: STUDENT_RACE_MOMENT.TIME_UP, id: observed.timeUpQuestionId });
  if (isFreshOffer) moments.push({ type: STUDENT_RACE_MOMENT.CHALLENGE_OFFER, id: `offer-${offerId}`, offerId });
  if (isFreshArm) {
    moments.push({ type: STUDENT_RACE_MOMENT.TURBO_ARMED, id: `turbo-armed-${armedId}`, challengeId: armedId });
  }
  if (resultMoment != null) moments.push(resultMoment);
  moments.push(...luckMoments);
  return { observed, moments };
}
