import { describe, expect, it } from "vitest";

import { ApiContractError } from "../../../../errors/ApiContractError";
import { applyRaceSnapshot } from "../applyRaceSnapshot";
import { createInitialRaceRuntimeState } from "../createInitialRaceRuntimeState";
import { createDefaultStudentRaceGameplay } from "../mapStudentRaceGameplay";

function snapshot(overrides = {}) {
  return {
    totalDistance: 1000,
    score: 100,
    position: 200,
    speed: 1.5,
    streak: 2,
    highestStreak: 3,
    eventVersion: 0,
    opponents: [],
    snapshotAtEpochMs: 10000,
    movementUnitsPerSecond: 6,
    raceStatus: "IN_PROGRESS",
    playerStatus: "RACING",
    playerFinished: false,
    raceFinished: false,
    rank: 3,
    playerCount: 18,
    ...overrides,
  };
}

describe("applyRaceSnapshot authoritative standing", () => {
  it("starts without an invented rank or participant count", () => {
    const initial = createInitialRaceRuntimeState();
    expect(initial.player.rank).toBeNull();
    expect(initial.playerCount).toBeNull();
  });

  it("maps server standing without deriving it from progress or lane", () => {
    const state = applyRaceSnapshot(createInitialRaceRuntimeState(), snapshot());
    expect(state.player.rank).toBe(3);
    expect(state.playerCount).toBe(18);
    const updated = applyRaceSnapshot(state, snapshot({ rank: 9, snapshotAtEpochMs: 11000 }));
    expect(updated.player.rank).toBe(9);
    expect(updated.player.position).toBe(state.player.position);
  });

  it("ignores older standing snapshots and requires a newer version for same-time updates", () => {
    const state = applyRaceSnapshot(createInitialRaceRuntimeState(), snapshot());
    expect(applyRaceSnapshot(state, snapshot({ rank: 1, snapshotAtEpochMs: 9999 }))).toBe(state);
    expect(applyRaceSnapshot(state, snapshot({ rank: 4 }))).toBe(state);
    expect(applyRaceSnapshot(state, snapshot({ rank: 4, eventVersion: 1 })).player.rank).toBe(4);
  });

  it.each([null, undefined])("clears missing standing in a fresh snapshot: %s", (value) => {
    const state = applyRaceSnapshot(createInitialRaceRuntimeState(), snapshot());
    const updated = applyRaceSnapshot(state, snapshot({
      rank: value,
      playerCount: value,
      snapshotAtEpochMs: 11000,
    }));
    expect(updated.player.rank).toBeNull();
    expect(updated.playerCount).toBeNull();
  });

  it.each([
    { rank: 0 },
    { rank: 2.5 },
    { rank: "2" },
    { playerCount: -1 },
    { playerCount: Infinity },
    { rank: 19, playerCount: 18 },
  ])("rejects malformed standing: %o", (overrides) => {
    expect(() => applyRaceSnapshot(createInitialRaceRuntimeState(), snapshot(overrides)))
      .toThrow(ApiContractError);
  });
});

describe("applyRaceSnapshot gameplay", () => {
  const slowedGameplay = {
    mode: "NORMAL",
    effectiveSpeed: 1.2,
    activeEffects: [{
      effectId: 41,
      type: "SPEED_SLOW",
      source: "CHALLENGE_TIMEOUT",
      magnitudeTenths: 1,
      startsAtEpochMs: 9000,
      endsAtEpochMs: 12000,
    }],
  };

  it("keeps the base speed, presents the effective speed and never rewrites the server movement rate", () => {
    const state = applyRaceSnapshot(createInitialRaceRuntimeState(), snapshot({
      speed: 1.3,
      movementUnitsPerSecond: 4.12345,
      gameplay: slowedGameplay,
    }));

    expect(state.player.speed).toBe(1.3);
    expect(state.gameplay).toEqual(slowedGameplay);
    expect(state.gameplay.effectiveSpeed).toBe(1.2);
    expect(state.visual.targetSpeed).toBe(1.2);
    expect(state.visual.movementUnitsPerSecond).toBe(4.12345);
  });

  it("starts with normal gameplay and presents the base speed when a snapshot has none", () => {
    expect(createInitialRaceRuntimeState().gameplay).toEqual(createDefaultStudentRaceGameplay());

    const state = applyRaceSnapshot(createInitialRaceRuntimeState(), snapshot({ speed: 1.3 }));

    expect(state.gameplay).toEqual(createDefaultStudentRaceGameplay());
    expect(state.visual.targetSpeed).toBe(1.3);
  });

  it("drops a malformed effect without rejecting the race snapshot", () => {
    const state = applyRaceSnapshot(createInitialRaceRuntimeState(), snapshot({
      gameplay: { ...slowedGameplay, activeEffects: [{ effectId: "41" }] },
    }));

    expect(state.gameplay.activeEffects).toEqual([]);
    expect(state.player.position).toBe(200);
  });

  it("keeps the previous gameplay when an older snapshot arrives", () => {
    const state = applyRaceSnapshot(createInitialRaceRuntimeState(), snapshot({ gameplay: slowedGameplay }));
    const stale = applyRaceSnapshot(state, snapshot({
      snapshotAtEpochMs: 9999,
      gameplay: { mode: "NORMAL", effectiveSpeed: 1.5, activeEffects: [] },
    }));

    expect(stale).toBe(state);
    expect(stale.gameplay).toEqual(slowedGameplay);
  });
});
