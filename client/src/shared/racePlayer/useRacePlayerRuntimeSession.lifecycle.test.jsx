import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useRacePlayerRuntimeSession from "./useRacePlayerRuntimeSession";
import {
  RACE_PLAYER_CONNECTION_STATES,
  RACE_PLAYER_RUNTIME_SESSION_CONFIG,
} from "./racePlayerRuntimeSessionConfig";
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
  setDocumentVisibility,
  setNavigatorOnLine,
  setupRuntimeSessionSuite,
} from "./racePlayerRuntimeSessionTestUtils";

vi.mock("../../api/racePlayerApi", () => ({
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

const { heartbeatIntervalMs, reconnectRetryMs } =
  RACE_PLAYER_RUNTIME_SESSION_CONFIG;

setupRuntimeSessionSuite();

describe("browser connectivity", () => {
  it("offline pauses heartbeat and reports OFFLINE without inventing server truth", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);

    setNavigatorOnLine(false);
    await act(async () => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.OFFLINE,
    );
    expect(result.current.hasResolvedSession).toBe(true);
    expect(result.current.terminalOutcome).toBeNull();
    expect(result.current.error).toBeNull();

    await advance(heartbeatIntervalMs * 2);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
  });

  it("online triggers an immediate reconnect, not a heartbeat", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);
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
});

describe("document visibility", () => {
  it("a hidden document pauses the heartbeat cadence without any server call", async () => {
    await renderResolvedActiveSession(reconnectRacePlayer);

    await act(async () => {
      setDocumentVisibility("hidden");
    });

    await advance(heartbeatIntervalMs * 3);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
  });

  it("returning to a visible document reconnects immediately", async () => {
    await renderResolvedActiveSession(reconnectRacePlayer);
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

  it("a hidden document is not gameplay-ready", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);
    expect(result.current.isGameplayConnectionReady).toBe(true);

    await act(async () => {
      setDocumentVisibility("hidden");
    });

    expect(result.current.isGameplayConnectionReady).toBe(false);
  });

  it("a visible return stays not-ready until the reconnect resolves", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);
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

describe("cleanup and leave safety", () => {
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
    const { unmount } = await renderResolvedActiveSession(reconnectRacePlayer);

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
    const { unmount } = await renderResolvedActiveSession(reconnectRacePlayer);

    const reconnectCalls = reconnectRacePlayer.mock.calls.length;
    const heartbeatCalls = heartbeatRacePlayer.mock.calls.length;

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
