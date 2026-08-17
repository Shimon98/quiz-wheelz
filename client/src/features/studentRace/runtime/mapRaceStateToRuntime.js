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
 */
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
  };

  return applyRaceSnapshot(withRaceMetadata, response.snapshot);
}
