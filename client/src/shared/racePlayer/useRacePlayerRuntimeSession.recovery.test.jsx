import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useRacePlayerRuntimeSession from "./useRacePlayerRuntimeSession";
import {
  RACE_PLAYER_CONNECTION_STATES,
  RACE_PLAYER_RUNTIME_SESSION_CONFIG,
} from "./racePlayerRuntimeSessionConfig";
import {
  RACE_PLAYER_RECONNECT_OUTCOMES,
  RACE_PLAYER_STATUSES,
} from "../../constants/raceStatusConstants";
import {
  heartbeatRacePlayer,
  reconnectRacePlayer,
} from "../../api/racePlayerApi";
import {
  activeReconnectResponse,
  advance,
  deferred,
  flush,
  networkFailure,
  renderResolvedActiveSession,
  serverFailure,
  setDocumentVisibility,
  setupRuntimeSessionSuite,
} from "./racePlayerRuntimeSessionTestUtils";

vi.mock("../../api/racePlayerApi", () => ({
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

const { heartbeatIntervalMs, reconnectRetryMs } =
  RACE_PLAYER_RUNTIME_SESSION_CONFIG;

setupRuntimeSessionSuite();

describe("transient failures", () => {
  it("a transient heartbeat failure hands recovery to the reconnect command", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);

    heartbeatRacePlayer.mockRejectedValueOnce(networkFailure());
    const recovery = deferred();
    reconnectRacePlayer.mockReturnValueOnce(recovery.promise);

    await advance(heartbeatIntervalMs);

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

    await advance(reconnectRetryMs * 2);
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);

    await act(async () => {
      pendingRetry.resolve(activeReconnectResponse());
    });
    expect(result.current.hasResolvedSession).toBe(true);
    expect(result.current.error).toBeNull();
  });
});

describe("session and terminal resolutions", () => {
  it("a session-invalid reconnect failure stops automatic retries for the gate", async () => {
    reconnectRacePlayer.mockRejectedValueOnce(
      serverFailure("INVALID_RACE_PLAYER_TOKEN", 401),
    );

    const { result } = renderHook(() => useRacePlayerRuntimeSession());
    await flush();

    expect(result.current.error?.errorName).toBe("INVALID_RACE_PLAYER_TOKEN");
    expect(result.current.hasResolvedSession).toBe(false);
    // The server answered (CONNECTED) but an unresolved session with an
    // error must never be gameplay-ready.
    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.CONNECTED,
    );
    expect(result.current.isGameplayConnectionReady).toBe(false);

    await advance(reconnectRetryMs * 3);
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
  });

  it("heartbeat RECONNECT_WINDOW_EXPIRED resolves terminal — not a session error", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);

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

    await act(async () => {
      setDocumentVisibility("hidden");
    });
    await act(async () => {
      setDocumentVisibility("visible");
    });
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
  });
});

describe("manual failure recovery", () => {
  it("a malformed later reconnect waits for manual retry and recovers", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);

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
    expect(result.current.isGameplayConnectionReady).toBe(false);

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
