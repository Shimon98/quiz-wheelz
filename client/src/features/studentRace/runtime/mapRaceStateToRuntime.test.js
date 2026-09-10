import { describe, expect, it } from "vitest";

import { mapRaceStateToRuntime } from "./mapRaceStateToRuntime";
import { applyRaceSnapshot } from "./applyRaceSnapshot";
import { ApiContractError } from "../../../errors/ApiContractError";

function validPlayer(overrides = {}) {
  return {
    racePlayerId: 91,
    displayName: "Noa",
    laneNumber: 3,
    vehicleTypeKey: "TOY_CAR",
    vehicleColorKey: "GREEN",
    vehicleAssetKey: "TOY_CAR_GREEN",
    ...overrides,
  };
}

function validSnapshot(overrides = {}) {
  return {
    raceStatus: "IN_PROGRESS",
    playerStatus: "RACING",
    playerFinished: false,
    raceFinished: false,
    totalDistance: 1000,
    position: 120,
    speed: 2,
    score: 40,
    streak: 2,
    highestStreak: 4,
    currentDifficulty: "EASY",
    eventVersion: 0,
    opponents: [],
    snapshotAtEpochMs: 1_755_600_000_000,
    movementUnitsPerSecond: 6,
    ...overrides,
  };
}

function validResponse(overrides = {}) {
  return {
    raceId: 7,
    raceTitle: "Jungle Cup",
    roomCode: "ABC123",
    startedAt: "2026-08-19T12:00:00",
    finishedAt: null,
    player: validPlayer(),
    snapshot: validSnapshot(),
    ...overrides,
  };
}

describe("mapRaceStateToRuntime — presentation identity", () => {
  it("includes authoritative standing on refresh without requiring nearby player rendering", () => {
    const runtime = mapRaceStateToRuntime(validResponse({
      snapshot: validSnapshot({ rank: 4, playerCount: 20 }),
    }));
    expect(runtime.player.rank).toBe(4);
    expect(runtime.playerCount).toBe(20);
  });

  it("builds the complete player identity from race-state alone", () => {
    const runtime = mapRaceStateToRuntime(validResponse());

    expect(runtime.player).toEqual({
      positionAtEpochMs: null,
      racePlayerId: 91,
      displayName: "Noa",
      laneNumber: 3,
      vehicleTypeKey: "TOY_CAR",
      vehicleColorKey: "GREEN",
      vehicleAssetKey: "TOY_CAR_GREEN",

      position: 120,
      speed: 2,
      score: 40,
      streak: 2,
      highestStreak: 4,
      rank: null,
      currentDifficulty: "EASY",
    });
  });

  it("treats vehicle keys as opaque server-owned strings", () => {
    const runtime = mapRaceStateToRuntime(
      validResponse({
        player: validPlayer({
          vehicleTypeKey: "HOVER_KART",
          vehicleColorKey: "CYAN",
          vehicleAssetKey: "HOVER_KART_CYAN",
        }),
      }),
    );

    expect(runtime.player.vehicleAssetKey).toBe("HOVER_KART_CYAN");
  });

  it("preserves identity when a newer snapshot is applied", () => {
    const runtime = mapRaceStateToRuntime(validResponse());

    const updated = applyRaceSnapshot(
      runtime,
      validSnapshot({
        position: 300,
        speed: 3,
        score: 60,
        snapshotAtEpochMs: 1_755_600_005_000,
      }),
    );

    expect(updated.player.position).toBe(300);
    expect(updated.player).toMatchObject({
      racePlayerId: 91,
      displayName: "Noa",
      laneNumber: 3,
      vehicleTypeKey: "TOY_CAR",
      vehicleColorKey: "GREEN",
      vehicleAssetKey: "TOY_CAR_GREEN",
    });
  });

  it("rejects a response without a player block", () => {
    expect(() => mapRaceStateToRuntime(validResponse({ player: null }))).toThrow(
      ApiContractError,
    );
    expect(() =>
      mapRaceStateToRuntime(validResponse({ player: "TOY_CAR_GREEN" })),
    ).toThrow(ApiContractError);
  });

  it.each([
    ["racePlayerId", null],
    ["racePlayerId", 0],
    ["racePlayerId", 1.5],
    ["laneNumber", null],
    ["laneNumber", -3],
    ["displayName", ""],
    ["displayName", "   "],
    ["displayName", 42],
    ["vehicleTypeKey", null],
    ["vehicleColorKey", ""],
    ["vehicleAssetKey", null],
  ])("rejects malformed player field %s = %s", (field, value) => {
    expect(() =>
      mapRaceStateToRuntime(
        validResponse({ player: validPlayer({ [field]: value }) }),
      ),
    ).toThrow(ApiContractError);
  });

  it("still rejects missing race metadata", () => {
    expect(() => mapRaceStateToRuntime(validResponse({ raceId: null }))).toThrow(
      ApiContractError,
    );
  });
});
