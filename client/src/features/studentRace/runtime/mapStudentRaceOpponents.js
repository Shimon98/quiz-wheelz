import { ApiContractError } from "../../../errors/ApiContractError.js";

export function mapStudentRaceOpponents(opponents, currentPlayerId = null) {
  if (!Array.isArray(opponents) || opponents.length > 7) {
    throw new ApiContractError("Invalid opponent roster");
  }
  const ids = new Set();
  return opponents.map((opponent) => {
    if (opponent == null || typeof opponent !== "object") {
      throw new ApiContractError("Missing opponent");
    }
    for (const field of ["racePlayerId", "laneNumber", "rank"]) {
      if (!Number.isSafeInteger(opponent[field]) || opponent[field] <= 0) {
        throw new ApiContractError(`Invalid opponent ${field}`);
      }
    }
    for (const field of ["displayName", "vehicleTypeKey", "vehicleColorKey", "vehicleAssetKey", "status"]) {
      if (typeof opponent[field] !== "string" || opponent[field].trim() === "") {
        throw new ApiContractError(`Invalid opponent ${field}`);
      }
    }
    for (const field of ["position", "movementUnitsPerSecond"]) {
      if (!Number.isFinite(opponent[field]) || opponent[field] < 0) {
        throw new ApiContractError(`Invalid opponent ${field}`);
      }
    }
    for (const field of ["positionAtEpochMs", "finishedAtEpochMs"]) {
      if (opponent[field] != null && (!Number.isSafeInteger(opponent[field]) || opponent[field] <= 0)) {
        throw new ApiContractError(`Invalid opponent ${field}`);
      }
    }
    if (ids.has(opponent.racePlayerId) || opponent.racePlayerId === currentPlayerId) {
      throw new ApiContractError("Duplicate or self opponent identity");
    }
    ids.add(opponent.racePlayerId);
    return {
      racePlayerId: opponent.racePlayerId,
      displayName: opponent.displayName,
      laneNumber: opponent.laneNumber,
      vehicleTypeKey: opponent.vehicleTypeKey,
      vehicleColorKey: opponent.vehicleColorKey,
      vehicleAssetKey: opponent.vehicleAssetKey,
      rank: opponent.rank,
      position: opponent.position,
      positionAtEpochMs: opponent.positionAtEpochMs ?? null,
      movementUnitsPerSecond: opponent.movementUnitsPerSecond,
      status: opponent.status,
      finishedAtEpochMs: opponent.finishedAtEpochMs ?? null,
    };
  });
}
