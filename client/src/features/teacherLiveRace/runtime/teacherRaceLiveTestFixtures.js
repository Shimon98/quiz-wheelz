export function teacherLivePlayer(overrides = {}) {
  return {
    racePlayerId: 91,
    displayName: "Noa",
    laneNumber: 1,
    vehicleTypeKey: "TOY_CAR",
    vehicleColorKey: "GREEN",
    vehicleAssetKey: "TOY_CAR_GREEN",
    rank: 1,
    position: 120.5,
    speed: 1.2,
    score: 40,
    streak: 2,
    status: "RACING",
    ...overrides,
  };
}

export function teacherLiveStateResponse(overrides = {}) {
  return {
    raceId: 7,
    title: "Jungle Cup",
    roomCode: "ABC123",
    status: "IN_PROGRESS",
    totalDistance: 1000,
    focusPolicy: "WARN",
    serverTimeEpochMs: 1_755_600_000_000,
    baseMovementUnitsPerSecond: 4,
    eventVersion: 12,
    players: [
      teacherLivePlayer(),
      teacherLivePlayer({
        racePlayerId: 92,
        displayName: "Dan",
        laneNumber: 2,
        rank: 2,
        position: 80,
        score: 20,
        streak: 0,
      }),
    ],
    ...overrides,
  };
}
