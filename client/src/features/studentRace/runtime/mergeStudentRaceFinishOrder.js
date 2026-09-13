import { ApiContractError } from "../../../errors/ApiContractError.js";
import { validateStudentRaceFinishOrder } from "./mapStudentRaceFinishArbitration.js";

export function mergeStudentRaceFinishOrder(previous, incoming) {
  validateStudentRaceFinishOrder(incoming);
  if (previous == null) return incoming;
  const old = previous.confirmedFinishers;
  const next = incoming.confirmedFinishers;
  for (let index = 0; index < Math.min(old.length, next.length); index += 1) {
    if (["racePlayerId", "finishedAtEpochMs", "rank"].some((field) => old[index][field] !== next[index][field])) {
      throw new ApiContractError("Confirmed finish prefix changed");
    }
  }
  if (next.length < old.length) return previous;
  if (next.length > old.length && old.length > 0 &&
      next[old.length].finishedAtEpochMs === old.at(-1).finishedAtEpochMs) {
    throw new ApiContractError("Confirmed same-millisecond cohort changed");
  }
  if (next.length === old.length &&
      (incoming.confirmedThroughEpochMs ?? -1) <= (previous.confirmedThroughEpochMs ?? -1)) return previous;
  return incoming;
}
