import { describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";

import { RACE_PLAYER_RUNTIME_SESSION_CONFIG } from "./racePlayerRuntimeSessionConfig";
import {
  heartbeatRacePlayer,
  reconnectRacePlayer,
} from "../../api/racePlayerApi";
import {
  advance,
  deferred,
  heartbeatAck,
  renderResolvedActiveSession,
  setDocumentVisibility,
  setNavigatorOnLine,
  setupRuntimeSessionSuite,
} from "./racePlayerRuntimeSessionTestUtils";

vi.mock("../../api/racePlayerApi", () => ({
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

const { heartbeatIntervalMs } = RACE_PLAYER_RUNTIME_SESSION_CONFIG;

setupRuntimeSessionSuite();

describe("heartbeat", () => {
  it("runs on the configured cadence for a live session", async () => {
    await renderResolvedActiveSession(reconnectRacePlayer);
    heartbeatRacePlayer.mockResolvedValue(heartbeatAck());

    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);
    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(2);
  });

  it("does not overlap a slow heartbeat", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);

    const slowHeartbeat = deferred();
    heartbeatRacePlayer.mockReturnValueOnce(slowHeartbeat.promise);

    await advance(heartbeatIntervalMs);
    expect(heartbeatRacePlayer).toHaveBeenCalledTimes(1);

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

describe("stopPresence", () => {
  it("allows passive finish requests across offline/online without reviving gameplay", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);
    await act(async () => { result.current.stopPresence(); });
    expect(result.current.isGameplayConnectionReady).toBe(false);
    expect(result.current.isPassiveRaceRequestReady).toBe(true);
    await act(async () => {
      setNavigatorOnLine(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isPassiveRaceRequestReady).toBe(false);
    await act(async () => {
      setNavigatorOnLine(true);
      window.dispatchEvent(new Event("online"));
      setDocumentVisibility("hidden");
    });
    expect(result.current.isPassiveRaceRequestReady).toBe(false);
    await act(async () => { setDocumentVisibility("visible"); });
    expect(result.current.isPassiveRaceRequestReady).toBe(true);
    await advance(heartbeatIntervalMs * 2);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
  });
  it("halts heartbeat and automatic reconnect triggers", async () => {
    const { result } = await renderResolvedActiveSession(reconnectRacePlayer);
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
