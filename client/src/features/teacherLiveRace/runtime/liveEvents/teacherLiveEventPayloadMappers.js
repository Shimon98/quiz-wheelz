import {
  requireBoolean,
  requireObject,
  requireOneOf,
  requireSafeInteger,
} from "../../../../errors/apiContractGuards";
import { RACE_STATUSES } from "../../../../constants/raceStatusConstants";
import { RACE_PUBLIC_MOMENT_KINDS } from "../../../../constants/raceLiveEventConstants";
import {
  mapTeacherRaceLivePlayer,
  mapTeacherRaceLiveRoster,
} from "../mapTeacherRaceLivePlayer";

const RACE_STARTED_STATUSES = new Set([RACE_STATUSES.IN_PROGRESS]);
const RACE_FINISHED_STATUSES = new Set([RACE_STATUSES.FINISHED]);
const PUBLIC_MOMENT_KINDS = new Set(Object.values(RACE_PUBLIC_MOMENT_KINDS));

// S4-06 moments are an extra on the answer: rows written before them have none, and a moment of a kind this client
// does not know yet (or a broken one) is dropped on its own, so it never costs the answer or the stream.
function mapPublicMoments(moments) {
  if (!Array.isArray(moments)) {
    return [];
  }

  return moments.flatMap((moment) =>
    PUBLIC_MOMENT_KINDS.has(moment?.kind) &&
    Number.isSafeInteger(moment.sourceId) &&
    moment.sourceId >= 1
      ? [{ kind: moment.kind, sourceId: moment.sourceId }]
      : [],
  );
}

export function mapPlayerJoinedPayload(payload) {
  requireObject(payload, "PLAYER_JOINED payload");

  return {
    player: mapTeacherRaceLivePlayer(payload.player),
  };
}

export function mapRaceStartedPayload(payload) {
  requireObject(payload, "RACE_STARTED payload");

  return {
    raceStatus: requireOneOf(
      payload.raceStatus,
      RACE_STARTED_STATUSES,
      "RACE_STARTED raceStatus",
    ),
    startedAtEpochMs: requireSafeInteger(
      payload.startedAtEpochMs,
      "RACE_STARTED startedAtEpochMs",
      { min: 1 },
    ),
    players: mapTeacherRaceLiveRoster(payload.players),
  };
}

export function mapQuestionAnsweredPayload(payload) {
  requireObject(payload, "QUESTION_ANSWERED payload");

  return {
    racePlayerId: requireSafeInteger(
      payload.racePlayerId,
      "QUESTION_ANSWERED racePlayerId",
      { min: 1 },
    ),
    questionId: requireSafeInteger(
      payload.questionId,
      "QUESTION_ANSWERED questionId",
      { min: 1 },
    ),
    correct: requireBoolean(payload.correct, "QUESTION_ANSWERED correct"),
    moments: mapPublicMoments(payload.moments),
  };
}

export function mapPlayerProgressUpdatedPayload(payload) {
  requireObject(payload, "PLAYER_PROGRESS_UPDATED payload");

  return {
    players: mapTeacherRaceLiveRoster(payload.players),
  };
}

export function mapPlayerFinishedPayload(payload) {
  requireObject(payload, "PLAYER_FINISHED payload");

  return {
    player: mapTeacherRaceLivePlayer(payload.player),
    finishedAtEpochMs: requireSafeInteger(
      payload.finishedAtEpochMs,
      "PLAYER_FINISHED finishedAtEpochMs",
      { min: 1 },
    ),
    players: mapTeacherRaceLiveRoster(payload.players),
  };
}

export function mapRaceFinishedPayload(payload) {
  requireObject(payload, "RACE_FINISHED payload");

  return {
    raceStatus: requireOneOf(
      payload.raceStatus,
      RACE_FINISHED_STATUSES,
      "RACE_FINISHED raceStatus",
    ),
    finishedAtEpochMs: requireSafeInteger(
      payload.finishedAtEpochMs,
      "RACE_FINISHED finishedAtEpochMs",
      { min: 1 },
    ),
    players: mapTeacherRaceLiveRoster(payload.players),
  };
}
