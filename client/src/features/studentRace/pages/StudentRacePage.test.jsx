import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../i18n/i18n";
import StudentRacePage from "./StudentRacePage";
import {
  getCurrentQuestion,
  getRaceState,
  heartbeatRacePlayer,
  reconnectRacePlayer,
  submitAnswer,
} from "../../../api/racePlayerApi";
import { RACE_PLAYER_RUNTIME_SESSION_CONFIG } from "../../../shared/racePlayer/racePlayerRuntimeSessionConfig";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";

vi.mock("../../../api/racePlayerApi", () => ({
  joinRace: vi.fn(),
  getRaceState: vi.fn(),
  getCurrentQuestion: vi.fn(),
  submitAnswer: vi.fn(),
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

vi.mock("../pixi/PixiStudentRaceCanvas", () => ({
  default: () => <div data-testid="race-canvas" />,
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

function activeReconnectResponse() {
  return {
    outcome: "RECONNECTED",
    online: true,
    canContinueRace: true,
    playerStatus: "RACING",
    raceStatus: "IN_PROGRESS",
  };
}

function reconnectRequiredFailure() {
  return {
    response: {
      status: 409,
      data: {
        error: "RACE_PLAYER_RECONNECT_REQUIRED",
        code: 3027,
      },
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function playingRaceStateResponse() {
  const response = waitingRaceStateResponse();
  return {
    ...response,
    snapshot: {
      ...response.snapshot,
      raceStatus: "IN_PROGRESS",
      playerStatus: "RACING",
      movementUnitsPerSecond: 2,
    },
  };
}

function currentQuestionResponse() {
  return {
    questionId: 17,
    questionText: "3 + 4 = ?",
    timeLimitSeconds: 90,
    serverTimeEpochMs: Date.now(),
    expiresAtEpochMs: Date.now() + 90000,
    choices: [
      { choiceId: 1, choiceText: "7", displayOrder: 1 },
      { choiceId: 2, choiceText: "8", displayOrder: 2 },
    ],
  };
}

function setDocumentVisibility(value) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
  document.dispatchEvent(new Event("visibilitychange"));
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
    reconnectRacePlayer.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(
      await screen.findByText(i18n.t("studentRace:status.loadingTitle")),
    ).toBeInTheDocument();
    expect(reconnectRacePlayer).toHaveBeenCalledTimes(1);
    expect(getRaceState).not.toHaveBeenCalled();
  });

  it("hidden stops gameplay calls and visible reconnects before resuming them", async () => {
    vi.useFakeTimers();
    try {
      reconnectRacePlayer.mockResolvedValue({
        outcome: "RECONNECTED",
        online: true,
        canContinueRace: true,
        playerStatus: "RACING",
        raceStatus: "IN_PROGRESS",
      });
      getRaceState.mockResolvedValue(playingRaceStateResponse());
      getCurrentQuestion.mockResolvedValue(currentQuestionResponse());
      heartbeatRacePlayer.mockResolvedValue({});

      renderPage();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(getRaceState).toHaveBeenCalledTimes(1);
      expect(getCurrentQuestion).toHaveBeenCalledTimes(1);

      await act(async () => {
        setDocumentVisibility("hidden");
      });

      const raceStateCalls = getRaceState.mock.calls.length;
      const questionCalls = getCurrentQuestion.mock.calls.length;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(
          Math.max(
            STUDENT_RACE_CONFIG.raceStatePollMs * 4,
            RACE_PLAYER_RUNTIME_SESSION_CONFIG.heartbeatIntervalMs * 2,
          ),
        );
      });

      expect(heartbeatRacePlayer).not.toHaveBeenCalled();
      expect(getRaceState).toHaveBeenCalledTimes(raceStateCalls);
      expect(getCurrentQuestion).toHaveBeenCalledTimes(questionCalls);
      expect(screen.getByRole("button", { name: "7" })).toBeDisabled();
      expect(submitAnswer).not.toHaveBeenCalled();

      let resolveReconnect;
      reconnectRacePlayer.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveReconnect = resolve;
        }),
      );

      await act(async () => {
        setDocumentVisibility("visible");
      });

      expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);
      expect(getRaceState).toHaveBeenCalledTimes(raceStateCalls);
      expect(getCurrentQuestion).toHaveBeenCalledTimes(questionCalls);

      await act(async () => {
        resolveReconnect({
          outcome: "RECONNECTED",
          online: true,
          canContinueRace: true,
          playerStatus: "RACING",
          raceStatus: "IN_PROGRESS",
        });
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(getRaceState.mock.calls.length).toBeGreaterThan(raceStateCalls);
      expect(getCurrentQuestion.mock.calls.length).toBeGreaterThan(questionCalls);
    } finally {
      setDocumentVisibility("visible");
      vi.useRealTimers();
    }
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

describe("StudentRacePage — reconnect-required recovery", () => {
  it("race-state reconnect-required triggers reconnect before authoritative resync", async () => {
    const recovery = deferred();
    reconnectRacePlayer
      .mockResolvedValueOnce(activeReconnectResponse())
      .mockReturnValueOnce(recovery.promise);
    getRaceState
      .mockRejectedValueOnce(reconnectRequiredFailure())
      .mockResolvedValue(playingRaceStateResponse());
    getCurrentQuestion.mockResolvedValue(currentQuestionResponse());

    renderPage();

    await waitFor(() => {
      expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);
    });
    expect(getRaceState).toHaveBeenCalledTimes(1);
    expect(getCurrentQuestion).not.toHaveBeenCalled();

    await act(async () => {
      recovery.resolve(activeReconnectResponse());
    });

    await waitFor(() => {
      expect(getRaceState).toHaveBeenCalledTimes(2);
      expect(getCurrentQuestion).toHaveBeenCalledTimes(1);
    });
  });

  it("current-question reconnect-required triggers runtime reconnect", async () => {
    const recovery = deferred();
    reconnectRacePlayer
      .mockResolvedValueOnce(activeReconnectResponse())
      .mockReturnValueOnce(recovery.promise);
    getRaceState.mockResolvedValue(playingRaceStateResponse());
    getCurrentQuestion
      .mockRejectedValueOnce(reconnectRequiredFailure())
      .mockResolvedValue(currentQuestionResponse());

    renderPage();

    await waitFor(() => {
      expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);
    });
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1);

    await act(async () => {
      recovery.resolve(activeReconnectResponse());
    });

    await waitFor(() => {
      expect(getCurrentQuestion).toHaveBeenCalledTimes(2);
      expect(getRaceState.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it("answer reconnect-required reconnects without retrying the answer POST", async () => {
    const recovery = deferred();
    reconnectRacePlayer
      .mockResolvedValueOnce(activeReconnectResponse())
      .mockReturnValueOnce(recovery.promise);
    getRaceState.mockResolvedValue(playingRaceStateResponse());
    getCurrentQuestion.mockResolvedValue(currentQuestionResponse());
    submitAnswer.mockRejectedValueOnce(reconnectRequiredFailure());

    renderPage();

    const choice = await screen.findByRole("button", { name: "7" });
    fireEvent.click(choice);

    await waitFor(() => {
      expect(submitAnswer).toHaveBeenCalledTimes(1);
      expect(reconnectRacePlayer).toHaveBeenCalledTimes(2);
    });
    expect(choice).toBeDisabled();

    await act(async () => {
      recovery.resolve(activeReconnectResponse());
    });

    await waitFor(() => {
      expect(getRaceState.mock.calls.length).toBeGreaterThan(1);
      expect(getCurrentQuestion.mock.calls.length).toBeGreaterThan(1);
    });
    expect(submitAnswer).toHaveBeenCalledTimes(1);
  });
});
