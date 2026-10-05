import { describe, expect, it } from "vitest";

import { STUDENT_RACE_FEEDBACK } from "../../runtime/studentRaceRuntimeConstants";
import { isQuestionTimeUp } from "../isQuestionTimeUp";

describe("isQuestionTimeUp", () => {
  it("is true when the timer ran out or the server rejected the answer as expired", () => {
    expect(isQuestionTimeUp({ isExpired: true, feedbackState: STUDENT_RACE_FEEDBACK.IDLE })).toBe(true);
    expect(isQuestionTimeUp({ isExpired: false, feedbackState: STUDENT_RACE_FEEDBACK.EXPIRED })).toBe(true);
  });

  it("never presents time up over a real answer or an in-flight submit", () => {
    expect(isQuestionTimeUp({ isExpired: true, feedbackState: STUDENT_RACE_FEEDBACK.CORRECT })).toBe(false);
    expect(isQuestionTimeUp({ isExpired: true, feedbackState: STUDENT_RACE_FEEDBACK.WRONG })).toBe(false);
    expect(isQuestionTimeUp({ isExpired: true, feedbackState: STUDENT_RACE_FEEDBACK.IDLE, isSubmitting: true })).toBe(false);
    expect(isQuestionTimeUp({ isExpired: false, feedbackState: STUDENT_RACE_FEEDBACK.IDLE })).toBe(false);
  });
});
