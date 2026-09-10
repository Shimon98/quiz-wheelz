export function raceSnapshot(overrides = {}) {
  return {
    totalDistance: 1000, score: 100, position: 200, positionAtEpochMs: 9000,
    speed: 1.5, streak: 2, highestStreak: 3, snapshotAtEpochMs: 10000,
    movementUnitsPerSecond: 6, eventVersion: 12, raceStatus: "IN_PROGRESS",
    playerStatus: "RACING", playerFinished: false, raceFinished: false,
    playerFinishedAtEpochMs: null, rank: 3, playerCount: 8, opponents: [], ...overrides,
  };
}

export function raceOpponent(overrides = {}) {
  return {
    racePlayerId: 2, displayName: "Opponent", laneNumber: 2,
    vehicleTypeKey: "TOY_CAR", vehicleColorKey: "GREEN", vehicleAssetKey: "TOY_CAR_GREEN",
    rank: 1, position: 220, positionAtEpochMs: 9000, movementUnitsPerSecond: 6,
    status: "RACING", finishedAtEpochMs: null, ...overrides,
  };
}

export function raceResponse(snapshot = {}, overrides = {}) {
  return {
    raceId: 7, raceTitle: "Jungle Cup", roomCode: "ABC123",
    player: { racePlayerId: 1, displayName: "Player", laneNumber: 1,
      vehicleTypeKey: "TOY_CAR", vehicleColorKey: "GREEN", vehicleAssetKey: "TOY_CAR_GREEN" },
    snapshot: raceSnapshot(snapshot), ...overrides,
  };
}
