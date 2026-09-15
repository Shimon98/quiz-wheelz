import {
  requireBoolean,
  requireObject,
  requireOneOf,
  requireSafeInteger,
} from "../../../../errors/apiContractGuards";
import { RACE_STATUSES } from "../../../../constants/raceStatusConstants";
import {
  mapTeacherRaceLivePlayer,
  mapTeacherRaceLiveRoster,
} from "../mapTeacherRaceLivePlayer";

const RACE_STARTED_STATUSES = new Set([RACE_STATUSES.IN_PROGRESS]);
const RACE_FINISHED_STATUSES = new Set([RACE_STATUSES.FINISHED]);

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
