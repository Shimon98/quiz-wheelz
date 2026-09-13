import { ApiContractError } from "../../../errors/ApiContractError.js";
import { compareRaceSnapshotFreshness } from "./compareRaceSnapshotFreshness.js";
import { mapStudentRaceOpponents } from "./mapStudentRaceOpponents.js";
const REQUIRED_NUMBER_FIELDS = [
  "totalDistance",
  "score",
  "position",
  "speed",
  "highestStreak",
  "snapshotAtEpochMs",
  "movementUnitsPerSecond",
];

export function assertValidRaceSnapshot(snapshot, currentPlayerId = null) {
  if (snapshot == null || typeof snapshot !== "object") {
    throw new ApiContractError("Race snapshot is missing");
  }

  for (const field of REQUIRED_NUMBER_FIELDS) {
    if (!Number.isFinite(snapshot[field])) {
      throw new ApiContractError(`Race snapshot field "${field}" is missing`);
    }
  }

  if (!Number.isSafeInteger(snapshot.streak) || snapshot.streak < 0) {
    throw new ApiContractError("Race snapshot streak is invalid");
  }

  if (!Number.isSafeInteger(snapshot.eventVersion) || snapshot.eventVersion < 0) {
    throw new ApiContractError("Race snapshot event version is invalid");
  }
  for (const field of ["positionAtEpochMs", "playerFinishedAtEpochMs"]) {
    if (snapshot[field] != null && (!Number.isSafeInteger(snapshot[field]) || snapshot[field] <= 0)) {
      throw new ApiContractError(`Race snapshot ${field} is invalid`);
    }
  }

  for (const field of ["rank", "playerCount"]) {
    if (snapshot[field] != null && (!Number.isSafeInteger(snapshot[field]) || snapshot[field] <= 0)) {
      throw new ApiContractError(`Race snapshot field "${field}" is invalid`);
    }
  }

  if (snapshot.rank != null && snapshot.playerCount != null && snapshot.rank > snapshot.playerCount) {
    throw new ApiContractError("Race snapshot rank exceeds player count");
  }

  if (
    !Number.isSafeInteger(snapshot.snapshotAtEpochMs) ||
    snapshot.snapshotAtEpochMs <= 0
  ) {
    throw new ApiContractError("Race snapshot timestamp is invalid");
  }

  if (snapshot.raceStatus == null || snapshot.playerStatus == null) {
    throw new ApiContractError("Race snapshot statuses are missing");
  }

  if (
    typeof snapshot.playerFinished !== "boolean" ||
    typeof snapshot.raceFinished !== "boolean"
  ) {
    throw new ApiContractError("Race snapshot finish flags are missing");
  }
  return mapStudentRaceOpponents(snapshot.opponents, currentPlayerId);
}

export function applyRaceSnapshot(previousState, snapshot) {
  const opponents = assertValidRaceSnapshot(snapshot, previousState.player.racePlayerId);

  if (
    compareRaceSnapshotFreshness(previousState.lastEventVersion,
      previousState.lastSnapshotAtEpochMs, snapshot) <= 0
  ) {
    return previousState;
  }

  return {
    ...previousState,

    lastSnapshotAtEpochMs: snapshot.snapshotAtEpochMs,
    lastEventVersion: snapshot.eventVersion,
    opponents,

    raceStatus: snapshot.raceStatus,
    playerStatus: snapshot.playerStatus,
    playerFinished: snapshot.playerFinished,
    playerFinishedAtEpochMs: snapshot.playerFinishedAtEpochMs ?? null,
    raceFinished: snapshot.raceFinished,
    totalDistance: snapshot.totalDistance,
    playerCount: snapshot.playerCount ?? null,

    player: {
      ...previousState.player,
      position: snapshot.position,
      positionAtEpochMs: snapshot.positionAtEpochMs ?? null,
      speed: snapshot.speed,
      score: snapshot.score,
      streak: snapshot.streak,
      highestStreak: snapshot.highestStreak,
      rank: snapshot.rank ?? null,
      currentDifficulty: snapshot.currentDifficulty ?? null,
    },

    visual: {
      ...previousState.visual,
      targetPosition: snapshot.position,
      targetSpeed: snapshot.speed,
      movementUnitsPerSecond: snapshot.movementUnitsPerSecond,
    },
  };
}
