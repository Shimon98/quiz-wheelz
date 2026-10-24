import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import StudentRacePage from "../StudentRacePage";
import StudentRaceContent from "../../components/StudentRaceContent";
import {
  getCurrentQuestion,
  getRaceState,
  heartbeatRacePlayer,
  reconnectRacePlayer,
  submitAnswer,
} from "../../../../api/racePlayerApi";

vi.mock("../../../../api/studentRaceLiveApi.js", () => ({
  createStudentRaceEventSource: vi.fn(() => ({ close: vi.fn() })),
}));

vi.mock("../../../../api/racePlayerApi", () => ({
  joinRace: vi.fn(),
  getRaceState: vi.fn(),
  getCurrentQuestion: vi.fn(),
  submitAnswer: vi.fn(),
  chooseChallenge: vi.fn(),
  heartbeatRacePlayer: vi.fn(),
  reconnectRacePlayer: vi.fn(),
}));

vi.mock("../../pixi/PixiStudentRaceCanvas", () => ({
  default: () => <div data-testid="race-canvas" />,
}));

vi.mock("../../components/StudentRaceContent", async (importOriginal) => {
  const { default: Content } = await importOriginal();
  return { default: vi.fn((props) => <Content {...props} />) };
});

const QUESTIONS = Object.freeze({
  17: { questionId: 17, questionText: "3 + 4 = ?", choices: [
    { choiceId: 1, choiceText: "7", displayOrder: 1 }, { choiceId: 2, choiceText: "8", displayOrder: 2 }] },
  18: { questionId: 18, questionText: "5 + 5 = ?", choices: [
    { choiceId: 3, choiceText: "10", displayOrder: 1 }, { choiceId: 4, choiceText: "11", displayOrder: 2 }] },
});

// A server that commits every answer it receives exactly once; the test can make it lose the HTTP response.
function createFakeServer() {
  const server = { score: 0, streak: 0, eventVersion: 0, at: 1_800_000_000_000, active: 17, commits: [], loseNextResponse: false };
  const snapshot = () => ({
    raceStatus: "IN_PROGRESS", playerStatus: "RACING", playerFinished: false, raceFinished: false,
    totalDistance: 1000, score: server.score, position: 100 + server.score, speed: 1, streak: server.streak,
    highestStreak: server.streak, eventVersion: server.eventVersion, opponents: [],
    snapshotAtEpochMs: server.at, movementUnitsPerSecond: 4,
  });
  server.raceState = () => ({
    raceId: 7, raceTitle: "Jungle Cup", roomCode: "ABC123",
    player: { racePlayerId: 91, displayName: "Noa", laneNumber: 3, vehicleTypeKey: "TOY_CAR", vehicleColorKey: "GREEN", vehicleAssetKey: "TOY_CAR_GREEN" },
    snapshot: snapshot(),
  });
  server.currentQuestion = () => ({
    ...QUESTIONS[server.active], timeLimitSeconds: 90, serverTimeEpochMs: Date.now(), expiresAtEpochMs: Date.now() + 90000,
  });
  server.answer = ({ questionId, choiceId }) => {
    if (questionId !== server.active) {
      return Promise.reject({ response: { status: 409, data: { error: "QUESTION_NOT_ACTIVE", code: 3021 } } });
    }
    server.commits.push({ questionId, choiceId });
    server.score += 10;
    server.streak += 1;
    server.eventVersion += 1;
    server.at += 500;
    server.active = 18;
    if (server.loseNextResponse) {
      server.loseNextResponse = false;
      return Promise.reject({ code: "ECONNABORTED", message: "timeout of 5000ms exceeded", request: {} });
    }
    return Promise.resolve({
      questionId, selectedChoiceId: choiceId, correct: true, correctAnswerChoiceId: null,
      raceImpact: { scoreDelta: 10, snapshot: snapshot() },
    });
  };
  return server;
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

const lastProps = () => StudentRaceContent.mock.lastCall[0];

let server;
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  server = createFakeServer();
  reconnectRacePlayer.mockResolvedValue({ outcome: "RECONNECTED", online: true, canContinueRace: true, playerStatus: "RACING", raceStatus: "IN_PROGRESS" });
  heartbeatRacePlayer.mockResolvedValue({});
  getRaceState.mockImplementation(() => Promise.resolve(server.raceState()));
  getCurrentQuestion.mockImplementation(() => Promise.resolve(server.currentQuestion()));
  submitAnswer.mockImplementation((body) => server.answer(body));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StudentRacePage — an answer the server committed but whose response was lost", () => {
  it("never re-sends it, moves on to the server's next question and shows the server's score once", async () => {
    server.loseNextResponse = true;
    renderPage();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "7" })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    expect(server.commits).toEqual([{ questionId: 17, choiceId: 1 }]);
    expect(submitAnswer).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "7" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10" })).toBeEnabled();
    expect(lastProps().runtimeState.player.score).toBe(10);
    expect(lastProps().questionProps.answerFeedback).toBeNull();

    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(submitAnswer).toHaveBeenCalledTimes(1);
    expect(server.score).toBe(10);
  });

  it("counts the next answer normally after the recovery: one POST and one reward per question", async () => {
    server.loseNextResponse = true;
    renderPage();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "7" })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "10" })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });

    expect(server.commits.map(({ questionId }) => questionId)).toEqual([17, 18]);
    expect(submitAnswer).toHaveBeenCalledTimes(2);
    expect(lastProps().runtimeState.player.score).toBe(20);
    expect(lastProps().questionProps.answerFeedback).toMatchObject({ questionId: 18, correct: true, scoreDelta: 10 });
  });
});
