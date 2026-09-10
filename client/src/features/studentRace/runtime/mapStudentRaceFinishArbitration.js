import { ApiContractError } from "../../../errors/ApiContractError.js";
import { assertValidRaceSnapshot } from "./applyRaceSnapshot.js";

export function validateStudentRaceFinishOrder(order) {
  if (order == null || !Number.isSafeInteger(order.eventVersion) || order.eventVersion < 0 ||
      !Number.isSafeInteger(order.decidedAtEpochMs) || order.decidedAtEpochMs <= 0 ||
      !Array.isArray(order.confirmedFinishers)) {
    throw new ApiContractError("Invalid finish order");
  }
  const through = order.confirmedThroughEpochMs;
  if (through != null && (!Number.isSafeInteger(through) || through < 0 || through >= order.decidedAtEpochMs)) {
    throw new ApiContractError("Invalid finish proof horizon");
  }
  const ids = new Set();
  let previous = null;
  for (const finisher of order.confirmedFinishers) {
    for (const field of ["racePlayerId", "finishedAtEpochMs", "rank"]) {
      if (!Number.isSafeInteger(finisher?.[field]) || finisher[field] <= 0) {
        throw new ApiContractError(`Invalid confirmed finisher ${field}`);
      }
    }
    if (ids.has(finisher.racePlayerId) || through == null || finisher.finishedAtEpochMs > through ||
        (previous && (finisher.finishedAtEpochMs < previous.finishedAtEpochMs ||
          (finisher.finishedAtEpochMs === previous.finishedAtEpochMs && finisher.rank !== previous.rank) ||
          (finisher.finishedAtEpochMs > previous.finishedAtEpochMs && finisher.rank <= previous.rank)))) {
      throw new ApiContractError("Inconsistent confirmed finish cohort");
    }
    ids.add(finisher.racePlayerId);
    previous = finisher;
  }
  return order;
}

export function mapStudentRaceFinishArbitration(response, currentPlayerId = null) {
  if (!Number.isSafeInteger(response?.raceId) || response.raceId <= 0) {
    throw new ApiContractError("Invalid arbitration race identity");
  }
  assertValidRaceSnapshot(response.snapshot, currentPlayerId);
  validateStudentRaceFinishOrder(response.finishOrder);
  return { raceId: response.raceId, snapshot: response.snapshot, finishOrder: response.finishOrder };
}
