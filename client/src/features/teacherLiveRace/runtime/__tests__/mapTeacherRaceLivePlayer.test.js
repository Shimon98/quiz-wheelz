import { describe, expect, it } from "vitest";

import {
  mapTeacherRaceLivePlayer,
  mapTeacherRaceLiveRoster,
} from "../mapTeacherRaceLivePlayer";
import { teacherLivePlayer } from "../teacherRaceLiveTestFixtures";
import { ApiContractError } from "../../../../errors/ApiContractError";

describe("mapTeacherRaceLivePlayer", () => {
  it("maps a valid player into a fresh object with only the live contract fields", () => {
    const raw = teacherLivePlayer({ extraServerField: "ignored" });

    const mapped = mapTeacherRaceLivePlayer(raw);

    expect(mapped).toEqual({
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
    });
    expect(mapped).not.toBe(raw);
  });

  it("accepts zero score, zero streak, zero position and the finished status", () => {
    const mapped = mapTeacherRaceLivePlayer(
      teacherLivePlayer({ score: 0, streak: 0, position: 0, speed: 0, status: "FINISHED" }),
    );

    expect(mapped.score).toBe(0);
    expect(mapped.status).toBe("FINISHED");
  });

  it.each([
    ["rank 0", { rank: 0 }],
    ["unknown status", { status: "SLEEPING" }],
    ["client-only status", { status: "UNKNOWN" }],
    ["non-finite position", { position: Number.NaN }],
    ["non-finite speed", { speed: Number.POSITIVE_INFINITY }],
    ["negative position", { position: -1 }],
    ["negative score", { score: -5 }],
    ["fractional streak", { streak: 1.5 }],
    ["zero racePlayerId", { racePlayerId: 0 }],
    ["string racePlayerId", { racePlayerId: "91" }],
    ["lane below one", { laneNumber: 0 }],
    ["lane above capacity", { laneNumber: 9 }],
    ["blank display name", { displayName: "   " }],
    ["missing vehicle asset", { vehicleAssetKey: null }],
  ])("rejects %s", (_label, overrides) => {
    expect(() =>
      mapTeacherRaceLivePlayer(teacherLivePlayer(overrides)),
    ).toThrow(ApiContractError);
  });

  it("rejects a missing player", () => {
    expect(() => mapTeacherRaceLivePlayer(null)).toThrow(ApiContractError);
  });
});

describe("mapTeacherRaceLiveRoster", () => {
  it("keeps the server order and never sorts", () => {
    const roster = mapTeacherRaceLiveRoster([
      teacherLivePlayer({ racePlayerId: 3, rank: 2, laneNumber: 3 }),
      teacherLivePlayer({ racePlayerId: 1, rank: 1, laneNumber: 1 }),
    ]);

    expect(roster.map((player) => player.racePlayerId)).toEqual([3, 1]);
  });

  it("accepts an empty roster and a full eight-player roster", () => {
    expect(mapTeacherRaceLiveRoster([])).toEqual([]);

    const eight = Array.from({ length: 8 }, (_, index) =>
      teacherLivePlayer({ racePlayerId: index + 1, laneNumber: index + 1 }),
    );

    expect(mapTeacherRaceLiveRoster(eight)).toHaveLength(8);
  });

  it("rejects a roster above capacity", () => {
    const nine = Array.from({ length: 9 }, (_, index) =>
      teacherLivePlayer({ racePlayerId: index + 1, laneNumber: 1 }),
    );

    expect(() => mapTeacherRaceLiveRoster(nine)).toThrow(ApiContractError);
  });

  it("rejects a repeated racePlayerId", () => {
    expect(() =>
      mapTeacherRaceLiveRoster([
        teacherLivePlayer({ racePlayerId: 5 }),
        teacherLivePlayer({ racePlayerId: 5, laneNumber: 2 }),
      ]),
    ).toThrow(ApiContractError);
  });

  it("rejects a non-array roster", () => {
    expect(() => mapTeacherRaceLiveRoster(undefined)).toThrow(ApiContractError);
  });
});
