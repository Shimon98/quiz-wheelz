import { mapRaceStateToRuntime } from "./mapRaceStateToRuntime.js";
import { raceOpponent, raceResponse } from "./studentRaceTestFixtures.js";

export function resultsOpponent(racePlayerId, status, rank, overrides = {}) {
  return raceOpponent({
    racePlayerId,
    displayName: `Player ${racePlayerId}`,
    laneNumber: racePlayerId,
    rank,
    status,
    position: status === "FINISHED" ? 1000 : 500,
    movementUnitsPerSecond: status === "RACING" ? 6 : 0,
    finishedAtEpochMs: status === "FINISHED" ? 9_000 + racePlayerId : null,
    ...overrides,
  });
}

export function resultsSnapshot(overrides = {}) {
  return {
    raceStatus: "IN_PROGRESS",
    raceFinished: false,
    playerStatus: "FINISHED",
    playerFinished: true,
    playerFinishedAtEpochMs: 9_001,
    position: 1000,
    movementUnitsPerSecond: 0,
    rank: 1,
    playerCount: 5,
    opponents: [
      resultsOpponent(2, "FINISHED", 2),
      resultsOpponent(3, "FINISHED", 3),
      resultsOpponent(4, "RACING", 4),
      resultsOpponent(5, "DISCONNECTED", 5),
    ],
    ...overrides,
  };
}

export function resultsRaceState(overrides = {}) {
  return raceResponse(resultsSnapshot(overrides));
}

export function resultsRuntime(overrides = {}) {
  return mapRaceStateToRuntime(resultsRaceState(overrides));
}

export function resultsFinishOrder(...finishers) {
  return {
    eventVersion: 20,
    decidedAtEpochMs: 20_000,
    confirmedThroughEpochMs: 19_000,
    confirmedFinishers: finishers.map(([racePlayerId, rank, finishedAtEpochMs = 9_000 + racePlayerId]) => ({
      racePlayerId,
      rank,
      finishedAtEpochMs,
    })),
  };
}
