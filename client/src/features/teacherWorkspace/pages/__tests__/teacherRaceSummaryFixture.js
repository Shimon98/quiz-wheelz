export function teacherRaceSummary(overrides = {}) {
  return {
    raceId: 7,
    title: "Jungle Cup",
    roomCode: "ABC123",
    status: "IN_PROGRESS",
    currentPlayers: 2,
    maxPlayers: 8,
    subjectName: "Math",
    subjectCode: "MATH",
    createdAt: "2026-09-14T10:00:00",
    ...overrides,
  };
}
