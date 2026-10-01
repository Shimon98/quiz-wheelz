import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import StudentRacePage from "../StudentRacePage";
import {
  getCurrentQuestion,
  getRaceState,
  heartbeatRacePlayer,
  reconnectRacePlayer,
} from "../../../../api/racePlayerApi";
import { createStudentRaceEventSource, requestFinishArbitration } from "../../../../api/studentRaceLiveApi.js";
import { RACE_PLAYER_RUNTIME_SESSION_CONFIG } from "../../../../shared/racePlayer/racePlayerRuntimeSessionConfig";
import { STUDENT_RACE_RESULTS_CONFIG } from "../../config/studentRaceResultsConfig";
import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import { STUDENT_RACE_ANIMATION_CONFIG } from "../../config/raceAnimationConfig";
import { resolveResultsProofDelayMs } from "../../utils/resultsProofSchedule";
import {
  resultsFinishOrder,
  resultsOpponent,
  resultsRaceState,
  resultsSnapshot,
} from "../../runtime/studentRaceResultsTestFixtures";
import { raceSnapshot } from "../../runtime/studentRaceTestFixtures";

vi.mock("../../../../api/studentRaceLiveApi.js", () => ({
  createStudentRaceEventSource: vi.fn(() => ({ close: vi.fn() })),
  requestFinishArbitration: vi.fn(),
}));

vi.mock("../../../../api/racePlayerApi", () => ({
  joinRace: vi.fn(),
  getRaceState: vi.fn(),
  getCurrentQuestion: vi.fn(),
  submitAnswer: vi.fn(),
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

vi.mock("../../pixi/PixiStudentRaceCanvas", () => ({
  default: () => <div data-testid="race-canvas" />,
}));

const OWN_ID = 1;
const FIRST_PROOF_DELAY_MS = resolveResultsProofDelayMs(0, OWN_ID);
const QUIET_WINDOW_MS = RACE_PLAYER_RUNTIME_SESSION_CONFIG.heartbeatIntervalMs * 3;

function reconnectOutcome(outcome, raceStatus) {
  return { outcome, online: false, canContinueRace: false, playerStatus: "FINISHED", raceStatus };
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

async function advance(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  heartbeatRacePlayer.mockResolvedValue({});
  getCurrentQuestion.mockReturnValue(new Promise(() => {}));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StudentRacePage — results watching after a reload", () => {
  it("watches passively, keeps presence off and restores the proof after the staggered delay", async () => {
    reconnectRacePlayer.mockResolvedValue(reconnectOutcome("PLAYER_FINISHED", "IN_PROGRESS"));
    getRaceState.mockResolvedValue(resultsRaceState());
    requestFinishArbitration.mockResolvedValue({
      raceId: 7,
      snapshot: raceSnapshot(resultsSnapshot()),
      finishOrder: resultsFinishOrder([1, 1], [2, 2], [3, 3]),
    });

    renderPage();
    await advance(0);

    expect(createStudentRaceEventSource).toHaveBeenCalledTimes(1);
    expect(createStudentRaceEventSource).toHaveBeenLastCalledWith(12);

    await advance(FIRST_PROOF_DELAY_MS - 1);
    expect(requestFinishArbitration).not.toHaveBeenCalled();

    await advance(1);
    expect(requestFinishArbitration).toHaveBeenCalledTimes(1);

    await advance(QUIET_WINDOW_MS);
    expect(requestFinishArbitration).toHaveBeenCalledTimes(1);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
    expect(getCurrentQuestion).not.toHaveBeenCalled();
    expect(createStudentRaceEventSource.mock.results[0].value.close).not.toHaveBeenCalled();
  });

  it("polls race-state every five seconds while the race still runs", async () => {
    reconnectRacePlayer.mockResolvedValue(reconnectOutcome("PLAYER_FINISHED", "IN_PROGRESS"));
    getRaceState.mockResolvedValue(resultsRaceState());
    requestFinishArbitration.mockReturnValue(new Promise(() => {}));

    renderPage();
    await advance(0);
    expect(getRaceState).toHaveBeenCalledTimes(1);

    await advance(STUDENT_RACE_RESULTS_CONFIG.watchPollMs * 2);

    expect(getRaceState).toHaveBeenCalledTimes(3);
  });

  it("goes straight to final results without proof, polling or a stream when the race already ended", async () => {
    reconnectRacePlayer.mockResolvedValue(reconnectOutcome("RACE_FINISHED", "FINISHED"));
    getRaceState.mockResolvedValue(resultsRaceState({ raceStatus: "FINISHED", raceFinished: true }));

    renderPage();
    await advance(0);
    await advance(QUIET_WINDOW_MS);

    expect(getRaceState).toHaveBeenCalledTimes(1);
    expect(requestFinishArbitration).not.toHaveBeenCalled();
    expect(createStudentRaceEventSource).not.toHaveBeenCalled();
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
  });
});

describe("StudentRacePage — finishing live while the race runs", () => {
  it("keeps one stream, never revives presence or questions, and hands later proofs to the scheduler", async () => {
    const ceremonyMs = STUDENT_RACE_ANIMATION_CONFIG.effects.finishEffectDurationMs;
    const racing = {
      playerStatus: "RACING",
      playerFinished: false,
      playerFinishedAtEpochMs: null,
      position: 900,
      rank: 2,
      opponents: [resultsOpponent(2, "RACING", 1), resultsOpponent(3, "RACING", 3)],
    };
    const finished = {
      eventVersion: 13,
      snapshotAtEpochMs: 11_000,
      opponents: [resultsOpponent(2, "RACING", 2), resultsOpponent(3, "RACING", 3)],
    };
    const opponentFinished = {
      eventVersion: 14,
      snapshotAtEpochMs: 12_000,
      opponents: [resultsOpponent(2, "FINISHED", 2), resultsOpponent(3, "RACING", 3)],
    };
    reconnectRacePlayer.mockResolvedValue({
      outcome: "RECONNECTED",
      online: true,
      canContinueRace: true,
      playerStatus: "RACING",
      raceStatus: "IN_PROGRESS",
    });
    getRaceState
      .mockResolvedValueOnce(resultsRaceState(racing))
      .mockResolvedValueOnce(resultsRaceState(finished))
      .mockResolvedValue(resultsRaceState(opponentFinished));
    requestFinishArbitration
      .mockResolvedValueOnce({
        raceId: 7,
        snapshot: raceSnapshot(resultsSnapshot(finished)),
        finishOrder: resultsFinishOrder([1, 1]),
      })
      .mockResolvedValue({
        raceId: 7,
        snapshot: raceSnapshot(resultsSnapshot(opponentFinished)),
        finishOrder: resultsFinishOrder([1, 1], [2, 2]),
      });

    renderPage();
    await advance(0);
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1);

    await advance(STUDENT_RACE_CONFIG.raceStatePollMs);
    await advance(ceremonyMs + 100);
    const ceremonyProofs = requestFinishArbitration.mock.calls.length;
    expect(ceremonyProofs).toBeGreaterThanOrEqual(1);

    await advance(STUDENT_RACE_RESULTS_CONFIG.watchPollMs - ceremonyMs - 100 + 1);
    expect(getRaceState).toHaveBeenCalledTimes(3);
    await advance(FIRST_PROOF_DELAY_MS - 50);
    expect(requestFinishArbitration).toHaveBeenCalledTimes(ceremonyProofs);

    await advance(100);
    expect(requestFinishArbitration).toHaveBeenCalledTimes(ceremonyProofs + 1);

    await advance(QUIET_WINDOW_MS);
    expect(requestFinishArbitration).toHaveBeenCalledTimes(ceremonyProofs + 1);
    expect(heartbeatRacePlayer).not.toHaveBeenCalled();
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1);
    expect(createStudentRaceEventSource).toHaveBeenCalledTimes(1);
    expect(createStudentRaceEventSource.mock.results[0].value.close).not.toHaveBeenCalled();
  });
});
