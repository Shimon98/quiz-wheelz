import { StrictMode } from "react";
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
  RACE_STATUSES,
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
  heartbeatAck,
  renderResolvedActiveSession,
  setupRuntimeSessionSuite,
} from "./racePlayerRuntimeSessionTestUtils";

vi.mock("../../api/racePlayerApi", () => ({
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

const { heartbeatIntervalMs } = RACE_PLAYER_RUNTIME_SESSION_CONFIG;

setupRuntimeSessionSuite();

describe("initial entry", () => {
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

describe("session resolution", () => {
  it("an active RECONNECTED resolution opens a gameplay-ready session", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);

    expect(result.current.connectionState).toBe(
      RACE_PLAYER_CONNECTION_STATES.CONNECTED,
    );
    expect(result.current.terminalOutcome).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isGameplayConnectionReady).toBe(true);
    expect(result.current.resyncToken).toBe(1);
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
});
