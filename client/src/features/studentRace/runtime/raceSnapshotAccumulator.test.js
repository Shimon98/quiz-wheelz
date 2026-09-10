import { describe, expect, it } from "vitest";
import { applyRaceSnapshot } from "./applyRaceSnapshot.js";
import { mergeRaceStateIntoRuntime } from "./mergeRaceStateIntoRuntime.js";
import { mapRaceStateToRuntime } from "./mapRaceStateToRuntime.js";
import { raceSnapshot, raceResponse, raceOpponent } from "./studentRaceTestFixtures.js";
import { ApiContractError } from "../../../errors/ApiContractError.js";

describe("authoritative snapshot accumulator", () => {
  it.each([
    [11, 500, 12, 100, true], [12, 100, 12, 200, true],
    [12, 100, 11, 500, false], [12, 100, 12, 100, false],
  ])("orders (%s,%s) then (%s,%s) by event version first", (v, t, nextV, nextT, accepted) => {
    const state = mapRaceStateToRuntime(raceResponse({ eventVersion: v, snapshotAtEpochMs: t }));
    const next = applyRaceSnapshot(state, raceSnapshot({ eventVersion: nextV, snapshotAtEpochMs: nextT }));
    expect(next !== state).toBe(accepted);
  });

  it("rejects old race metadata and presentation after an answer snapshot", () => {
    const initial = mapRaceStateToRuntime(raceResponse());
    const answer = applyRaceSnapshot(initial, raceSnapshot({ eventVersion: 13, position: 250 }));
    const old = raceResponse({}, { raceTitle: "Stale", player: { ...raceResponse().player, displayName: "Stale" } });
    expect(mergeRaceStateIntoRuntime(answer, old)).toBe(answer);
    expect(answer.player.position).toBe(250);
  });

  it.each([0, 1, 7])("maps %s opponents and authoritative timestamps", (count) => {
    const opponents = Array.from({ length: count }, (_, index) => raceOpponent({ racePlayerId: index + 2 }));
    const state = mapRaceStateToRuntime(raceResponse({ opponents, playerFinishedAtEpochMs: 9999 }));
    expect(state.opponents).toEqual(opponents);
    expect(state.lastEventVersion).toBe(12);
    expect(state.player.positionAtEpochMs).toBe(9000);
    expect(state.playerFinishedAtEpochMs).toBe(9999);
  });

  it.each([
    [raceOpponent(), raceOpponent()], [raceOpponent({ racePlayerId: 1 })],
    [raceOpponent({ positionAtEpochMs: -1 })], [raceOpponent({ movementUnitsPerSecond: Infinity })],
    [raceOpponent({ finishedAtEpochMs: 1.5 })], [raceOpponent({ laneNumber: 0 })],
    Array.from({ length: 8 }, (_, index) => raceOpponent({ racePlayerId: index + 2 })),
  ])("rejects malformed or duplicate opponent roster %#", (...opponents) => {
    expect(() => mapRaceStateToRuntime(raceResponse({ opponents }))).toThrow(ApiContractError);
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1, undefined])("rejects invalid event version %s", (eventVersion) => {
    expect(() => mapRaceStateToRuntime(raceResponse({ eventVersion }))).toThrow(ApiContractError);
  });

  it("rebuilds on a different race or player identity", () => {
    const initial = mapRaceStateToRuntime(raceResponse());
    const next = mergeRaceStateIntoRuntime(initial, raceResponse({ eventVersion: 0 }, { raceId: 8 }));
    expect(next.race.id).toBe(8);
    expect(next.lastEventVersion).toBe(0);
  });
});
