import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { getQuestionRemainingMs } from "../runtime/questionTiming";

export function getStudentRaceTimerModel(question, now = Date.now()) {
  const durationMs = question.timeLimitSeconds * 1000;
  const remainingMs = Math.min(durationMs, getQuestionRemainingMs(question, now));
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, Math.max(0, remainingMs / durationMs));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  const { warningSeconds, dangerSeconds } = STUDENT_RACE_CONFIG.timer;
  const urgency = remainingSeconds <= dangerSeconds
    ? "danger"
    : remainingSeconds <= warningSeconds ? "warning" : "normal";

  return {
    remainingSeconds,
    timeText: `${minutes}:${seconds}`,
    urgency,
    progressStyle: { width: `${progress * 100}%` },
  };
}
