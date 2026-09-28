export function teacherResultPlayer(overrides = {}) {
  return {
    racePlayerId: 11,
    displayName: "Noa",
    laneNumber: 1,
    vehicleTypeKey: "TOY_CAR",
    vehicleColorKey: "GREEN",
    vehicleAssetKey: "TOY_CAR_GREEN",
    rank: 1,
    score: 920,
    correctAnswers: 9,
    wrongAnswers: 1,
    bestStreak: 7,
    position: 1000,
    status: "FINISHED",
    finishedAtEpochMs: 1_760_000_134_000,
    ...overrides,
  };
}

export function teacherResultRoster() {
  return [
    teacherResultPlayer(),
    teacherResultPlayer({
      racePlayerId: 12,
      displayName: "Dan",
      laneNumber: 2,
      vehicleColorKey: "BLUE",
      vehicleAssetKey: "TOY_CAR_BLUE",
      rank: 2,
      score: 840,
      correctAnswers: 8,
      wrongAnswers: 2,
      bestStreak: 6,
      finishedAtEpochMs: 1_760_000_138_000,
    }),
    teacherResultPlayer({
      racePlayerId: 13,
      displayName: "Maya",
      laneNumber: 3,
      vehicleColorKey: "RED",
      vehicleAssetKey: "TOY_CAR_RED",
      rank: 3,
      score: 790,
      correctAnswers: 8,
      wrongAnswers: 3,
      bestStreak: 5,
      finishedAtEpochMs: 1_760_000_141_000,
    }),
    teacherResultPlayer({
      racePlayerId: 14,
      displayName: "Adi",
      laneNumber: 4,
      vehicleColorKey: "CYAN",
      vehicleAssetKey: "TOY_CAR_CYAN",
      rank: 4,
      score: 580,
      correctAnswers: 5,
      wrongAnswers: 5,
      bestStreak: 2,
      position: 612.5,
      status: "DISCONNECTED",
      finishedAtEpochMs: null,
    }),
  ];
}

export function teacherRaceResultsResponse(overrides = {}) {
  const players = overrides.players ?? teacherResultRoster();

  return {
    raceId: 7,
    title: "Jungle Cup",
    roomCode: "ABC123",
    subject: { id: 1, name: "Math", code: "MATH" },
    status: "FINISHED",
    maxPlayers: 8,
    playerCount: players.length,
    totalDistance: 1000,
    startedAtEpochMs: 1_760_000_000_000,
    finishedAtEpochMs: 1_760_000_153_000,
    winnerRacePlayerIds: [11],
    summary: {
      finishedPlayers: 3,
      disconnectedPlayers: 1,
      totalCorrectAnswers: 30,
      totalWrongAnswers: 11,
    },
    awards: [
      { type: "HIGHEST_SCORE", racePlayerIds: [11], value: 920 },
      { type: "MOST_CORRECT_ANSWERS", racePlayerIds: [11], value: 9 },
      { type: "BEST_STREAK", racePlayerIds: [11], value: 7 },
    ],
    players,
    ...overrides,
  };
}
