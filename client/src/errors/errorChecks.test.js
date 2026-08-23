import { describe, expect, it } from "vitest";

import {
  isRacePlayerReconnectRequiredError,
  isReconnectWindowExpiredError,
} from "./errorChecks";

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
