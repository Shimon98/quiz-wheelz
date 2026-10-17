import { RACE_CHALLENGE_CHOICES } from "../../../constants/raceGameplayConstants.js";
import { ApiContractError } from "../../../errors/ApiContractError.js";
import {
  mapOrNull,
  requireArray,
  requireFiniteNumber,
  requireNonEmptyString,
  requireObject,
  requireSafeInteger,
} from "../../../errors/apiContractGuards.js";

const KNOWN_CHOICES = new Set(Object.values(RACE_CHALLENGE_CHOICES));

// The offer carries the clock offset of the snapshot that delivered it, so the
// shared getQuestionRemainingMs formula counts its deadline like a question's.
function mapOffer(raw, serverClockOffsetMs) {
  requireObject(raw, "Challenge offer");
  const choices = [...new Set(requireArray(raw.choices, "Challenge offer choices"))]
    .filter((choice) => KNOWN_CHOICES.has(choice));

  if (choices.length === 0) {
    throw new ApiContractError("Challenge offer has no known choice");
  }

  return {
    offerId: requireSafeInteger(raw.offerId, "Challenge offer id", { min: 1 }),
    expiresAtEpochMs: requireSafeInteger(raw.expiresAtEpochMs, "Challenge offer expiry", { min: 1 }),
    serverClockOffsetMs: requireFiniteNumber(serverClockOffsetMs, "Challenge offer clock offset"),
    choices,
  };
}

function mapRun(raw) {
  requireObject(raw, "Challenge run");
  const questionsResolved = requireSafeInteger(raw.questionsResolved, "Challenge run resolved", { min: 0 });
  const totalQuestions = requireSafeInteger(raw.totalQuestions, "Challenge run total", { min: 1 });
  const correctAnswers = requireSafeInteger(raw.correctAnswers, "Challenge run correct", { min: 0 });

  if (questionsResolved > totalQuestions || correctAnswers > questionsResolved) {
    throw new ApiContractError("Challenge run counters are inconsistent");
  }

  return {
    challengeId: requireSafeInteger(raw.challengeId, "Challenge run id", { min: 1 }),
    type: requireNonEmptyString(raw.type, "Challenge run type"),
    questionsResolved,
    totalQuestions,
    correctAnswers,
  };
}

function mapLastResult(raw) {
  requireObject(raw, "Challenge result");
  const questionsResolved = requireSafeInteger(raw.questionsResolved, "Challenge result resolved", { min: 0 });
  const correctAnswers = requireSafeInteger(raw.correctAnswers, "Challenge result correct", { min: 0 });

  if (correctAnswers > questionsResolved) {
    throw new ApiContractError("Challenge result counters are inconsistent");
  }

  return {
    challengeId: requireSafeInteger(raw.challengeId, "Challenge result id", { min: 1 }),
    type: requireNonEmptyString(raw.type, "Challenge result type"),
    outcome: requireNonEmptyString(raw.outcome, "Challenge result outcome"),
    questionsResolved,
    correctAnswers,
    completedAtEpochMs: requireSafeInteger(raw.completedAtEpochMs, "Challenge result time", { min: 1 }),
  };
}

function mapChallenge(raw, serverClockOffsetMs) {
  requireObject(raw, "Challenge");

  return {
    energy: requireSafeInteger(raw.energy, "Challenge energy", { min: 0 }),
    threshold: requireSafeInteger(raw.threshold, "Challenge threshold", { min: 1 }),
    offer: mapOrNull((offer) => mapOffer(offer, serverClockOffsetMs), raw.offer),
    run: mapOrNull(mapRun, raw.run),
    lastResult: mapOrNull(mapLastResult, raw.lastResult),
  };
}

export function mapStudentRaceChallenge(raw, { serverClockOffsetMs = 0 } = {}) {
  return mapOrNull((challenge) => mapChallenge(challenge, serverClockOffsetMs), raw);
}
