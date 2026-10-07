import { STUDENT_RACE_FEEDBACK } from "../runtime/studentRaceRuntimeConstants";

export function isQuestionTimeUp({ isExpired = false, feedbackState, isSubmitting = false }) {
  const showsAnswer = feedbackState === STUDENT_RACE_FEEDBACK.CORRECT || feedbackState === STUDENT_RACE_FEEDBACK.WRONG;
  return !showsAnswer && !isSubmitting && (isExpired === true || feedbackState === STUDENT_RACE_FEEDBACK.EXPIRED);
}
