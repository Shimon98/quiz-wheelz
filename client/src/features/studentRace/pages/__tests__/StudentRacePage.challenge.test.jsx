import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import i18n from "../../../../i18n/i18n";
import StudentRacePage from "../StudentRacePage";
import {
  chooseChallenge,
  getCurrentQuestion,
  getRaceState,
  heartbeatRacePlayer,
  reconnectRacePlayer,
  submitAnswer,
} from "../../../../api/racePlayerApi";
import { STUDENT_RACE_CONFIG } from "../../config/studentRaceConfig";
import { axiosTimeoutAfter } from "../../../../test/axiosTimeout";

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

const SNAPSHOT_AT = 1_800_000_000_000;

function challenge(overrides = {}) {
  return { energy: 75, threshold: 100, offer: null, run: null, lastResult: null, ...overrides };
}

function offer(overrides = {}) {
  return { offerId: 5, expiresAtEpochMs: SNAPSHOT_AT + 12000, choices: ["TURBO_TRIAL", "SAFE_RUN"], ...overrides };
}

function snapshot({ mode = "NORMAL", eventVersion = 0, at = SNAPSHOT_AT, challengePart = challenge() } = {}) {
  return {
    raceStatus: "IN_PROGRESS",
    playerStatus: "RACING",
    playerFinished: false,
    raceFinished: false,
    totalDistance: 1000,
    score: 0,
    position: 100,
    speed: 1,
    streak: 0,
    highestStreak: 0,
    eventVersion,
    opponents: [],
    snapshotAtEpochMs: at,
    movementUnitsPerSecond: 4,
    gameplay: { mode, effectiveSpeed: 1, activeEffects: [], challenge: challengePart },
  };
}

function raceState(snapshotValue) {
  return {
    raceId: 7,
    raceTitle: "Jungle Cup",
    roomCode: "ABC123",
    player: {
      racePlayerId: 91,
      displayName: "Noa",
      laneNumber: 3,
      vehicleTypeKey: "TOY_CAR",
      vehicleColorKey: "GREEN",
      vehicleAssetKey: "TOY_CAR_GREEN",
    },
    snapshot: snapshotValue,
  };
}

function choosingSnapshot(offerOverrides = {}) {
  return snapshot({ mode: "CHALLENGE_CHOICE", eventVersion: 1, at: SNAPSHOT_AT + 100,
    challengePart: challenge({ energy: 0, offer: offer(offerOverrides) }) });
}

function question(overrides = {}) {
  return {
    questionId: 17,
    questionText: "3 + 4 = ?",
    timeLimitSeconds: 20,
    serverTimeEpochMs: Date.now(),
    expiresAtEpochMs: Date.now() + 20000,
    choices: [
      { choiceId: 1, choiceText: "7", displayOrder: 1 },
      { choiceId: 2, choiceText: "8", displayOrder: 2 },
    ],
    ...overrides,
  };
}

const turboCard = () => screen.queryByRole("button", { name: new RegExp(i18n.t("studentRace:gameplay.turbo.title")) });
const safeCard = () => screen.queryByRole("button", { name: new RegExp(i18n.t("studentRace:gameplay.safe.title")) });
const resyncButton = () => screen.queryByRole("button", { name: i18n.t("studentRace:gameplay.choice.resync") });
const LOST_RESPONSE = { code: "ERR_NETWORK", message: "Network Error" };

function turboSnapshot({ eventVersion = 2, at = SNAPSHOT_AT + 500, questionsResolved = 0 } = {}) {
  return snapshot({ mode: "TURBO_TRIAL", eventVersion, at, challengePart: challenge({ energy: 0,
    run: { challengeId: 5, type: "TURBO_TRIAL", questionsResolved, totalQuestions: 1, correctAnswers: 0 } }) });
}

function turboChoiceResponse() {
  return { offerId: 5, choice: "TURBO_TRIAL", selectedAtEpochMs: SNAPSHOT_AT + 500, snapshot: turboSnapshot() };
}

async function flush(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
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
  vi.useFakeTimers();
  vi.setSystemTime(SNAPSHOT_AT);
  vi.clearAllMocks();
  reconnectRacePlayer.mockResolvedValue({ outcome: "RECONNECTED", online: true, canContinueRace: true,
    playerStatus: "RACING", raceStatus: "IN_PROGRESS" });
  heartbeatRacePlayer.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StudentRacePage challenge flow", () => {
  it("keeps the answer feedback for its dwell, asks for no question and then shows the cards", async () => {
    getRaceState.mockResolvedValue(raceState(snapshot()));
    getCurrentQuestion.mockResolvedValueOnce(question()).mockReturnValue(new Promise(() => {}));
    submitAnswer.mockResolvedValue({ questionId: 17, selectedChoiceId: 1, correct: true, correctAnswerChoiceId: null,
      raceImpact: { scoreDelta: 10, snapshot: choosingSnapshot() } });
    renderPage();
    await flush();

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "7" })); });
    await flush();

    expect(screen.getByText("3 + 4 = ?")).toBeInTheDocument();
    expect(turboCard()).toBeNull();

    await flush(STUDENT_RACE_CONFIG.feedbackDelayMs);

    expect(turboCard()).toBeEnabled();
    expect(screen.queryByText("3 + 4 = ?")).not.toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("studentRace:timer.challengeLabel"))).toBeInTheDocument();
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1);
  });

  it("sends one choice and then asks once for the Turbo question", async () => {
    getRaceState.mockResolvedValue(raceState(choosingSnapshot()));
    getCurrentQuestion.mockResolvedValue(question({ questionId: 30, gameplayContext: "TURBO_TRIAL", questionText: "12 × 12 = ?" }));
    chooseChallenge.mockResolvedValue({ offerId: 5, choice: "TURBO_TRIAL", selectedAtEpochMs: SNAPSHOT_AT + 500,
      snapshot: snapshot({ mode: "TURBO_TRIAL", eventVersion: 2, at: SNAPSHOT_AT + 500,
        challengePart: challenge({ energy: 0, run: { challengeId: 5, type: "TURBO_TRIAL", questionsResolved: 0,
          totalQuestions: 1, correctAnswers: 0 } }) }) });
    renderPage();
    await flush();

    expect(getCurrentQuestion).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(turboCard());
      fireEvent.click(turboCard());
    });
    await flush();

    expect(chooseChallenge).toHaveBeenCalledExactlyOnceWith({ offerId: 5, choice: "TURBO_TRIAL" },
      { timeoutMs: STUDENT_RACE_CONFIG.challengeChoiceTimeoutMs });
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1);
    expect(screen.getByText("12 × 12 = ?")).toBeInTheDocument();
    expect(screen.getByText(i18n.t("studentRace:gameplay.turbo.title"))).toBeInTheDocument();
  });

  it("answers a question refused for an open offer with fresh race state instead of an error", async () => {
    getRaceState.mockResolvedValueOnce(raceState(snapshot())).mockResolvedValue(raceState(choosingSnapshot()));
    getCurrentQuestion.mockRejectedValue({ response: { status: 409, data: { error: "CHALLENGE_CHOICE_REQUIRED", code: 3034 } } });
    renderPage();
    await flush();
    await flush();

    expect(getRaceState).toHaveBeenCalledTimes(2);
    expect(turboCard()).toBeEnabled();
    expect(screen.queryByText(i18n.t("studentRace:question.errorTitle"))).not.toBeInTheDocument();
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1);
  });

  it("checks a choice whose response was lost with a fresh read and follows it into the run", async () => {
    getRaceState.mockResolvedValueOnce(raceState(choosingSnapshot())).mockResolvedValue(raceState(turboSnapshot()));
    getCurrentQuestion.mockResolvedValue(question({ questionId: 30, gameplayContext: "TURBO_TRIAL", questionText: "12 × 12 = ?" }));
    chooseChallenge.mockRejectedValue(LOST_RESPONSE);
    renderPage();
    await flush();
    const readsBeforeChoice = getRaceState.mock.calls.length;

    await act(async () => { fireEvent.click(turboCard()); });
    await flush();

    expect(getRaceState).toHaveBeenCalledTimes(readsBeforeChoice + 1);
    expect(chooseChallenge.mock.invocationCallOrder[0])
      .toBeLessThan(getRaceState.mock.invocationCallOrder[readsBeforeChoice]);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1);
    expect(screen.getByText("12 × 12 = ?")).toBeInTheDocument();
  });

  it("lets only the first choice go again when the fresh read still shows the same offer", async () => {
    getRaceState.mockResolvedValueOnce(raceState(choosingSnapshot()))
      .mockResolvedValue(raceState({ ...choosingSnapshot(), snapshotAtEpochMs: SNAPSHOT_AT + 700 }));
    getCurrentQuestion.mockResolvedValue(question({ questionId: 30, gameplayContext: "TURBO_TRIAL", questionText: "12 × 12 = ?" }));
    chooseChallenge.mockRejectedValueOnce(LOST_RESPONSE).mockResolvedValueOnce(turboChoiceResponse());
    renderPage();
    await flush();

    await act(async () => { fireEvent.click(turboCard()); });
    await flush();

    expect(screen.getByText(i18n.t("studentRace:gameplay.choice.retry"))).toBeInTheDocument();
    expect(turboCard()).toBeEnabled();
    expect(safeCard()).toBeDisabled();
    expect(chooseChallenge).toHaveBeenCalledTimes(1);

    await act(async () => { fireEvent.click(turboCard()); });
    await flush();

    expect(chooseChallenge).toHaveBeenCalledTimes(2);
    expect(chooseChallenge).toHaveBeenLastCalledWith({ offerId: 5, choice: "TURBO_TRIAL" },
      { timeoutMs: STUDENT_RACE_CONFIG.challengeChoiceTimeoutMs });
    expect(screen.getByText("12 × 12 = ?")).toBeInTheDocument();
  });

  it("offers a manual sync for an unreadable offer, ignores repeated taps and recovers", async () => {
    const unreadable = snapshot({ mode: "CHALLENGE_CHOICE", eventVersion: 1, at: SNAPSHOT_AT + 100,
      challengePart: challenge({ energy: 0, offer: offer({ choices: [] }) }) });
    let resolveRead;
    getRaceState.mockResolvedValueOnce(raceState(unreadable))
      .mockReturnValueOnce(new Promise((done) => { resolveRead = done; }));
    renderPage();
    await flush();
    const readsBeforeSync = getRaceState.mock.calls.length;

    expect(screen.getByText(i18n.t("studentRace:gameplay.choice.syncing"))).toBeInTheDocument();
    expect(turboCard()).toBeNull();
    expect(getCurrentQuestion).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(resyncButton());
      fireEvent.click(resyncButton());
    });

    expect(getRaceState).toHaveBeenCalledTimes(readsBeforeSync + 1);
    expect(resyncButton()).toBeNull();

    await act(async () => { resolveRead(raceState({ ...choosingSnapshot(), snapshotAtEpochMs: SNAPSHOT_AT + 300 })); });
    await flush();

    expect(turboCard()).toBeEnabled();
  });

  it("asks for the next question only after the feedback dwell when the answer ends the run", async () => {
    getRaceState.mockResolvedValue(raceState(turboSnapshot()));
    getCurrentQuestion
      .mockResolvedValueOnce(question({ questionId: 30, gameplayContext: "TURBO_TRIAL", questionText: "12 × 12 = ?" }))
      .mockResolvedValue(question({ questionId: 31, gameplayContext: "NORMAL", questionText: "2 + 2 = ?" }));
    submitAnswer.mockResolvedValue({ questionId: 30, selectedChoiceId: 1, correct: true, correctAnswerChoiceId: null,
      raceImpact: { scoreDelta: 10, snapshot: snapshot({ mode: "NORMAL", eventVersion: 3, at: SNAPSHOT_AT + 900 }) } });
    renderPage();
    await flush();

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "7" })); });
    await flush(STUDENT_RACE_CONFIG.feedbackDelayMs - 1);

    expect(getCurrentQuestion).toHaveBeenCalledTimes(1);
    expect(screen.getByText("12 × 12 = ?")).toBeInTheDocument();

    await flush(1);

    expect(getCurrentQuestion).toHaveBeenCalledTimes(2);
    expect(screen.getByText("2 + 2 = ?")).toBeInTheDocument();
  });

  it("bounds a choice the server never answered and follows the server once it shows the run", async () => {
    getRaceState.mockImplementation((options) =>
      Promise.resolve(raceState(options?.timeoutMs ? turboSnapshot() : choosingSnapshot())));
    getCurrentQuestion.mockResolvedValue(question({ questionId: 30, gameplayContext: "TURBO_TRIAL", questionText: "12 × 12 = ?" }));
    chooseChallenge.mockImplementation((_request, { timeoutMs }) => axiosTimeoutAfter(timeoutMs));
    renderPage();
    await flush();

    await act(async () => { fireEvent.click(turboCard()); });
    await flush(STUDENT_RACE_CONFIG.challengeChoiceTimeoutMs - 1);

    expect(screen.getByText(i18n.t("studentRace:gameplay.choice.submitting"))).toBeInTheDocument();

    await flush(1);
    await flush();

    expect(getRaceState).toHaveBeenCalledWith({ timeoutMs: STUDENT_RACE_CONFIG.challengeCheckTimeoutMs });
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
    expect(screen.getByText("12 × 12 = ?")).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("studentRace:gameplay.choice.retry"))).not.toBeInTheDocument();
  });

  it("bounds the check read as well and leaves a manual sync instead of an endless wait", async () => {
    getRaceState.mockImplementation((options) => (options?.timeoutMs
      ? axiosTimeoutAfter(options.timeoutMs)
      : Promise.resolve(raceState(choosingSnapshot()))));
    chooseChallenge.mockImplementation((_request, { timeoutMs }) => axiosTimeoutAfter(timeoutMs));
    renderPage();
    await flush();

    await act(async () => { fireEvent.click(turboCard()); });
    await flush(STUDENT_RACE_CONFIG.challengeChoiceTimeoutMs);

    expect(screen.getByText(i18n.t("studentRace:gameplay.choice.reconciling"))).toBeInTheDocument();

    await flush(STUDENT_RACE_CONFIG.challengeCheckTimeoutMs);

    expect(screen.getByText(i18n.t("studentRace:gameplay.choice.syncFailed"))).toBeInTheDocument();
    expect(resyncButton()).toBeEnabled();
    expect(turboCard()).toBeDisabled();
    expect(getRaceState.mock.calls.filter(([options]) => options?.timeoutMs)).toHaveLength(1);
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
  });

  it("never reopens a card after a check read whose race state could not be applied", async () => {
    const broken = raceState({ ...choosingSnapshot(), snapshotAtEpochMs: null });
    getRaceState.mockImplementation((options) =>
      Promise.resolve(options?.timeoutMs ? broken : raceState(choosingSnapshot())));
    chooseChallenge.mockRejectedValue(LOST_RESPONSE);
    renderPage();
    await flush();

    await act(async () => { fireEvent.click(turboCard()); });
    await flush();

    expect(screen.getByText(i18n.t("studentRace:gameplay.choice.syncFailed"))).toBeInTheDocument();
    expect(screen.queryByText(i18n.t("studentRace:gameplay.choice.retry"))).not.toBeInTheDocument();
    expect(turboCard()).toBeDisabled();
    expect(safeCard()).toBeDisabled();
    expect(chooseChallenge).toHaveBeenCalledTimes(1);
  });

  it("locks the cards at the server deadline and asks for race state once", async () => {
    getRaceState.mockResolvedValue(raceState(choosingSnapshot({ expiresAtEpochMs: SNAPSHOT_AT + 1600 })));
    renderPage();
    await flush();
    const callsBeforeDeadline = getRaceState.mock.calls.length;

    await flush(1400);
    expect(getRaceState).toHaveBeenCalledTimes(callsBeforeDeadline);
    expect(turboCard()).toBeEnabled();

    await flush(100);
    expect(getRaceState).toHaveBeenCalledTimes(callsBeforeDeadline + 1);
    expect(turboCard()).toBeDisabled();
    expect(screen.getByText(i18n.t("studentRace:gameplay.choice.expired"))).toBeInTheDocument();
    expect(chooseChallenge).not.toHaveBeenCalled();
  });
});
