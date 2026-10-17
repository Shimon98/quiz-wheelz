import { STUDENT_RACE_CONFIG } from "../config/studentRaceConfig";
import { getQuestionRemainingMs } from "../runtime/questionTiming";

const MS_PER_SECOND = 1000;

export function getStudentRaceTimerModel(countdown, now = Date.now()) {
  const durationMs = Number.isSafeInteger(countdown.timeLimitSeconds) && countdown.timeLimitSeconds > 0
    ? countdown.timeLimitSeconds * MS_PER_SECOND
    : null;
  const deadlineRemainingMs = getQuestionRemainingMs(countdown, now);
  const remainingMs = durationMs == null ? deadlineRemainingMs : Math.min(durationMs, deadlineRemainingMs);
  const remainingSeconds = Math.ceil(remainingMs / MS_PER_SECOND);
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
    progressStyle: durationMs == null
      ? null
      : { width: `${Math.min(1, Math.max(0, remainingMs / durationMs)) * 100}%` },
  };
}
