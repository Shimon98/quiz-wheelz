import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { useStudentRaceVisualPreview } from "./useStudentRaceVisualPreview";

const translate = (key) => key;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-07T12:00:00Z"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useStudentRaceVisualPreview", () => {
  it("labels the four fixed DEV samples without inventing standings", () => {
    const { result } = renderHook(() => useStudentRaceVisualPreview(translate));

    expect(result.current.question.text).toBe("preview.question");
    expect(result.current.question.choices.map(({ text }) => text)).toEqual([
      "preview.correct", "preview.combo", "preview.strongCombo", "preview.wrong",
    ]);
    expect(result.current.runtimeState.player.rank).toBeNull();
    expect(result.current.runtimeState.playerCount).toBeNull();
    expect(result.current.interactionEnabled).toBe(true);
  });

  it("replays matching accepted feedback once per question and resets after the shared dwell", () => {
    const { result } = renderHook(() => useStudentRaceVisualPreview(translate));
    const questionId = result.current.question.id;
    act(() => {
      result.current.onChoiceSelect(2);
      result.current.onChoiceSelect(3);
    });

    expect(result.current.answerFeedback).toEqual({ questionId, correct: true, scoreDelta: 10, streak: 3 });
    expect(result.current.selectedChoiceId).toBe(2);
    expect(result.current.feedbackState).toBe("correct");
    expect(result.current.correctAnswerChoiceId).toBeNull();
    expect(result.current.interactionEnabled).toBe(false);
    act(() => vi.advanceTimersByTime(STUDENT_RACE_CONFIG.feedbackDelayMs - 1));
    expect(result.current.answerFeedback.questionId).toBe(questionId);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.answerFeedback).toBeNull();
    expect(result.current.feedbackState).toBe("idle");
    expect(result.current.question.id).toBeGreaterThan(questionId);
    expect(result.current.interactionEnabled).toBe(true);
  });

  it("gives subsequent fixed samples unique IDs and a valid wrong-answer reveal", () => {
    const { result } = renderHook(() => useStudentRaceVisualPreview(translate));
    act(() => result.current.onChoiceSelect(3));
    const firstId = result.current.answerFeedback.questionId;
    expect(result.current.answerFeedback.streak).toBe(5);
    act(() => vi.advanceTimersByTime(STUDENT_RACE_CONFIG.feedbackDelayMs));
    act(() => result.current.onChoiceSelect(4));

    expect(result.current.answerFeedback).toEqual({
      questionId: result.current.question.id, correct: false, scoreDelta: 0, streak: 0,
    });
    expect(result.current.answerFeedback.questionId).not.toBe(firstId);
    expect(result.current.feedbackState).toBe("wrong");
    expect(result.current.question.choices.some(({ id }) => id === result.current.correctAnswerChoiceId)).toBe(true);
    expect(result.current.selectedChoiceId).toBe(4);
  });

  it("keeps the local movement fixture running while feedback changes only sample HUD values", () => {
    const { result } = renderHook(() => useStudentRaceVisualPreview(translate));
    const before = result.current.runtimeState;
    act(() => result.current.onChoiceSelect(2));

    expect(result.current.runtimeState.player.position).toBe(before.player.position);
    expect(result.current.runtimeState.player.speed).toBe(before.player.speed);
    expect(result.current.runtimeState.player.score).toBe(30);
    expect(result.current.runtimeState.player.streak).toBe(3);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.runtimeState.player.position).toBeGreaterThan(before.player.position);
    expect(result.current.answerFeedback.streak).toBe(3);
  });

  it("rejects unknown fixture choices and cleans both movement and dwell timers", () => {
    const { result, unmount } = renderHook(() => useStudentRaceVisualPreview(translate));
    act(() => result.current.onChoiceSelect(999));
    expect(result.current.answerFeedback).toBeNull();
    act(() => result.current.onChoiceSelect(1));
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
