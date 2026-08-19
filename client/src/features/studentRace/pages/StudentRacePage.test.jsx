import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../i18n/i18n";
import StudentRacePage from "./StudentRacePage";
import {
  getRaceState,
  heartbeatRacePlayer,
  reconnectRacePlayer,
} from "../../../api/racePlayerApi";
import { RACE_PLAYER_RUNTIME_SESSION_CONFIG } from "../../../shared/racePlayer/racePlayerRuntimeSessionConfig";

/*
 * C1-05 gate: route entry must resolve reconnect BEFORE any gameplay
 * request. API wrappers are the only mock boundary.
 */

vi.mock("../../../api/racePlayerApi", () => ({
  joinRace: vi.fn(),
  getRaceState: vi.fn(),
  getCurrentQuestion: vi.fn(),
  submitAnswer: vi.fn(),
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

function waitingReconnectResponse() {
  return {
    outcome: "WAITING_FOR_RACE",
    online: true,
    canContinueRace: false,
    playerStatus: "WAITING",
    raceStatus: "WAITING_FOR_PLAYERS",
  };
}

function waitingRaceStateResponse() {
  return {
    raceId: 7,
    raceTitle: "Jungle Cup",
    roomCode: "ABC123",
    snapshot: {
      raceStatus: "WAITING_FOR_PLAYERS",
      playerStatus: "WAITING",
      playerFinished: false,
      raceFinished: false,
      totalDistance: 1000,
      score: 0,
      position: 0,
      speed: 0,
      streak: 0,
      highestStreak: 0,
      snapshotAtEpochMs: 1755600000000,
      movementUnitsPerSecond: 0,
    },
  };
}

function renderPage() {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <StudentRacePage />
      </MemoryRouter>
    </MantineProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StudentRacePage — session-first gating", () => {
  it("starts no race-state request while the initial reconnect is unresolved", async () => {
    // A reconnect that never resolves keeps the session boundary closed.
    reconnectRacePlayer.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(
      await screen.findByText(i18n.t("studentRace:status.loadingTitle")),
    ).toBeInTheDocument();
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(getRaceState).not.toHaveBeenCalled();
  });

  it("mounts the race-state flow only after the reconnect resolution", async () => {
    reconnectRacePlayer.mockResolvedValue(waitingReconnectResponse());
    getRaceState.mockResolvedValue(waitingRaceStateResponse());

    renderPage();

    expect(
      await screen.findByText(i18n.t("studentRace:status.waitingTitle")),
    ).toBeInTheDocument();
    expect(getRaceState).toHaveBeenCalled();
  });

  it("an authoritative FINISHED view stops the heartbeat", async () => {
    vi.useFakeTimers();
    try {
      reconnectRacePlayer.mockResolvedValue({
        outcome: "RECONNECTED",
        online: true,
        canContinueRace: true,
        playerStatus: "RACING",
        raceStatus: "IN_PROGRESS",
      });
      const finished = waitingRaceStateResponse();
      finished.snapshot = {
        ...finished.snapshot,
        raceStatus: "FINISHED",
        playerStatus: "FINISHED",
        playerFinished: true,
        raceFinished: true,
        position: 1000,
      };
      getRaceState.mockResolvedValue(finished);
      heartbeatRacePlayer.mockResolvedValue({});

      renderPage();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(
        screen.getByText(i18n.t("studentRace:status.finishedTitle")),
      ).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(
          RACE_PLAYER_RUNTIME_SESSION_CONFIG.heartbeatIntervalMs * 2,
        );
      });
      expect(heartbeatRacePlayer).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("offers reconnect retry when the initial reconnect fails", async () => {
    reconnectRacePlayer.mockRejectedValueOnce({
      request: {},
      message: "Network Error",
    });

    renderPage();

    expect(
      await screen.findByText(i18n.t("studentRace:status.errorTitle")),
    ).toBeInTheDocument();
    expect(getRaceState).not.toHaveBeenCalled();
  });
});
