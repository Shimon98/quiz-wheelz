import { describe, expect, it } from "vitest";

import { mapTeacherRaceLiveState } from "../mapTeacherRaceLiveState";
import {
  teacherLivePlayer,
  teacherLiveStateResponse,
} from "../teacherRaceLiveTestFixtures";
import { ApiContractError } from "../../../../errors/ApiContractError";

describe("mapTeacherRaceLiveState", () => {
  it("maps a valid response into the authoritative runtime", () => {
    const runtime = mapTeacherRaceLiveState(teacherLiveStateResponse());

    expect(runtime).toEqual({
      race: {
        raceId: 7,
        title: "Jungle Cup",
        roomCode: "ABC123",
        status: "IN_PROGRESS",
        totalDistance: 1000,
        focusPolicy: "WARN",
        startedAtEpochMs: null,
        finishedAtEpochMs: null,
      },
      serverTimeEpochMs: 1_755_600_000_000,
      eventVersion: 12,
      players: [
        {
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
        },
        {
          racePlayerId: 92,
          displayName: "Dan",
          laneNumber: 2,
          vehicleTypeKey: "TOY_CAR",
          vehicleColorKey: "GREEN",
          vehicleAssetKey: "TOY_CAR_GREEN",
          rank: 2,
          position: 80,
          speed: 1.2,
          score: 20,
          streak: 0,
          status: "RACING",
        },
      ],
    });
    expect(runtime).not.toHaveProperty("baseMovementUnitsPerSecond");
  });

  it("preserves the server standings order of players", () => {
    const runtime = mapTeacherRaceLiveState(
      teacherLiveStateResponse({
        players: [
          teacherLivePlayer({ racePlayerId: 2, rank: 1, laneNumber: 4 }),
          teacherLivePlayer({ racePlayerId: 1, rank: 1, laneNumber: 1 }),
          teacherLivePlayer({ racePlayerId: 3, rank: 3, laneNumber: 2 }),
        ],
      }),
    );

    expect(runtime.players.map((player) => player.racePlayerId)).toEqual([2, 1, 3]);
    expect(runtime.players.map((player) => player.rank)).toEqual([1, 1, 3]);
  });

  it("accepts every durable server race status and event version zero", () => {
    for (const status of ["WAITING_FOR_PLAYERS", "READY", "IN_PROGRESS", "FINISHED", "CANCELLED"]) {
      expect(
        mapTeacherRaceLiveState(teacherLiveStateResponse({ status, eventVersion: 0, players: [] }))
          .race.status,
      ).toBe(status);
    }
  });

  it("treats missing or null lifecycle timestamps as null", () => {
    const missing = mapTeacherRaceLiveState(teacherLiveStateResponse());
    const nulls = mapTeacherRaceLiveState(
      teacherLiveStateResponse({ startedAtEpochMs: null, finishedAtEpochMs: null }),
    );

    expect(missing.race.startedAtEpochMs).toBeNull();
    expect(missing.race.finishedAtEpochMs).toBeNull();
    expect(nulls.race.startedAtEpochMs).toBeNull();
    expect(nulls.race.finishedAtEpochMs).toBeNull();
  });

  it("preserves valid future lifecycle epochs", () => {
    const runtime = mapTeacherRaceLiveState(
      teacherLiveStateResponse({
        status: "FINISHED",
        startedAtEpochMs: 1_755_600_000_000,
        finishedAtEpochMs: 1_755_600_090_000,
      }),
    );

    expect(runtime.race.startedAtEpochMs).toBe(1_755_600_000_000);
    expect(runtime.race.finishedAtEpochMs).toBe(1_755_600_090_000);
  });

  it.each([
    ["duplicate racePlayerId", { players: [teacherLivePlayer(), teacherLivePlayer({ laneNumber: 2 })] }],
    [
      "too many players",
      {
        players: Array.from({ length: 9 }, (_, index) =>
          teacherLivePlayer({ racePlayerId: index + 1, laneNumber: 1 }),
        ),
      },
    ],
    ["missing players", { players: undefined }],
    ["client-only race status", { status: "UNKNOWN" }],
    ["invalid race status", { status: "PAUSED" }],
    ["zero totalDistance", { totalDistance: 0 }],
    ["fractional totalDistance", { totalDistance: 10.5 }],
    ["negative eventVersion", { eventVersion: -1 }],
    ["string eventVersion", { eventVersion: "12" }],
    ["missing serverTimeEpochMs", { serverTimeEpochMs: undefined }],
    ["zero raceId", { raceId: 0 }],
    ["blank title", { title: "" }],
    ["missing roomCode", { roomCode: null }],
    ["missing focusPolicy", { focusPolicy: null }],
    ["string startedAtEpochMs", { startedAtEpochMs: "2026-09-14T10:00:00" }],
    ["zero startedAtEpochMs", { startedAtEpochMs: 0 }],
    ["fractional finishedAtEpochMs", { finishedAtEpochMs: 1.5 }],
  ])("rejects %s", (_label, overrides) => {
    expect(() =>
      mapTeacherRaceLiveState(teacherLiveStateResponse(overrides)),
    ).toThrow(ApiContractError);
  });

  it("rejects a missing response", () => {
    expect(() => mapTeacherRaceLiveState(undefined)).toThrow(ApiContractError);
  });
});
