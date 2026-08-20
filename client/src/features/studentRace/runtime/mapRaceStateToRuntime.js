import { ApiContractError } from "../../../errors/ApiContractError.js";
import { createInitialRaceRuntimeState } from "./createInitialRaceRuntimeState.js";
import { applyRaceSnapshot } from "./applyRaceSnapshot.js";

/*
 * mapRaceStateToRuntime — the bootstrap mapper: turns the full race-state
 * response (StudentRaceStateResponse) into a complete initial
 * StudentRaceRuntimeState. Race metadata lands in runtime.race so pages and
 * hooks never carry the raw server DTO next to the runtime; the snapshot
 * itself goes through the shared applyRaceSnapshot. Pure logic — no HTTP,
 * no React, no navigation.
 *
 * Presentation identity (C1-06A): response.player is the server's
 * authoritative presentation truth (StudentRacePlayerPresentationResponse) —
 * never derived from sessionStorage/joinData. Vehicle/color keys stay opaque
 * strings here; the server owns that vocabulary, the asset manifest (C1-06B)
 * resolves them.
 */

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
export function mapRaceStateToRuntime(response) {
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

  const initialState = createInitialRaceRuntimeState();

  const withRaceMetadata = {
    ...initialState,

    race: {
      id: response.raceId,
      title: response.raceTitle,
      roomCode: response.roomCode,
      // Legitimately null before the race starts / finishes.
      startedAt: response.startedAt ?? null,
      finishedAt: response.finishedAt ?? null,
    },

    player: {
      ...initialState.player,
      racePlayerId: response.player.racePlayerId,
      displayName: response.player.displayName,
      laneNumber: response.player.laneNumber,
      vehicleTypeKey: response.player.vehicleTypeKey,
      vehicleColorKey: response.player.vehicleColorKey,
      vehicleAssetKey: response.player.vehicleAssetKey,
    },
  };

  // applyRaceSnapshot spreads previousState.player, so the identity above
  // survives this and every later snapshot application.
  return applyRaceSnapshot(withRaceMetadata, response.snapshot);
}
