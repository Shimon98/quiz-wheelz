import { describe, expect, it } from "vitest";

import {
  isNotFoundError,
  isRacePlayerReconnectRequiredError,
  isReconnectWindowExpiredError,
} from "../errorChecks";

describe("not-found error check", () => {
  it("classifies by the normalized NOT_FOUND category, whatever the error name", () => {
    expect(isNotFoundError({ status: 404, category: "NOT_FOUND", errorName: "RACE_NOT_FOUND" })).toBe(true);
    expect(isNotFoundError({ status: 404, category: "NOT_FOUND", errorName: null })).toBe(true);
    expect(isNotFoundError({ status: 500, category: "SERVER", errorName: null })).toBe(false);
    expect(isNotFoundError(null)).toBe(false);
  });
});

describe("RacePlayer reconnect error checks", () => {
  it("classifies reconnect-required semantically rather than by HTTP status", () => {
    const reconnectRequired = {
      status: 409,
      errorName: "RACE_PLAYER_RECONNECT_REQUIRED",
    };
    const unrelatedConflict = {
      status: 409,
      errorName: "QUESTION_EXPIRED",
    };

    expect(isRacePlayerReconnectRequiredError(reconnectRequired)).toBe(true);
    expect(isRacePlayerReconnectRequiredError(unrelatedConflict)).toBe(false);
  });

  it("keeps reconnect-window expiry terminal and reconnect-required recoverable", () => {
    const reconnectRequired = {
      status: 409,
      errorName: "RACE_PLAYER_RECONNECT_REQUIRED",
    };
    const reconnectWindowExpired = {
      status: 409,
      errorName: "RACE_PLAYER_RECONNECT_WINDOW_EXPIRED",
    };

    expect(isRacePlayerReconnectRequiredError(reconnectWindowExpired)).toBe(false);
    expect(isReconnectWindowExpiredError(reconnectWindowExpired)).toBe(true);
    expect(isReconnectWindowExpiredError(reconnectRequired)).toBe(false);
  });
});
