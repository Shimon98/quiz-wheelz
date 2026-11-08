import { describe, expect, it } from "vitest";

import enErrors from "../../i18n/locales/en/errors";
import heErrors from "../../i18n/locales/he/errors";
import {
  isNotFoundError,
  isQuestionUnavailableError,
  isRacePlayerReconnectRequiredError,
  isRaceResultsNotAvailableError,
  isReconnectWindowExpiredError,
} from "../errorChecks";
import { normalizeApiError } from "../normalizeApiError";

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

describe("question unavailable check", () => {
  it("names a player with no usable question by its server name, with a message that says what to do", () => {
    const unavailable = normalizeApiError({
      response: { status: 409, data: { error: "QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER", code: 3018 } },
    });

    expect(unavailable).toMatchObject({ category: "CONFLICT", messageKey: "question.unavailable" });
    expect(isQuestionUnavailableError(unavailable)).toBe(true);
    expect(isQuestionUnavailableError(normalizeApiError({ response: { status: 409, data: {} } }))).toBe(false);
    expect(isQuestionUnavailableError(null)).toBe(false);
  });

  it("has that message in both languages", () => {
    expect(heErrors.question.unavailable).toEqual(expect.any(String));
    expect(enErrors.question.unavailable).toEqual(expect.any(String));
  });
});

describe("race results availability check", () => {
  it("recognizes the finished-only results conflict by its server name, not by its status", () => {
    const notAvailable = normalizeApiError({
      response: { status: 409, data: { error: "RACE_RESULTS_NOT_AVAILABLE", code: 3030 } },
    });
    const otherConflict = normalizeApiError({ response: { status: 409, data: {} } });

    expect(notAvailable.category).toBe("CONFLICT");
    expect(isRaceResultsNotAvailableError(notAvailable)).toBe(true);
    expect(isRaceResultsNotAvailableError(otherConflict)).toBe(false);
    expect(isRaceResultsNotAvailableError(null)).toBe(false);
  });
});
