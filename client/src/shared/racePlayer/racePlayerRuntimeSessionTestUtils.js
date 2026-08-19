import { afterEach, beforeEach, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useRacePlayerRuntimeSession from "./useRacePlayerRuntimeSession";
import {
  RACE_PLAYER_RECONNECT_OUTCOMES,
  RACE_PLAYER_STATUSES,
  RACE_STATUSES,
} from "../../constants/raceStatusConstants";

export function activeReconnectResponse(overrides = {}) {
  return {
    outcome: RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECTED,
    online: true,
    canContinueRace: true,
    playerStatus: RACE_PLAYER_STATUSES.RACING,
    raceStatus: RACE_STATUSES.IN_PROGRESS,
    ...overrides,
  };
}

export function heartbeatAck() {
  return { raceId: 7, racePlayerId: 21, heartbeatAt: "2026-08-19T12:00:00" };
}

// Axios-shaped failures the real normalizeApiError understands.
export function networkFailure() {
  return { request: {}, message: "Network Error" };
}

export function serverFailure(errorName, status = 409) {
  return { response: { status, data: { error: errorName, code: 1 } } };
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

export async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

export async function advance(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

export function setDocumentVisibility(visibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibilityState,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

export function setNavigatorOnLine(onLine) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => onLine,
  });
}

export async function renderResolvedActiveSession(reconnectRacePlayerMock) {
  reconnectRacePlayerMock.mockResolvedValueOnce(activeReconnectResponse());
  const view = renderHook(() => useRacePlayerRuntimeSession());
  await flush();
  expect(view.result.current.hasResolvedSession).toBe(true);
  return view;
}

// Fake timers per test; afterEach restores the jsdom prototype getters the
// visibility/onLine overrides shadow.
export function setupRuntimeSessionSuite() {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    delete document.visibilityState;
    delete window.navigator.onLine;
  });
}
