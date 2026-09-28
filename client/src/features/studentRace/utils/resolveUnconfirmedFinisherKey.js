import { RACE_PLAYER_STATUSES } from "../../../constants/raceStatusConstants.js";
import { isStudentSelfFinished } from "./studentRaceResultsStatus.js";

export function resolveUnconfirmedFinisherKey(runtimeState, finishOrder) {
  if (runtimeState == null) {
    return "";
  }

  const confirmedIds = new Set((finishOrder?.confirmedFinishers ?? []).map((finisher) => finisher.racePlayerId));
  const pendingIds = runtimeState.opponents
    .filter((opponent) => opponent.status === RACE_PLAYER_STATUSES.FINISHED)
    .map((opponent) => opponent.racePlayerId);

  if (isStudentSelfFinished(runtimeState)) {
    pendingIds.push(runtimeState.player.racePlayerId);
  }

  return pendingIds
    .filter((racePlayerId) => !confirmedIds.has(racePlayerId))
    .sort((first, second) => first - second)
    .join(",");
}
