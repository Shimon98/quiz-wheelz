import { describe, expect, it } from "vitest";

import { buildTeacherRaceProjectorViewModel } from "../buildTeacherRaceProjectorViewModel";
import { mapTeacherRaceLiveState } from "../../runtime/mapTeacherRaceLiveState";
import {
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../../runtime/teacherRaceLiveTestFixtures";

function runtimeWithPlayers(players, overrides = {}) {
  return mapTeacherRaceLiveState(teacherLiveStateResponse({ players, ...overrides }));
}

describe("buildTeacherRaceProjectorViewModel", () => {
  it("derives progress from position over total distance and clamps it", () => {
    const runtime = runtimeWithPlayers([
      teacherLivePlayer({ racePlayerId: 1, laneNumber: 1, position: 0 }),
      teacherLivePlayer({ racePlayerId: 2, laneNumber: 2, position: 640 }),
      teacherLivePlayer({ racePlayerId: 3, laneNumber: 3, position: 1450 }),
    ]);

    const { lanes } = buildTeacherRaceProjectorViewModel(runtime, null);

    expect(lanes.map((lane) => lane.progressRatio)).toEqual([0, 0.64, 1]);
    expect(lanes.map((lane) => lane.progressPercent)).toEqual([0, 64, 100]);
    expect(runtime.players[2].position).toBe(1450);
  });

  it("orders lanes by lane number without mutating the runtime order", () => {
    const runtime = runtimeWithPlayers([
      teacherLivePlayer({ racePlayerId: 1, laneNumber: 4, rank: 1 }),
      teacherLivePlayer({ racePlayerId: 2, laneNumber: 1, rank: 2 }),
      teacherLivePlayer({ racePlayerId: 3, laneNumber: 2, rank: 3 }),
    ]);
    const originalOrder = runtime.players.map((player) => player.racePlayerId);

    const { lanes, leaderboard } = buildTeacherRaceProjectorViewModel(runtime, null);

    expect(lanes.map((lane) => lane.laneNumber)).toEqual([1, 2, 4]);
    expect(runtime.players.map((player) => player.racePlayerId)).toEqual(originalOrder);
    expect(leaderboard.map((row) => row.racePlayerId)).toEqual(originalOrder);
  });

  it("keeps the server leaderboard order, tie ranks, score and streak exactly", () => {
    const runtime = runtimeWithPlayers([
      teacherLivePlayer({ racePlayerId: 1, laneNumber: 1, rank: 1, position: 500, score: 40, streak: 3 }),
      teacherLivePlayer({ racePlayerId: 2, laneNumber: 2, rank: 1, position: 500, score: 40, streak: 0 }),
      teacherLivePlayer({ racePlayerId: 3, laneNumber: 3, rank: 3, position: 200, score: 10, streak: 1 }),
    ]);

    const { leaderboard } = buildTeacherRaceProjectorViewModel(runtime, null);

    expect(leaderboard.map((row) => row.rank)).toEqual([1, 1, 3]);
    expect(leaderboard.map((row) => row.score)).toEqual([40, 40, 10]);
    expect(leaderboard.map((row) => row.streak)).toEqual([3, 0, 1]);
    expect(leaderboard[0].progressPercent).toBe(50);
  });

  it("resolves the vehicle accent from the shared color identity", () => {
    const runtime = runtimeWithPlayers([
      teacherLivePlayer({ racePlayerId: 1, laneNumber: 1, vehicleColorKey: "GREEN" }),
      teacherLivePlayer({ racePlayerId: 2, laneNumber: 2, vehicleColorKey: "MAGENTA" }),
    ]);

    const { lanes } = buildTeacherRaceProjectorViewModel(runtime, null);

    expect(lanes[0].accentColor).toBe("#2fa84f");
    expect(lanes[1].accentColor).toBeNull();
  });

  it("builds the header from race truth and the elapsed label", () => {
    const running = buildTeacherRaceProjectorViewModel(
      runtimeWithPlayers([teacherLivePlayer()]),
      65_000,
    );
    const finished = buildTeacherRaceProjectorViewModel(
      runtimeWithPlayers([teacherLivePlayer()], { status: "FINISHED" }),
      null,
    );

    expect(running.header).toEqual({
      title: "Jungle Cup",
      status: "IN_PROGRESS",
      roomCode: "ABC123",
      participantCount: 1,
      elapsedLabel: "01:05",
      isFinished: false,
    });
    expect(finished.header.isFinished).toBe(true);
    expect(finished.header.elapsedLabel).toBeNull();
    expect(finished.race).toEqual({ totalDistance: 1000, status: "FINISHED", isFinished: true });
  });

  it("passes the runtime order to the leaderboard untouched, even when it is not sorted by rank or lane", () => {
    const runtime = runtimeWithPlayers([
      teacherLivePlayer({ racePlayerId: 7, laneNumber: 3, rank: 3, position: 100 }),
      teacherLivePlayer({ racePlayerId: 8, laneNumber: 1, rank: 1, position: 300 }),
      teacherLivePlayer({ racePlayerId: 9, laneNumber: 2, rank: 2, position: 200 }),
    ]);

    const { leaderboard, lanes } = buildTeacherRaceProjectorViewModel(runtime, null);

    expect(leaderboard.map((row) => row.racePlayerId)).toEqual([7, 8, 9]);
    expect(lanes.map((lane) => lane.racePlayerId)).toEqual([8, 9, 7]);
  });
});
