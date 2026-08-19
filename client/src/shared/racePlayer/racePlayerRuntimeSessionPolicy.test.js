import { describe, expect, it } from "vitest";

import {
  RUNTIME_SESSION_FAILURE_KINDS,
  canScheduleReconnectRetry,
  classifyRuntimeSessionFailure,
  isTerminalReconnectOutcome,
  resolveDegradedConnectionState,
} from "./racePlayerRuntimeSessionPolicy";
import { RACE_PLAYER_RECONNECT_OUTCOMES } from "../../constants/raceStatusConstants";
import { RACE_PLAYER_CONNECTION_STATES } from "./racePlayerRuntimeSessionConfig";
import { ERROR_CATEGORIES } from "../../errors/errorCategories";

// C1-05: the pure classification table the lifecycle hook acts on.

const normalized = (overrides) => ({
  status: null,
  code: null,
  errorName: null,
  category: ERROR_CATEGORIES.UNKNOWN,
  messageKey: "general.unexpected",
  validationErrors: null,
  ...overrides,
});

describe("isTerminalReconnectOutcome", () => {
  it("marks exactly the four terminal outcomes", () => {
    expect(
      isTerminalReconnectOutcome(RACE_PLAYER_RECONNECT_OUTCOMES.PLAYER_FINISHED),
    ).toBe(true);
    expect(
      isTerminalReconnectOutcome(RACE_PLAYER_RECONNECT_OUTCOMES.RACE_FINISHED),
    ).toBe(true);
    expect(
      isTerminalReconnectOutcome(
        RACE_PLAYER_RECONNECT_OUTCOMES.ALREADY_DISCONNECTED,
      ),
    ).toBe(true);
    expect(
      isTerminalReconnectOutcome(
        RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECT_WINDOW_EXPIRED,
      ),
    ).toBe(true);

    expect(
      isTerminalReconnectOutcome(RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECTED),
    ).toBe(false);
    expect(
      isTerminalReconnectOutcome(
        RACE_PLAYER_RECONNECT_OUTCOMES.WAITING_FOR_RACE,
      ),
    ).toBe(false);
  });
});

describe("classifyRuntimeSessionFailure", () => {
  it("window expiry is TERMINAL — never a session redirect", () => {
    expect(
      classifyRuntimeSessionFailure(
        normalized({
          errorName: "RACE_PLAYER_RECONNECT_WINDOW_EXPIRED",
          category: ERROR_CATEGORIES.CONFLICT,
        }),
      ),
    ).toBe(RUNTIME_SESSION_FAILURE_KINDS.TERMINAL);
  });

  it("a dead RacePlayer identity is SESSION (gate territory)", () => {
    expect(
      classifyRuntimeSessionFailure(
        normalized({
          errorName: "INVALID_RACE_PLAYER_TOKEN",
          category: ERROR_CATEGORIES.RACE_PLAYER_SESSION,
        }),
      ),
    ).toBe(RUNTIME_SESSION_FAILURE_KINDS.SESSION);
  });

  it("network/5xx are TRANSIENT; contract/unknown are MANUAL", () => {
    expect(
      classifyRuntimeSessionFailure(
        normalized({ category: ERROR_CATEGORIES.NETWORK }),
      ),
    ).toBe(RUNTIME_SESSION_FAILURE_KINDS.TRANSIENT);
    expect(
      classifyRuntimeSessionFailure(
        normalized({ category: ERROR_CATEGORIES.SERVER, status: 500 }),
      ),
    ).toBe(RUNTIME_SESSION_FAILURE_KINDS.TRANSIENT);
    expect(
      classifyRuntimeSessionFailure(
        normalized({ category: ERROR_CATEGORIES.API_CONTRACT }),
      ),
    ).toBe(RUNTIME_SESSION_FAILURE_KINDS.MANUAL);
    expect(classifyRuntimeSessionFailure(normalized())).toBe(
      RUNTIME_SESSION_FAILURE_KINDS.MANUAL,
    );
  });
});

describe("canScheduleReconnectRetry", () => {
  it("allows the retry only for TRANSIENT while visible and online", () => {
    const transient = RUNTIME_SESSION_FAILURE_KINDS.TRANSIENT;

    expect(
      canScheduleReconnectRetry(transient, { hidden: false, offline: false }),
    ).toBe(true);
    expect(
      canScheduleReconnectRetry(transient, { hidden: true, offline: false }),
    ).toBe(false);
    expect(
      canScheduleReconnectRetry(transient, { hidden: false, offline: true }),
    ).toBe(false);
    expect(
      canScheduleReconnectRetry(RUNTIME_SESSION_FAILURE_KINDS.MANUAL, {
        hidden: false,
        offline: false,
      }),
    ).toBe(false);
  });
});

describe("resolveDegradedConnectionState", () => {
  it("offline browsers report OFFLINE, otherwise RECONNECTING", () => {
    expect(resolveDegradedConnectionState(true)).toBe(
      RACE_PLAYER_CONNECTION_STATES.OFFLINE,
    );
    expect(resolveDegradedConnectionState(false)).toBe(
      RACE_PLAYER_CONNECTION_STATES.RECONNECTING,
    );
  });
});
