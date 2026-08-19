import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useRacePlayerRuntimeSession from "./useRacePlayerRuntimeSession";
import {
  RACE_PLAYER_CONNECTION_STATES,
  RACE_PLAYER_RUNTIME_SESSION_CONFIG,
} from "./racePlayerRuntimeSessionConfig";
import {
  RACE_PLAYER_RECONNECT_OUTCOMES,
  RACE_PLAYER_STATUSES,
  RACE_STATUSES,
} from "../../constants/raceStatusConstants";
import {
  heartbeatRacePlayer,
  reconnectRacePlayer,
} from "../../api/racePlayerApi";

/*
 * C1-05 lifecycle suite — the thin API wrappers are the only mock boundary;
 * mapper, error normalization, timers and browser events run for real.
 */

vi.mock("../../api/racePlayerApi", () => ({
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

const { heartbeatIntervalMs, reconnectRetryMs } =
  RACE_PLAYER_RUNTIME_SESSION_CONFIG;

function activeReconnectResponse(overrides = {}) {
  return {
    outcome: RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECTED,
    online: true,
    canContinueRace: true,
    playerStatus: RACE_PLAYER_STATUSES.RACING,
    raceStatus: RACE_STATUSES.IN_PROGRESS,
    ...overrides,
  };
}

function heartbeatAck() {
  return { raceId: 7, racePlayerId: 21, heartbeatAt: "2026-08-19T12:00:00" };
}

// Axios-shaped failures the real normalizeApiError understands.
function networkFailure() {
  return { request: {}, message: "Network Error" };
}

function serverFailure(errorName, status = 409) {
  return { response: { status, data: { error: errorName, code: 1 } } };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

// Flush pending microtasks/zero-delay work under fake timers.
async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function advance(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function renderResolvedActiveSession() {
  reconnectRacePlayer.mockResolvedValueOnce(activeReconnectResponse());
  const view = renderHook(() => useRacePlayerRuntimeSession());
  await flush();
  expect(view.result.current.hasResolvedSession).toBe(true);
  return view;
}

function setDocumentVisibility(visibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => visibilityState,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function setNavigatorOnLine(onLine) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => onLine,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  // Restore the jsdom prototype getters shadowed by the tests.
  delete document.visibilityState;
  delete window.navigator.onLine;
});

describe("useRacePlayerRuntimeSession — initial entry", () => {
  it("resolves reconnect first and sends no heartbeat before resolution", async () => {
    const pending = deferred();
    reconnectRacePlayer.mockReturnValueOnce(pending.promise);

    const { result } = renderHook(() => useRacePlayerRuntimeSession());
    await flush();

    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(result.current.hasResolvedSession).toBe(false);
    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.CONNECTING,
    );

    await advance(heartbeatIntervalMs * 2);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve(activeReconnectResponse());
    });
    expect(result.current.hasResolvedSession).toBe(true);
  });

  it("issues exactly one initial reconnect under StrictMode double effects", async () => {
    reconnectRacePlayer.mockResolvedValue(activeReconnectResponse());

    renderHook(() => useRacePlayerRuntimeSession(), { wrapper: StrictMode });
    await flush();

    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
  });
});

describe("useRacePlayerRuntimeSession — resolved session and heartbeat", () => {
  it("an active RECONNECTED resolution opens the session and starts the cadence", async () => {
    const { result } = await renderResolvedActiveSession();

    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.CONNECTED,
    );
    expect(result.current.terminalOutcome).toBeNull();
    expect(result.current.isGameplayConnectionReady).toBe(true);
    expect(result.current.resyncToken).toBe(1);

    heartbeatRacePlayer.mockResolvedValue(heartbeatAck());
    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);
    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(2);
  });

  it("WAITING_FOR_RACE is a live session and heartbeats too", async () => {
    reconnectRacePlayer.mockResolvedValueOnce(
      activeReconnectResponse({
        outcome: RACE_PLAYER_RECONNECT_OUTCOMES.WAITING_FOR_RACE,
        canContinueRace: false,
        playerStatus: RACE_PLAYER_STATUSES.WAITING,
        raceStatus: RACE_STATUSES.WAITING_FOR_PLAYERS,
      }),
    );
    heartbeatRacePlayer.mockResolvedValue(heartbeatAck());

    const { result } = renderHook(() => useRacePlayerRuntimeSession());
    await flush();

    expect(result.current.hasResolvedSession).toBe(true);
    expect(result.current.terminalOutcome).toBeNull();

    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);
  });

  it("heartbeat is single-flight: a slow heartbeat is never overlapped", async () => {
    const { result } = await renderResolvedActiveSession();

    const slowHeartbeat = deferred();
    heartbeatRacePlayer.mockReturnValueOnce(slowHeartbeat.promise);

    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);

    // The next tick fires while the first is still in flight — skipped.
    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);

    heartbeatRacePlayer.mockResolvedValue(heartbeatAck());
    await act(async () => {
      slowHeartbeat.resolve(heartbeatAck());
    });
    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(2);
    expect(result.current.isGameplayConnectionReady).toBe(true);
  });
});

describe("useRacePlayerRuntimeSession — browser connectivity", () => {
  it("offline pauses heartbeat and reports OFFLINE without inventing server truth", async () => {
    const { result } = await renderResolvedActiveSession();

    setNavigatorOnLine(false);
    await act(async () => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.OFFLINE,
    );
    // Still a resolved session — no invented DISCONNECTED, no error.
    expect(result.current.hasResolvedSession).toBe(true);
    expect(result.current.terminalOutcome).toBeNull();
    expect(result.current.error).toBeNull();

    await advance(heartbeatIntervalMs * 2);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
  });

  it("online triggers an immediate reconnect, not a heartbeat", async () => {
    const { result } = await renderResolvedActiveSession();
    setNavigatorOnLine(false);
    await act(async () => {
      window.dispatchEvent(new Event("offline"));
    });

    setNavigatorOnLine(true);
    reconnectRacePlayer.mockResolvedValueOnce(activeReconnectResponse());
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    await flush();

    expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.CONNECTED,
    );
    expect(result.current.resyncToken).toBe(2);
  });

  it("a hidden document pauses the heartbeat cadence without any server call", async () => {
    await renderResolvedActiveSession();

    await act(async () => {
      setDocumentVisibility("hidden");
    });

    await advance(heartbeatIntervalMs * 3);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
  });

  it("returning to a visible document reconnects immediately", async () => {
    await renderResolvedActiveSession();
    await act(async () => {
      setDocumentVisibility("hidden");
    });

    reconnectRacePlayer.mockResolvedValueOnce(activeReconnectResponse());
    await act(async () => {
      setDocumentVisibility("visible");
    });
    await flush();

    expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);
  });
});

describe("useRacePlayerRuntimeSession — failures and recovery", () => {
  it("a transient heartbeat failure hands recovery to the reconnect command", async () => {
    const { result } = await renderResolvedActiveSession();

    heartbeatRacePlayer.mockRejectedValueOnce(networkFailure());
    const recovery = deferred();
    reconnectRacePlayer.mockReturnValueOnce(recovery.promise);

    await advance(heartbeatIntervalMs);

    // The failed heartbeat coalesced into one trailing reconnect.
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);
    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.RECONNECTING,
    );
    expect(result.current.isGameplayConnectionReady).toBe(false);

    await act(async () => {
      recovery.resolve(activeReconnectResponse());
    });
    expect(result.current.isGameplayConnectionReady).toBe(true);
    expect(result.current.resyncToken).toBe(2);
  });

  it("a transient reconnect failure schedules exactly one conservative retry", async () => {
    reconnectRacePlayer.mockRejectedValueOnce(networkFailure());

    const { result } = renderHook(() => useRacePlayerRuntimeSession());
    await flush();

    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(result.current.error).not.toBeNull();
    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.RECONNECTING,
    );

    const pendingRetry = deferred();
    reconnectRacePlayer.mockReturnValueOnce(pendingRetry.promise);

    await advance(reconnectRetryMs - 1);
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);

    await advance(1);
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);

    // No second timer stacks behind the in-flight retry.
    await advance(reconnectRetryMs * 2);
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);

    await act(async () => {
      pendingRetry.resolve(activeReconnectResponse());
    });
    expect(result.current.hasResolvedSession).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("a session-invalid reconnect failure stops automatic retries for the gate", async () => {
    reconnectRacePlayer.mockRejectedValueOnce(
      serverFailure("INVALID_RACE_PLAYER_TOKEN", 401),
    );

    const { result } = renderHook(() => useRacePlayerRuntimeSession());
    await flush();

    expect(result.current.error?.errorName).toBe("INVALID_RACE_PLAYER_TOKEN");
    expect(result.current.hasResolvedSession).toBe(false);

    await advance(reconnectRetryMs * 3);
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
  });

  it("heartbeat RECONNECT_WINDOW_EXPIRED resolves terminal — not a session error", async () => {
    const { result } = await renderResolvedActiveSession();

    heartbeatRacePlayer.mockRejectedValueOnce(
      serverFailure("RACE_PLAYER_RECONNECT_WINDOW_EXPIRED", 409),
    );
    await advance(heartbeatIntervalMs);

    expect(result.current.terminalOutcome).toBe(
      RACE_PLAYER_RECONNECT_OUTCOMES.RECONNECT_WINDOW_EXPIRED,
    );
    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.CONNECTED,
    );
    expect(result.current.error).toBeNull();
    expect(result.current.resyncToken).toBe(2);
    expect(result.current.isGameplayConnectionReady).toBe(false);

    await advance(heartbeatIntervalMs * 2);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);
  });

  it("a terminal reconnect outcome resolves the session without a heartbeat loop", async () => {
    reconnectRacePlayer.mockResolvedValueOnce(
      activeReconnectResponse({
        outcome: RACE_PLAYER_RECONNECT_OUTCOMES.ALREADY_DISCONNECTED,
        online: false,
        canContinueRace: false,
        playerStatus: RACE_PLAYER_STATUSES.DISCONNECTED,
      }),
    );

    const { result } = renderHook(() => useRacePlayerRuntimeSession());
    await flush();

    expect(result.current.hasResolvedSession).toBe(true);
    expect(result.current.terminalOutcome).toBe(
      RACE_PLAYER_RECONNECT_OUTCOMES.ALREADY_DISCONNECTED,
    );
    expect(result.current.resyncToken).toBe(1);
    expect(result.current.isGameplayConnectionReady).toBe(false);

    await advance(heartbeatIntervalMs * 2);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();

    // Terminal is final: visibility returns do not restart reconnect loops.
    await act(async () => {
      setDocumentVisibility("hidden");
    });
    await act(async () => {
      setDocumentVisibility("visible");
    });
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
  });
});

describe("useRacePlayerRuntimeSession — visibility readiness", () => {
  it("a hidden document is not gameplay-ready", async () => {
    const { result } = await renderResolvedActiveSession();
    expect(result.current.isGameplayConnectionReady).toBe(true);

    await act(async () => {
      setDocumentVisibility("hidden");
    });

    expect(result.current.isGameplayConnectionReady).toBe(false);
  });

  it("a visible return stays not-ready until the reconnect resolves", async () => {
    const { result } = await renderResolvedActiveSession();
    await act(async () => {
      setDocumentVisibility("hidden");
    });

    const pending = deferred();
    reconnectRacePlayer.mockReturnValueOnce(pending.promise);
    await act(async () => {
      setDocumentVisibility("visible");
    });

    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.RECONNECTING,
    );
    expect(result.current.isGameplayConnectionReady).toBe(false);

    await act(async () => {
      pending.resolve(activeReconnectResponse());
    });
    expect(result.current.isGameplayConnectionReady).toBe(true);
  });
});

describe("useRacePlayerRuntimeSession — presence stop", () => {
  it("stopPresence halts heartbeat and automatic reconnect triggers", async () => {
    const { result } = await renderResolvedActiveSession();
    heartbeatRacePlayer.mockResolvedValue(heartbeatAck());
    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.stopPresence();
    });

    await advance(heartbeatIntervalMs * 3);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);

    await act(async () => {
      setDocumentVisibility("hidden");
    });
    await act(async () => {
      setDocumentVisibility("visible");
    });
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(result.current.isGameplayConnectionReady).toBe(false);
  });
});

describe("useRacePlayerRuntimeSession — manual failure recovery", () => {
  it("a malformed later reconnect waits for manual retry and recovers", async () => {
    const { result } = await renderResolvedActiveSession();

    reconnectRacePlayer.mockResolvedValueOnce({ outcome: "GARBAGE" });
    await act(async () => {
      setDocumentVisibility("hidden");
    });
    await act(async () => {
      setDocumentVisibility("visible");
    });
    await flush();

    expect(result.current.error).not.toBeNull();
    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.RECONNECTING,
    );

    const callsAfterFailure = reconnectRacePlayer.mock.calls.length;
    await advance(reconnectRetryMs * 3);
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(callsAfterFailure);

    reconnectRacePlayer.mockResolvedValueOnce(activeReconnectResponse());
    await act(async () => {
      result.current.reconnectNow();
    });
    await flush();

    expect(result.current.error).toBeNull();
    expect(result.current.isGameplayConnectionReady).toBe(true);
  });
});

describe("useRacePlayerRuntimeSession — cleanup and leave safety", () => {
  it("a reconnect rejecting after unmount schedules nothing", async () => {
    const pending = deferred();
    reconnectRacePlayer.mockReturnValueOnce(pending.promise);

    const { unmount } = renderHook(() => useRacePlayerRuntimeSession());
    await flush();
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      pending.reject(networkFailure());
    });
    await advance(reconnectRetryMs * 3);

    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
  });

  it("a heartbeat rejecting after unmount launches no trailing reconnect", async () => {
    const { unmount } = await renderResolvedActiveSession();

    const slowHeartbeat = deferred();
    heartbeatRacePlayer.mockReturnValueOnce(slowHeartbeat.promise);
    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      slowHeartbeat.reject(networkFailure());
    });
    await advance(reconnectRetryMs * 3 + heartbeatIntervalMs * 2);

    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);
  });

  it("unmount/pagehide/hidden issue NO runtime-session command (and never leave)", async () => {
    const { unmount } = await renderResolvedActiveSession();

    const reconnectCalls = reconnectRacePlayer.mock.calls.length;
    const heartbeatCalls = heartbeatRacePlayer.mock.calls.length;

    // pagehide + hidden while mounted: local pause only.
    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
      setDocumentVisibility("hidden");
    });

    unmount();
    await advance(heartbeatIntervalMs * 4 + reconnectRetryMs * 4);
    window.dispatchEvent(new Event("online"));
    document.dispatchEvent(new Event("visibilitychange"));
    await advance(heartbeatIntervalMs);

    // No timer/listener survived unmount; leave has no client wrapper at all.
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(reconnectCalls);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(heartbeatCalls);
  });
});
