import { describe, expect, it } from "vitest";

import { mapRacePlayerReconnectToModel } from "./mapRacePlayerReconnectToModel";
import { ApiContractError } from "../../errors/ApiContractError";
import {
  RACE_PLAYER_RECONNECT_OUTCOMES,
  RACE_PLAYER_STATUSES,
  RACE_STATUSES,
} from "../../constants/raceStatusConstants";

// C1-05 reconnect DTO boundary — consumed fields only, malformed fails fast.

function validResponse(overrides = {}) {
  return {
    raceId: 7,
    racePlayerId: 21,
    outcome: RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECTED,
    online: true,
    canContinueRace: true,
    playerStatus: RACE_PLAYER_STATUSES.RACING,
    raceStatus: RACE_STATUSES.IN_PROGRESS,
    resolvedAt: "2026-08-19T12:00:00",
    ...overrides,
  };
}

describe("mapRacePlayerReconnectToModel", () => {
  it("maps a valid active RECONNECTED response to the consumed model only", () => {
    expect(mapRacePlayerReconnectToModel(validResponse())).toEqual({
      outcome: RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECTED,
      online: true,
      canContinueRace: true,
      playerStatus: RACE_PLAYER_STATUSES.RACING,
      raceStatus: RACE_STATUSES.IN_PROGRESS,
    });
  });

  it("maps a valid WAITING_FOR_RACE response", () => {
    const model = mapRacePlayerReconnectToModel(
      validResponse({
        outcome: RACE_PLAYER_RECONNECT_OUTCOMES.WAITING_FOR_RACE,
        canContinueRace: false,
        playerStatus: RACE_PLAYER_STATUSES.WAITING,
        raceStatus: RACE_STATUSES.WAITING_FOR_PLAYERS,
      }),
    );

    expect(model.outcome).toBe(RACE_PLAYER_RECONNECT_OUTCOMES.WAITING_FOR_RACE);
    expect(model.canContinueRace).toBe(false);
  });

  it("maps every terminal outcome the server can resolve", () => {
    for (const outcome of [
      RACE_PLAYER_RECONNECT_OUTCOMES.PLAYER_FINISHED,
      RACE_PLAYER_RECONNECT_OUTCOMES.RACE_FINISHED,
      RACE_PLAYER_RECONNECT_OUTCOMES.ALREADY_DISCONNECTED,
      RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECT_WINDOW_EXPIRED,
    ]) {
      const model = mapRacePlayerReconnectToModel(
        validResponse({ outcome, online: false, canContinueRace: false }),
      );
      expect(model.outcome).toBe(outcome);
    }
  });

  it("rejects a missing response", () => {
    expect(() => mapRacePlayerReconnectToModel(null)).toThrow(ApiContractError);
    expect(() => mapRacePlayerReconnectToModel("nope")).toThrow(ApiContractError);
  });

  it("rejects an unknown outcome", () => {
    expect(() =>
      mapRacePlayerReconnectToModel(validResponse({ outcome: "TELEPORTED" })),
    ).toThrow(ApiContractError);
  });

  it("rejects non-boolean online / canContinueRace flags", () => {
    expect(() =>
      mapRacePlayerReconnectToModel(validResponse({ online: "true" })),
    ).toThrow(ApiContractError);
    expect(() =>
      mapRacePlayerReconnectToModel(validResponse({ canContinueRace: 1 })),
    ).toThrow(ApiContractError);
  });

  it("rejects an invalid player status", () => {
    expect(() =>
      mapRacePlayerReconnectToModel(validResponse({ playerStatus: "SLEEPING" })),
    ).toThrow(ApiContractError);
  });

  it("rejects an invalid race status, including the client-only UNKNOWN", () => {
    expect(() =>
      mapRacePlayerReconnectToModel(validResponse({ raceStatus: "PAUSED" })),
    ).toThrow(ApiContractError);
    expect(() =>
      mapRacePlayerReconnectToModel(
        validResponse({ raceStatus: RACE_STATUSES.UNKNOWN }),
      ),
    ).toThrow(ApiContractError);
  });
});
