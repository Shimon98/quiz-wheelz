import { ApiContractError } from "../../../errors/ApiContractError.js";

/*
 * applyRaceSnapshot — folds an AUTHORITATIVE server runtime snapshot
 * (StudentRaceRuntimeSnapshotResponse) into an existing runtime state.
 * The same snapshot shape arrives from race-state (bootstrap/polling) and
 * from submit-answer raceImpact (C1-03) — both flow through this one mapper.
 *
 * Freshness (C1-03M): every snapshot carries snapshotAtEpochMs — the server
 * decision instant it describes. A snapshot strictly older than the applied
 * one returns previousState untouched: network ARRIVAL order must never
 * roll authoritative state backward (a slow race-state poll cannot undo a
 * newer answer snapshot). Equal-ms applies — two serialized server
 * decisions can share a millisecond, and the later-applied overlay (the
 * answer on top of the baseline) must win that tie.
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
  "snapshotAtEpochMs",
  "movementUnitsPerSecond",
];

function assertValidSnapshot(snapshot) {
  if (snapshot == null || typeof snapshot !== "object") {
    throw new ApiContractError("Race snapshot is missing");
  }

  for (const field of REQUIRED_NUMBER_FIELDS) {
    // Finite only — NaN/Infinity would poison per-frame prediction math.
    if (!Number.isFinite(snapshot[field])) {
      throw new ApiContractError(`Race snapshot field "${field}" is missing`);
    }
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
}

export function applyRaceSnapshot(previousState, snapshot) {
  assertValidSnapshot(snapshot);

  if (
    previousState.lastSnapshotAtEpochMs != null &&
    snapshot.snapshotAtEpochMs < previousState.lastSnapshotAtEpochMs
  ) {
    // Strictly older by server truth-time — keep the newer applied state.
    return previousState;
  }

  return {
    ...previousState,

    lastSnapshotAtEpochMs: snapshot.snapshotAtEpochMs,

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
      // interpolates its internal visualPosition toward it, and predicts
      // between snapshots using the server-owned movement rate.
      targetPosition: snapshot.position,
      targetSpeed: snapshot.speed,
      movementUnitsPerSecond: snapshot.movementUnitsPerSecond,
    },
  };
}
