import { ApiContractError } from "../../../errors/ApiContractError.js";
import { createInitialRaceRuntimeState } from "./createInitialRaceRuntimeState.js";
import { applyRaceSnapshot } from "./applyRaceSnapshot.js";



const PRESENTATION_STRING_FIELDS = [
  "displayName",
  "vehicleTypeKey",
  "vehicleColorKey",
  "vehicleAssetKey",
];

function assertValidPresentation(player) {
  if (player == null || typeof player !== "object") {
    throw new ApiContractError(
      "Race state response is missing player presentation identity",
    );
  }

  for (const field of ["racePlayerId", "laneNumber"]) {
    if (!Number.isSafeInteger(player[field]) || player[field] <= 0) {
      throw new ApiContractError(
        `Race state player field "${field}" is invalid`,
      );
    }
  }

  for (const field of PRESENTATION_STRING_FIELDS) {
    if (typeof player[field] !== "string" || player[field].trim() === "") {
      throw new ApiContractError(
        `Race state player field "${field}" is invalid`,
      );
    }
  }
}
export function mapRaceStatePresentation(response) {
  if (
    response == null ||
    typeof response !== "object" ||
    response.raceId == null ||
    response.raceTitle == null ||
    response.roomCode == null
  ) {
    throw new ApiContractError("Race state response is missing race metadata");
  }

  assertValidPresentation(response.player);



  return {


    race: {
      id: response.raceId,
      title: response.raceTitle,
      roomCode: response.roomCode,
      startedAt: response.startedAt ?? null,
      finishedAt: response.finishedAt ?? null,
    },

    player: {

      racePlayerId: response.player.racePlayerId,
      displayName: response.player.displayName,
      laneNumber: response.player.laneNumber,
      vehicleTypeKey: response.player.vehicleTypeKey,
      vehicleColorKey: response.player.vehicleColorKey,
      vehicleAssetKey: response.player.vehicleAssetKey,
    },
  };

}

export function mapRaceStateToRuntime(response) {
  const presentation = mapRaceStatePresentation(response);
  const initial = createInitialRaceRuntimeState();
  return applyRaceSnapshot({
    ...initial,
    race: presentation.race,
    player: { ...initial.player, ...presentation.player },
  }, response.snapshot);
}