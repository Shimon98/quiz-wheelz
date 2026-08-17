import { ApiContractError } from "../../../errors/ApiContractError.js";

/*
 * applyRaceSnapshot — folds an AUTHORITATIVE server runtime snapshot
 * (StudentRaceRuntimeSnapshotResponse) into an existing runtime state.
 * The same snapshot shape arrives from race-state (bootstrap) and from
 * submit-answer raceImpact (C1-03) — both flow through this one mapper.
 *
 * Pure translation only: no clamping, no derived finish/status, no game
 * rules — if the server says position 1005 on a 1000 track, runtime says
 * 1005. Sections the snapshot does not own (question, answer, race
 * metadata, loading, error, visual.activeEffect) are preserved untouched.
 * A broken snapshot throws ApiContractError instead of faking zeros.
 */

// Wrapper-typed on the server but initialized at join and present in every
// snapshot the mapper builds — absence means the contract broke.
const REQUIRED_NUMBER_FIELDS = [
  "totalDistance",
  "score",
  "position",
  "speed",
  "streak",
  "highestStreak",
];

function assertValidSnapshot(snapshot) {
  if (snapshot == null || typeof snapshot !== "object") {
    throw new ApiContractError("Race snapshot is missing");
  }

  for (const field of REQUIRED_NUMBER_FIELDS) {
    if (typeof snapshot[field] !== "number") {
      throw new ApiContractError(`Race snapshot field "${field}" is missing`);
    }
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
}

export function applyRaceSnapshot(previousState, snapshot) {
  assertValidSnapshot(snapshot);

  return {
    ...previousState,

    raceStatus: snapshot.raceStatus,
    playerStatus: snapshot.playerStatus,
    playerFinished: snapshot.playerFinished,
    raceFinished: snapshot.raceFinished,
    totalDistance: snapshot.totalDistance,

    player: {
      ...previousState.player,
      position: snapshot.position,
      speed: snapshot.speed,
      score: snapshot.score,
      streak: snapshot.streak,
      highestStreak: snapshot.highestStreak,
      // Legitimately nullable (e.g. before the first question plan).
      currentDifficulty: snapshot.currentDifficulty ?? null,
    },

    visual: {
      ...previousState.visual,
      // Server truth doubles as the Pixi animation target; the renderer
      // interpolates its internal visualPosition toward it.
      targetPosition: snapshot.position,
      targetSpeed: snapshot.speed,
    },
  };
}
