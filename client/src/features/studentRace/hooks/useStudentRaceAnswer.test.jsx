import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { submitAnswer } from "../../../api/racePlayerApi";
import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import useStudentRaceAnswer from "./useStudentRaceAnswer";

vi.mock("../../../api/racePlayerApi", () => ({ submitAnswer: vi.fn() }));

function question(id = 17) {
  return { id, choices: [{ id: 1 }, { id: 2 }] };
}

function response({ id = 17, correct = true, scoreDelta = 10, streak = 3 } = {}) {
  return {
    questionId: id,
    selectedChoiceId: 1,
    correct,
    correctAnswerChoiceId: correct ? null : 2,
    raceImpact: {
      scoreDelta,
      snapshot: {
        streak,
        score: 80,
        position: 110,
        speed: 1.3,
        highestStreak: streak,
        totalDistance: 1000,
        movementUnitsPerSecond: 5.2,
        snapshotAtEpochMs: 10000,
        raceStatus: "IN_PROGRESS",
        playerStatus: "RACING",
        playerFinished: false,
        raceFinished: false,
      },
    },
  };
}

function setup() {
  const initialQuestion = question();
  const refreshQuestion = vi.fn();
  const applyAuthoritativeSnapshot = vi.fn();
  const hook = renderHook(
    ({ currentQuestion }) => useStudentRaceAnswer({
      question: currentQuestion,
      refreshQuestion,
      applyAuthoritativeSnapshot,
    }),
    { initialProps: { currentQuestion: initialQuestion } },
  );
  return { ...hook, initialQuestion, refreshQuestion, applyAuthoritativeSnapshot };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useStudentRaceAnswer accepted feedback", () => {
  it("waits for server acceptance, keeps one in-flight answer and forwards its snapshot unchanged", async () => {
    let resolveResponse;
    submitAnswer.mockReturnValue(new Promise((resolve) => { resolveResponse = resolve; }));
    const { result, applyAuthoritativeSnapshot } = setup();

    act(() => {
      result.current.submitChoice(1);
      result.current.submitChoice(1);
    });
    expect(submitAnswer).toHaveBeenCalledTimes(1);
    expect(result.current.answerFeedback).toBeNull();
    expect(result.current.isSubmitting).toBe(true);
    expect(applyAuthoritativeSnapshot).not.toHaveBeenCalled();
    const accepted = response();
    await act(async () => { resolveResponse(accepted); });

    expect(applyAuthoritativeSnapshot).toHaveBeenCalledWith(accepted.raceImpact.snapshot);
    expect(result.current.answerFeedback).toEqual({ questionId: 17, correct: true, scoreDelta: 10, streak: 3 });
  });

  it("expires accepted feedback at the dwell boundary even while the next question is still loading", async () => {
    submitAnswer.mockResolvedValue(response());
    const { result, refreshQuestion, rerender, initialQuestion } = setup();
    await act(async () => { await result.current.submitChoice(1); });
    const feedback = result.current.answerFeedback;
    rerender({ currentQuestion: { ...initialQuestion } });
    expect(result.current.answerFeedback).toBe(feedback);

    await act(async () => { await vi.advanceTimersByTimeAsync(STUDENT_RACE_CONFIG.feedbackDelayMs - 1); });
    expect(result.current.answerFeedback).toBe(feedback);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });

    expect(result.current.answerFeedback).toBeNull();
    expect(refreshQuestion).toHaveBeenCalledTimes(1);
    rerender({ currentQuestion: question(18) });
    expect(result.current.answerFeedback).toBeNull();
  });

  it("keeps accepted feedback with its frozen displayed question during a background refresh", async () => {
    submitAnswer.mockResolvedValue(response());
    const { result, rerender, initialQuestion } = setup();
    await act(async () => { await result.current.submitChoice(1); });
    const acceptedFeedback = result.current.answerFeedback;
    const nextQuestion = question(18);
    rerender({ currentQuestion: nextQuestion });

    expect(result.current.answerFeedback).toBe(acceptedFeedback);
    expect(result.current.displayedQuestion).toBe(initialQuestion);
    await act(async () => { await vi.advanceTimersByTimeAsync(STUDENT_RACE_CONFIG.feedbackDelayMs); });
    expect(result.current.answerFeedback).toBeNull();
    expect(result.current.displayedQuestion).toBe(nextQuestion);
  });

  it("celebrates a deferred accepted response even when expiry refresh already fetched the next question", async () => {
    let resolveResponse;
    submitAnswer.mockReturnValue(new Promise((resolve) => { resolveResponse = resolve; }));
    const { result, rerender, initialQuestion } = setup();
    act(() => { result.current.submitChoice(1); });
    const nextQuestion = question(18);
    rerender({ currentQuestion: nextQuestion });
    expect(result.current.answerFeedback).toBeNull();
    expect(result.current.displayedQuestion).toBe(initialQuestion);

    await act(async () => { resolveResponse(response()); });
    expect(result.current.answerFeedback).toEqual({ questionId: 17, correct: true, scoreDelta: 10, streak: 3 });
    expect(result.current.displayedQuestion).toBe(initialQuestion);
    await act(async () => { await vi.advanceTimersByTimeAsync(STUDENT_RACE_CONFIG.feedbackDelayMs - 1); });
    expect(result.current.answerFeedback.questionId).toBe(17);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(result.current.answerFeedback).toBeNull();
    expect(result.current.feedbackState).toBe("idle");
    expect(result.current.displayedQuestion).toBe(nextQuestion);
  });

  it("replaces the feedback identity for the next accepted correct answer", async () => {
    submitAnswer.mockResolvedValueOnce(response()).mockResolvedValueOnce(response({ id: 18, streak: 4 }));
    const { result, rerender } = setup();
    await act(async () => { await result.current.submitChoice(1); });
    const first = result.current.answerFeedback;
    await act(async () => { await vi.advanceTimersByTimeAsync(STUDENT_RACE_CONFIG.feedbackDelayMs); });
    rerender({ currentQuestion: question(18) });
    await act(async () => { await result.current.submitChoice(1); });

    expect(result.current.answerFeedback).toEqual({ questionId: 18, correct: true, scoreDelta: 10, streak: 4 });
    expect(first.streak).toBe(3);
  });

  it("retains a server-accepted wrong answer without inventing a combo", async () => {
    submitAnswer.mockResolvedValue(response({ correct: false, scoreDelta: 0, streak: 0 }));
    const { result } = setup();
    await act(async () => { await result.current.submitChoice(1); });

    expect(result.current.answerFeedback).toEqual({ questionId: 17, correct: false, scoreDelta: 0, streak: 0 });
    expect(result.current.correctAnswerChoiceId).toBe(2);
  });

  it("produces no celebration for a rejected request or malformed feedback payload", async () => {
    submitAnswer.mockRejectedValueOnce({ request: {}, message: "Network Error" })
      .mockResolvedValueOnce(response({ streak: -1 }));
    const { result, refreshQuestion, applyAuthoritativeSnapshot } = setup();
    await act(async () => { await result.current.submitChoice(1); });
    expect(result.current.answerFeedback).toBeNull();
    await act(async () => { await result.current.submitChoice(1); });

    expect(result.current.answerFeedback).toBeNull();
    expect(applyAuthoritativeSnapshot).not.toHaveBeenCalled();
    expect(refreshQuestion).toHaveBeenCalledTimes(2);
  });

  it("cancels the dwell callback when the answer flow unmounts", async () => {
    submitAnswer.mockResolvedValue(response());
    const { result, unmount, refreshQuestion } = setup();
    await act(async () => { await result.current.submitChoice(1); });
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(STUDENT_RACE_CONFIG.feedbackDelayMs); });

    expect(refreshQuestion).not.toHaveBeenCalled();
  });

  it.each(["speed", "playerFinished", "raceFinished"])(
    "rejects a snapshot missing %s before persisting it or showing a reward", async (field) => {
      const malformed = response();
      delete malformed.raceImpact.snapshot[field];
      submitAnswer.mockResolvedValue(malformed);
      const { result, applyAuthoritativeSnapshot, refreshQuestion } = setup();
      await act(async () => { await result.current.submitChoice(1); });

      expect(applyAuthoritativeSnapshot).not.toHaveBeenCalled();
      expect(result.current.answerFeedback).toBeNull();
      expect(result.current.feedbackState).toBe("error");
      expect(refreshQuestion).toHaveBeenCalledTimes(1);
    },
  );
});
