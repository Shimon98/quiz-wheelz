import { describe, expect, it } from "vitest";

import { ApiContractError } from "../../../../errors/ApiContractError";
import { mapChallengeChoiceResponse } from "../mapChallengeChoiceResponse";

function snapshot() {
  return {
    totalDistance: 1000,
    score: 40,
    position: 200,
    speed: 1.1,
    streak: 2,
    highestStreak: 3,
    snapshotAtEpochMs: 1_800_000_000_500,
    movementUnitsPerSecond: 4.4,
    eventVersion: 9,
    raceStatus: "IN_PROGRESS",
    playerStatus: "RACING",
    playerFinished: false,
    raceFinished: false,
    opponents: [],
    gameplay: { mode: "TURBO_TRIAL", effectiveSpeed: 1.1, activeEffects: [], challenge: null },
  };
}

function response(overrides = {}) {
  return { offerId: 17, choice: "TURBO_TRIAL", selectedAtEpochMs: 1_800_000_000_400, snapshot: snapshot(), ...overrides };
}

const REQUEST = { offerId: 17, choice: "TURBO_TRIAL" };

describe("mapChallengeChoiceResponse", () => {
  it("returns the authoritative snapshot of the confirmed choice", () => {
    expect(mapChallengeChoiceResponse(response(), REQUEST)).toEqual(snapshot());
  });

  it("accepts a confirmed replay whose run already ended", () => {
    const ended = { ...snapshot(), gameplay: { ...snapshot().gameplay, mode: "NORMAL" } };

    expect(mapChallengeChoiceResponse(response({ snapshot: ended }), REQUEST).gameplay.mode).toBe("NORMAL");
  });

  it.each([
    ["another offer", { offerId: 18 }],
    ["another choice", { choice: "SAFE_RUN" }],
    ["no selection time", { selectedAtEpochMs: null }],
    ["a broken snapshot", { snapshot: { ...snapshot(), eventVersion: -1 } }],
  ])("rejects a response for %s before anything is applied", (_, broken) => {
    expect(() => mapChallengeChoiceResponse(response(broken), REQUEST)).toThrow(ApiContractError);
  });

  it("rejects a missing response", () => {
    expect(() => mapChallengeChoiceResponse(null, REQUEST)).toThrow(ApiContractError);
  });
});
