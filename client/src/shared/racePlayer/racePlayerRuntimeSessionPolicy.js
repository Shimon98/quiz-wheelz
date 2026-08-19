import { RACE_PLAYER_RECONNECT_OUTCOMES } from "../../constants/raceStatusConstants.js";
import {
  isRacePlayerSessionError,
  isReconnectWindowExpiredError,
  isTransientError,
} from "../../errors/errorChecks.js";
import { RACE_PLAYER_CONNECTION_STATES } from "./racePlayerRuntimeSessionConfig.js";

/*
 * Pure runtime-session decisions (C1-05) — no React, no timers. The expired
 * reconnect window arrives as an OUTCOME from reconnect but as an ERROR
 * from heartbeat; both classify TERMINAL.
 */

const TERMINAL_RECONNECT_OUTCOMES = new Set([
  RACE_PLAYER_RECONNECT_OUTCOMES.PLAYER_FINISHED,
  RACE_PLAYER_RECONNECT_OUTCOMES.RACE_FINISHED,
  RACE_PLAYER_RECONNECT_OUTCOMES.ALREADY_DISCONNECTED,
  RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECT_WINDOW_EXPIRED,
]);

export function isTerminalReconnectOutcome(outcome) {
  return TERMINAL_RECONNECT_OUTCOMES.has(outcome);
}

export const RUNTIME_SESSION_FAILURE_KINDS = Object.freeze({
  TERMINAL: "TERMINAL", // grace window expired
  SESSION: "SESSION", // dead identity — gate territory
  TRANSIENT: "TRANSIENT", // network/5xx — retry may work
  MANUAL: "MANUAL", // contract/unknown — manual reconnect only
});

export function classifyRuntimeSessionFailure(normalizedError) {
  if (isReconnectWindowExpiredError(normalizedError)) {
    return RUNTIME_SESSION_FAILURE_KINDS.TERMINAL;
  }

  if (isRacePlayerSessionError(normalizedError)) {
    return RUNTIME_SESSION_FAILURE_KINDS.SESSION;
  }

  if (isTransientError(normalizedError)) {
    return RUNTIME_SESSION_FAILURE_KINDS.TRANSIENT;
  }

  return RUNTIME_SESSION_FAILURE_KINDS.MANUAL;
}

export function canScheduleReconnectRetry(failureKind, { hidden, offline }) {
  return (
    failureKind === RUNTIME_SESSION_FAILURE_KINDS.TRANSIENT &&
    !hidden &&
    !offline
  );
}

export function resolveDegradedConnectionState(offline) {
  return offline
    ? RACE_PLAYER_CONNECTION_STATES.OFFLINE
    : RACE_PLAYER_CONNECTION_STATES.RECONNECTING;
}
